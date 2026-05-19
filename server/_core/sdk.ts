import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { ForbiddenError } from "@shared/_core/errors";
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import { SignJWT, jwtVerify } from "jose";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { ENV } from "./env";

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

export type SessionPayload = {
  openId: string;
  appId: string;
  name: string;
};

// ---------------------------------------------------------------------------
// Hardcoded admin credentials (bypass OAuth for internal use)
// Override via environment variables ADMIN_USERNAME / ADMIN_PASSWORD
// ---------------------------------------------------------------------------
export const ADMIN_OPEN_ID = "local-admin";
export const ADMIN_USERNAME = process.env.ADMIN_USERNAME ?? "admin";
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "admin123";

class SDKServer {
  private parseCookies(cookieHeader: string | undefined) {
    if (!cookieHeader) return new Map<string, string>();
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }

  private getSessionSecret() {
    const secret = ENV.cookieSecret || "fallback-dev-secret-change-in-prod";
    return new TextEncoder().encode(secret);
  }

  /**
   * Verify username/password against hardcoded admin credentials.
   * Returns the admin User record (creating it in DB if needed).
   */
  async loginWithPassword(
    username: string,
    password: string
  ): Promise<User | null> {
    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      return null;
    }

    // Ensure admin user exists in DB — if DB is unavailable, create a synthetic user
    try {
      await db.upsertUser({
        openId: ADMIN_OPEN_ID,
        name: "Admin",
        email: null,
        loginMethod: "password",
        role: "admin",
        lastSignedIn: new Date(),
      });

      const user = await db.getUserByOpenId(ADMIN_OPEN_ID);
      if (user) return user;
    } catch (err) {
      console.warn("[Auth] DB unavailable, using synthetic admin user:", err);
    }

    // Fallback: return a synthetic admin user so login still works without DB
    return {
      id: 0,
      openId: ADMIN_OPEN_ID,
      name: "Admin",
      email: null,
      loginMethod: "password",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    } as User;
  }

  async createSessionToken(
    openId: string,
    options: { expiresInMs?: number; name?: string } = {}
  ): Promise<string> {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1000);
    const secretKey = this.getSessionSecret();

    return new SignJWT({
      openId,
      appId: ENV.appId || "local",
      name: options.name || "",
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(expirationSeconds)
      .sign(secretKey);
  }

  async verifySession(
    cookieValue: string | undefined | null
  ): Promise<{ openId: string; appId: string; name: string } | null> {
    if (!cookieValue) return null;

    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"],
      });
      const { openId, appId, name } = payload as Record<string, unknown>;

      if (!isNonEmptyString(openId) || !isNonEmptyString(appId)) {
        return null;
      }

      return { openId, appId, name: isNonEmptyString(name) ? name : "" };
    } catch {
      return null;
    }
  }

  async authenticateRequest(req: Request): Promise<User> {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);

    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }

    // Try DB first
    try {
      const user = await db.getUserByOpenId(session.openId);
      if (user) return user;
    } catch (err) {
      console.warn("[Auth] DB unavailable during auth, using session data:", err);
    }

    // Fallback: reconstruct user from JWT payload (works when DB is down)
    if (session.openId === ADMIN_OPEN_ID) {
      return {
        id: 0,
        openId: ADMIN_OPEN_ID,
        name: session.name || "Admin",
        email: null,
        loginMethod: "password",
        role: "admin",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      } as User;
    }

    throw ForbiddenError("User not found");
  }
}

export const sdk = new SDKServer();

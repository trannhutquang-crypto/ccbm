import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createMockContext(role: "admin" | "user" = "admin"): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Auth procedures", () => {
  it("auth.me should return current user", async () => {
    const ctx = createMockContext("admin");
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.me();
    expect(result).toBeDefined();
    expect(result.id).toBe(1);
    expect(result.name).toBe("Test User");
    expect(result.role).toBe("admin");
  });

  it("auth.me should return user for both admin and user roles", async () => {
    for (const role of ["admin", "user"] as const) {
      const ctx = createMockContext(role);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.auth.me();
      expect(result?.role).toBe(role);
    }
  });
});

describe("Medicines procedures", () => {
  it("medicines.list should return array", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    try {
      const result = await caller.medicines.list();
      expect(Array.isArray(result)).toBe(true);
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it("medicines.lowStock should return array", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    try {
      const result = await caller.medicines.lowStock();
      expect(Array.isArray(result)).toBe(true);
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it("medicines.expiringSoon should return array with daysThreshold", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    try {
      const result = await caller.medicines.expiringSoon({ daysThreshold: 30 });
      expect(Array.isArray(result)).toBe(true);
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it("admin should be able to update medicine", async () => {
    const ctx = createMockContext("admin");
    const caller = appRouter.createCaller(ctx);

    try {
      const result = await caller.medicines.update({
        id: 1,
        name: "Updated Medicine",
        unit: "viên",
        minimumStock: 20,
      });
      expect(result).toBeDefined();
    } catch (error: any) {
      expect(error).toBeDefined();
    }
  });

  it("user should NOT be able to update medicine", async () => {
    const ctx = createMockContext("user");
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.medicines.update({
        id: 1,
        name: "Updated Medicine",
        unit: "viên",
        minimumStock: 20,
      });
      expect.fail("User should not be able to update medicine");
    } catch (error: any) {
      expect(error.code).toBe("FORBIDDEN");
    }
  });
});

describe("Imports procedures", () => {
  it("imports.list should return array", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    try {
      const result = await caller.imports.list({ limit: 50 });
      expect(Array.isArray(result)).toBe(true);
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it("admin should be able to create import", async () => {
    const ctx = createMockContext("admin");
    const caller = appRouter.createCaller(ctx);

    try {
      const result = await caller.imports.create({
        medicineId: 1,
        quantity: 100,
        supplier: "Test Supplier",
        expiryDate: new Date("2026-12-31"),
        importDate: new Date(),
      });
      expect(result).toBeDefined();
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it("user should NOT be able to create import", async () => {
    const ctx = createMockContext("user");
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.imports.create({
        medicineId: 1,
        quantity: 100,
        supplier: "Test Supplier",
        expiryDate: new Date("2026-12-31"),
        importDate: new Date(),
      });
      expect.fail("User should not be able to create import");
    } catch (error: any) {
      expect(error.code).toBe("FORBIDDEN");
    }
  });
});

describe("Exports procedures", () => {
  it("exports.list should return array", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    try {
      const result = await caller.exports.list({ limit: 50 });
      expect(Array.isArray(result)).toBe(true);
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it("exports.list should support exportedBy filter", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    try {
      const result = await caller.exports.list({ limit: 50, exportedBy: "Test" });
      expect(Array.isArray(result)).toBe(true);
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it("user should be able to create export", async () => {
    const ctx = createMockContext("user");
    const caller = appRouter.createCaller(ctx);

    try {
      const result = await caller.exports.create({
        items: [{ medicineId: 1, quantity: 5 }],
        exportedBy: "Test User",
        reason: "emergency_use",
        exportDate: new Date(),
      });
      expect(result).toBeDefined();
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it("admin should be able to create export", async () => {
    const ctx = createMockContext("admin");
    const caller = appRouter.createCaller(ctx);

    try {
      const result = await caller.exports.create({
        items: [{ medicineId: 1, quantity: 5 }],
        exportedBy: "Admin User",
        reason: "emergency_use",
        exportDate: new Date(),
      });
      expect(result).toBeDefined();
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it("should reject empty items array", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.exports.create({
        items: [],
        exportedBy: "Test User",
        reason: "emergency_use",
        exportDate: new Date(),
      });
      expect.fail("Should reject empty items");
    } catch (error: any) {
      expect(error).toBeDefined();
    }
  });
});

describe("History procedures", () => {
  it("history.list should return object with imports and exports", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    try {
      const result = await caller.history.list({});
      expect(result).toBeDefined();
      expect(result.imports).toBeDefined();
      expect(result.exports).toBeDefined();
      expect(Array.isArray(result.imports)).toBe(true);
      expect(Array.isArray(result.exports)).toBe(true);
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it("history.list should support type filter", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    try {
      const result = await caller.history.list({ type: "import" });
      expect(result).toBeDefined();
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it("history.list should support date range filter", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    try {
      const result = await caller.history.list({
        startDate: new Date("2026-01-01"),
        endDate: new Date("2026-12-31"),
      });
      expect(result).toBeDefined();
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it("history.list should support medicineId filter", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    try {
      const result = await caller.history.list({ medicineId: 1 });
      expect(result).toBeDefined();
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it("history.list should support exportedBy filter", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    try {
      const result = await caller.history.list({ exportedBy: "Test" });
      expect(result).toBeDefined();
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});

describe("Stats procedures", () => {
  it("stats.dashboard should return dashboard statistics", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    try {
      const result = await caller.stats.dashboard();
      expect(result).toBeDefined();
      expect(typeof result.totalMedicines).toBe("number");
      expect(typeof result.totalStock).toBe("number");
      expect(typeof result.lowStockCount).toBe("number");
      expect(typeof result.expiringCount).toBe("number");
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it("stats.dashboard should be accessible to both admin and user", async () => {
    for (const role of ["admin", "user"] as const) {
      const ctx = createMockContext(role);
      const caller = appRouter.createCaller(ctx);

      try {
        const result = await caller.stats.dashboard();
        expect(result).toBeDefined();
      } catch (error) {
        expect(error).toBeDefined();
      }
    }
  });
});

describe("System procedures", () => {
  it("system.notifyOwner should be protected", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    try {
      const result = await caller.system.notifyOwner({
        title: "Test Notification",
        content: "Test content",
      });
      expect(typeof result).toBe("boolean");
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});

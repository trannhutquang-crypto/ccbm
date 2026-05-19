import { defineConfig } from "drizzle-kit";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to run drizzle commands");
}

// Strip ?ssl-mode=REQUIRED — drizzle-kit doesn't understand that param.
// SSL is handled via the `ssl` field in dbCredentials instead.
const url = new URL(connectionString);
const isAiven = url.hostname.includes("aivencloud.com");
url.searchParams.delete("ssl-mode");
const cleanUrl = url.toString();

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    url: cleanUrl,
    ...(isAiven ? { ssl: { rejectUnauthorized: false } } : {}),
  },
});

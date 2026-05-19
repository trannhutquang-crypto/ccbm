import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, date } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extended with additional tables for medicine inventory management.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Medicines table - stores emergency medicine catalog
 */
export const medicines = mysqlTable("medicines", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  unit: varchar("unit", { length: 50 }).notNull(), // e.g., "viên", "lọ", "hộp"
  minimumStock: int("minimumStock").notNull().default(0), // Định mức tồn kho tối thiểu
  currentStock: int("currentStock").notNull().default(0), // Số lượng tồn hiện tại
  retailPrice: decimal("retailPrice", { precision: 12, scale: 2 }), // Giá bán lẻ
  expiryDate: date("expiryDate"), // Hạn sử dụng gần nhất
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Medicine = typeof medicines.$inferSelect;
export type InsertMedicine = typeof medicines.$inferInsert;

/**
 * Import records table - tracks medicine imports
 */
export const importRecords = mysqlTable("importRecords", {
  id: int("id").autoincrement().primaryKey(),
  medicineId: int("medicineId").notNull(),
  quantity: int("quantity").notNull(),
  supplier: varchar("supplier", { length: 255 }).notNull(), // Nhà cung cấp
  batchNumber: varchar("batchNumber", { length: 100 }), // Số lô
  expiryDate: date("expiryDate").notNull(), // Hạn sử dụng
  importDate: date("importDate").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ImportRecord = typeof importRecords.$inferSelect;
export type InsertImportRecord = typeof importRecords.$inferInsert;

/**
 * Export records table - tracks medicine exports/usage
 */
export const exportRecords = mysqlTable("exportRecords", {
  id: int("id").autoincrement().primaryKey(),
  medicineId: int("medicineId").notNull(),
  quantity: int("quantity").notNull(),
  exportedBy: varchar("exportedBy", { length: 255 }).notNull(), // Tên người xuất
  reason: mysqlEnum("reason", [
    "emergency_use", // Sử dụng cấp cứu
    "expired", // Hết hạn
    "damaged", // Hỏng
    "other", // Khác
  ]).notNull(),
  totalPrice: decimal("totalPrice", { precision: 12, scale: 2 }), // Tổng giá bán
  exportDate: date("exportDate").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ExportRecord = typeof exportRecords.$inferSelect;
export type InsertExportRecord = typeof exportRecords.$inferInsert;

/**
 * Export items table - stores individual items in an export record
 * Allows tracking multiple medicines in a single export transaction
 */
export const exportItems = mysqlTable("exportItems", {
  id: int("id").autoincrement().primaryKey(),
  exportRecordId: int("exportRecordId").notNull(),
  medicineId: int("medicineId").notNull(),
  quantity: int("quantity").notNull(),
  unitPrice: decimal("unitPrice", { precision: 12, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ExportItem = typeof exportItems.$inferSelect;
export type InsertExportItem = typeof exportItems.$inferInsert;

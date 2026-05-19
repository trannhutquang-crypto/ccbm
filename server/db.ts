import { eq, and, gte, lte, desc, like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { InsertUser, users, medicines, importRecords, exportRecords, exportItems } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      // Aiven (and most cloud MySQL providers) require SSL.
      // Parse the URL to detect if it's an Aiven host, then enable SSL.
      const url = new URL(process.env.DATABASE_URL);
      const isAiven = url.hostname.includes("aivencloud.com");

      const pool = mysql.createPool({
        uri: process.env.DATABASE_URL,
        ssl: isAiven ? { rejectUnauthorized: false } : undefined,
        waitForConnections: true,
        connectionLimit: 5,
      });

      _db = drizzle(pool);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============= MEDICINE QUERIES =============

export async function createMedicine(data: {
  name: string;
  unit: string;
  minimumStock: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(medicines).values(data);
  return result;
}

export async function updateMedicine(id: number, data: Partial<{
  name: string;
  unit: string;
  minimumStock: number;
  expiryDate: Date | null;
}>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(medicines).set(data).where(eq(medicines.id, id));
}

export async function deleteMedicine(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.delete(medicines).where(eq(medicines.id, id));
}

export async function getMedicineById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(medicines).where(eq(medicines.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getAllMedicines() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(medicines).orderBy(desc(medicines.updatedAt));
}

export async function getMedicinesWithLowStock() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(medicines)
    .where(lte(medicines.currentStock, medicines.minimumStock))
    .orderBy(medicines.currentStock);
}

export async function getMedicinesExpiringSoon(daysThreshold: number = 30) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const today = new Date();
  const futureDate = new Date(today.getTime() + daysThreshold * 24 * 60 * 60 * 1000);
  
  return await db.select().from(medicines)
    .where(and(
      gte(medicines.expiryDate, today),
      lte(medicines.expiryDate, futureDate)
    ))
    .orderBy(medicines.expiryDate);
}

// ============= IMPORT QUERIES =============

export async function createImportRecord(data: {
  medicineId: number;
  quantity: number;
  supplier: string;
  batchNumber?: string;
  expiryDate: Date;
  importDate: Date;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(importRecords).values(data);
}

export async function getImportRecords(limit: number = 100, offset: number = 0) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(importRecords)
    .orderBy(desc(importRecords.importDate))
    .limit(limit)
    .offset(offset);
}

export async function getImportRecordsByMedicine(medicineId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(importRecords)
    .where(eq(importRecords.medicineId, medicineId))
    .orderBy(desc(importRecords.importDate));
}

// ============= EXPORT QUERIES =============

export async function createExportRecord(data: {
  medicineId: number;
  quantity: number;
  exportedBy: string;
  reason: "emergency_use" | "expired" | "damaged" | "other";
  totalPrice?: string;
  exportDate: Date;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(exportRecords).values(data);
}

export async function createExportItem(data: {
  exportRecordId: number;
  medicineId: number;
  quantity: number;
  unitPrice?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(exportItems).values(data);
}

export async function getExportRecords(limit: number = 100, offset: number = 0) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(exportRecords)
    .orderBy(desc(exportRecords.exportDate))
    .limit(limit)
    .offset(offset);
}

export async function getExportRecordsByMedicine(medicineId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(exportRecords)
    .where(eq(exportRecords.medicineId, medicineId))
    .orderBy(desc(exportRecords.exportDate));
}

export async function getExportItemsByRecord(exportRecordId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(exportItems)
    .where(eq(exportItems.exportRecordId, exportRecordId));
}

// ============= TRANSACTION HISTORY QUERIES =============

export async function getTransactionHistory(filters: {
  medicineId?: number;
  exportedBy?: string;
  startDate?: Date;
  endDate?: Date;
  type?: "import" | "export";
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const limit = filters.limit || 100;
  const offset = filters.offset || 0;
  
  const imports = [];
  const exports = [];
  
  // Get import records with filters
  if (!filters.type || filters.type === "import") {
    let importQuery = db.select().from(importRecords);
    
    if (filters.medicineId) {
      importQuery = importQuery.where(eq(importRecords.medicineId, filters.medicineId)) as any;
    }
    
    if (filters.startDate || filters.endDate) {
      const conditions = [];
      if (filters.startDate) {
        conditions.push(gte(importRecords.importDate, filters.startDate));
      }
      if (filters.endDate) {
        conditions.push(lte(importRecords.importDate, filters.endDate));
      }
      if (conditions.length > 0) {
        importQuery = importQuery.where(and(...conditions)) as any;
      }
    }
    
    const result = await importQuery
      .orderBy(desc(importRecords.importDate))
      .limit(limit)
      .offset(offset);
    imports.push(...result);
  }
  
  // Get export records with filters
  if (!filters.type || filters.type === "export") {
    let exportQuery = db.select().from(exportRecords);
    
    if (filters.medicineId) {
      exportQuery = exportQuery.where(eq(exportRecords.medicineId, filters.medicineId)) as any;
    }
    
    if (filters.exportedBy) {
      exportQuery = exportQuery.where(like(exportRecords.exportedBy, `%${filters.exportedBy}%`)) as any;
    }
    
    if (filters.startDate || filters.endDate) {
      const conditions = [];
      if (filters.startDate) {
        conditions.push(gte(exportRecords.exportDate, filters.startDate));
      }
      if (filters.endDate) {
        conditions.push(lte(exportRecords.exportDate, filters.endDate));
      }
      if (conditions.length > 0) {
        exportQuery = exportQuery.where(and(...conditions)) as any;
      }
    }
    
    const result = await exportQuery
      .orderBy(desc(exportRecords.exportDate))
      .limit(limit)
      .offset(offset);
    exports.push(...result);
  }
  
  return { imports, exports };
}

// ============= STATISTICS QUERIES =============

export async function getTotalMedicineCount() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(medicines);
  return result.length;
}

export async function getTotalCurrentStock() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(medicines);
  return result.reduce((sum, med) => sum + med.currentStock, 0);
}

export async function getTotalImportedThisMonth() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const result = await db.select().from(importRecords)
    .where(gte(importRecords.importDate, firstDayOfMonth));
  
  return result.reduce((sum, rec) => sum + rec.quantity, 0);
}

export async function getTotalExportedThisMonth() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const result = await db.select().from(exportRecords)
    .where(gte(exportRecords.exportDate, firstDayOfMonth));
  
  return result.reduce((sum, rec) => sum + rec.quantity, 0);
}

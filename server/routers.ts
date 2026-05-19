import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";

// Helper to check if user is admin
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ============= MEDICINES ROUTER =============
  medicines: router({
    // Get all medicines
    list: protectedProcedure.query(async () => {
      return await db.getAllMedicines();
    }),

    // Get single medicine
    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const medicine = await db.getMedicineById(input.id);
      if (!medicine) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Medicine not found" });
      }
      return medicine;
    }),

    // Create medicine (admin only)
    create: adminProcedure
      .input(
        z.object({
          name: z.string().min(1, "Name is required"),
          unit: z.string().min(1, "Unit is required"),
          minimumStock: z.number().int().min(0, "Minimum stock must be >= 0"),
          currentStock: z.number().int().min(0, "Current stock must be >= 0").optional(),
          retailPrice: z.number().min(0, "Retail price must be >= 0").optional(),
          expiryDate: z.date().nullable().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await db.createMedicine(input);
      }),

    // Update medicine (admin only)
    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().min(1).optional(),
          unit: z.string().min(1).optional(),
          minimumStock: z.number().int().min(0).optional(),
          currentStock: z.number().int().min(0).optional(),
          retailPrice: z.number().min(0).optional(),
          expiryDate: z.date().nullable().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await db.updateMedicine(id, data);
      }),

    // Delete medicine (admin only)
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteMedicine(input.id);
      }),

    // Get medicines with low stock
    lowStock: protectedProcedure.query(async () => {
      return await db.getMedicinesWithLowStock();
    }),

    // Get medicines expiring soon
    expiringSoon: protectedProcedure
      .input(z.object({ daysThreshold: z.number().int().min(1).default(30) }))
      .query(async ({ input }) => {
        return await db.getMedicinesExpiringSoon(input.daysThreshold);
      }),
  }),

  // ============= IMPORTS ROUTER =============
  imports: router({
    // Get import records
    list: protectedProcedure
      .input(
        z.object({
          limit: z.number().int().min(1).max(100).default(50),
          offset: z.number().int().min(0).default(0),
        })
      )
      .query(async ({ input }) => {
        return await db.getImportRecords(input.limit, input.offset);
      }),

    // Get imports for specific medicine
    byMedicine: protectedProcedure
      .input(z.object({ medicineId: z.number() }))
      .query(async ({ input }) => {
        return await db.getImportRecordsByMedicine(input.medicineId);
      }),

    // Create import record (admin only)
    create: adminProcedure
      .input(
        z.object({
          medicineId: z.number(),
          quantity: z.number().int().min(1, "Quantity must be > 0"),
          supplier: z.string().min(1, "Supplier is required"),
          batchNumber: z.string().optional(),
          expiryDate: z.date(),
          importDate: z.date(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        // Verify medicine exists
        const medicine = await db.getMedicineById(input.medicineId);
        if (!medicine) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Medicine not found" });
        }

        // Create import record
        return await db.createImportRecord(input);
      }),
  }),

  // ============= EXPORTS ROUTER =============
  exports: router({
    // Get export records
    list: protectedProcedure
      .input(
        z.object({
          limit: z.number().int().min(1).max(100).default(50),
          offset: z.number().int().min(0).default(0),
        })
      )
      .query(async ({ input }) => {
        return await db.getExportRecords(input.limit, input.offset);
      }),

    // Get exports for specific medicine
    byMedicine: protectedProcedure
      .input(z.object({ medicineId: z.number() }))
      .query(async ({ input }) => {
        return await db.getExportRecordsByMedicine(input.medicineId);
      }),

    // Get export items for specific export record
    items: protectedProcedure
      .input(z.object({ exportRecordId: z.number() }))
      .query(async ({ input }) => {
        return await db.getExportItemsByRecord(input.exportRecordId);
      }),

    // Create export record (admin + user can create)
    create: protectedProcedure
      .input(
        z.object({
          items: z.array(
            z.object({
              medicineId: z.number(),
              quantity: z.number().int().min(1),
              unitPrice: z.string().optional(),
            })
          ).min(1).max(10, "Maximum 10 medicines per export"),
          exportedBy: z.string().min(1, "Exporter name is required"),
          reason: z.enum(["emergency_use", "expired", "damaged", "other"]),
          totalPrice: z.string().optional(),
          exportDate: z.date(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        // Validate items count
        if (input.items.length > 10) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Maximum 10 medicines per export" });
        }

        // Create export record (without medicineId since we'll have multiple items)
        // For simplicity, we'll create one export record per item for now
        const results = [];
        
        for (const item of input.items) {
          // Verify medicine exists and has sufficient stock
          const medicine = await db.getMedicineById(item.medicineId);
          if (!medicine) {
            throw new TRPCError({ code: "NOT_FOUND", message: `Medicine ${item.medicineId} not found` });
          }
          if (medicine.currentStock < item.quantity) {
            throw new TRPCError({ 
              code: "BAD_REQUEST", 
              message: `Insufficient stock for ${medicine.name}` 
            });
          }

          // Create export record
          const result = await db.createExportRecord({
            medicineId: item.medicineId,
            quantity: item.quantity,
            exportedBy: input.exportedBy,
            reason: input.reason,
            totalPrice: input.totalPrice,
            exportDate: input.exportDate,
            notes: input.notes,
          });

          results.push(result);
        }

        return results;
      }),
  }),

  // ============= STATISTICS ROUTER =============
  stats: router({
    // Get dashboard statistics
    dashboard: protectedProcedure.query(async () => {
      const totalMedicines = await db.getTotalMedicineCount();
      const totalStock = await db.getTotalCurrentStock();
      const lowStockMedicines = await db.getMedicinesWithLowStock();
      const expiringMedicines = await db.getMedicinesExpiringSoon(30);
      const totalImportedThisMonth = await db.getTotalImportedThisMonth();
      const totalExportedThisMonth = await db.getTotalExportedThisMonth();

      return {
        totalMedicines,
        totalStock,
        lowStockCount: lowStockMedicines.length,
        expiringCount: expiringMedicines.length,
        totalImportedThisMonth,
        totalExportedThisMonth,
      };
    }),
  }),

  // ============= TRANSACTION HISTORY ROUTER =============
  history: router({
    // Get transaction history with filters
    list: protectedProcedure
      .input(
        z.object({
          medicineId: z.number().optional(),
          exportedBy: z.string().optional(),
          startDate: z.date().optional(),
          endDate: z.date().optional(),
          type: z.enum(["import", "export"]).optional(),
          limit: z.number().int().min(1).max(100).default(50),
          offset: z.number().int().min(0).default(0),
        })
      )
      .query(async ({ input }) => {
        return await db.getTransactionHistory(input);
      }),
  }),
});

export type AppRouter = typeof appRouter;

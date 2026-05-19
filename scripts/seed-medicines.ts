/**
 * Seed script: Insert medicines from bao-cao-xuat-kho-2026-05-19.xlsx
 * Run: $env:DATABASE_URL='...'; npx tsx scripts/seed-medicines.ts
 */
import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { medicines } from "../drizzle/schema";

const MEDICINES = [
  { name: "Găng Tay",               unit: "Viên", retailPrice: "1000",  minimumStock: 10 },
  { name: "LACTAC chai nhựa",        unit: "Viên", retailPrice: "18000", minimumStock: 10 },
  { name: "Metformin 500mg",         unit: "Viên", retailPrice: "888",   minimumStock: 20 },
  { name: "Gạc nhỏ",                unit: "Viên", retailPrice: "400",   minimumStock: 20 },
  { name: "GẠC LỚN",                unit: "Viên", retailPrice: "800",   minimumStock: 20 },
  { name: "Domperidon",              unit: "Viên", retailPrice: "300",   minimumStock: 20 },
  { name: "Alpha",                   unit: "Viên", retailPrice: "450",   minimumStock: 20 },
  { name: "BĂNG CUỘN",              unit: "Viên", retailPrice: "4500",  minimumStock: 10 },
  { name: "BĂNG THUN",              unit: "Viên", retailPrice: "5000",  minimumStock: 10 },
  { name: "GLUCO 30%",              unit: "Viên", retailPrice: "22800", minimumStock: 10 },
  { name: "GLUCO 5% NHỰA",         unit: "Viên", retailPrice: "20000", minimumStock: 10 },
  { name: "POLY KABI 500ML",        unit: "Viên", retailPrice: "76000", minimumStock: 5  },
  { name: "NATRI CHAI NHỰA",        unit: "Viên", retailPrice: "20000", minimumStock: 10 },
  { name: "LACTATE SÀNH",           unit: "Viên", retailPrice: "38500", minimumStock: 5  },
  { name: "Alcol 70 độ",            unit: "Viên", retailPrice: "12000", minimumStock: 10 },
  { name: "CHỈ SILK",               unit: "Viên", retailPrice: "23000", minimumStock: 5  },
  { name: "Kim luồng",              unit: "Viên", retailPrice: "4000",  minimumStock: 20 },
  { name: "BANG CA NHAN URGO",      unit: "Viên", retailPrice: "1000",  minimumStock: 20 },
  { name: "Dây truyền dịch",        unit: "Viên", retailPrice: "4500",  minimumStock: 20 },
  { name: "Kim tiêm 5cc",           unit: "Viên", retailPrice: "1000",  minimumStock: 20 },
  { name: "C500 cevita",            unit: "Viên", retailPrice: "3600",  minimumStock: 30 },
  { name: "C100 cevita",            unit: "Viên", retailPrice: "3500",  minimumStock: 30 },
  { name: "METOC",                  unit: "Viên", retailPrice: "3000",  minimumStock: 20 },
  { name: "GENTAMYCIN",             unit: "Viên", retailPrice: "3600",  minimumStock: 20 },
  { name: "DICLOFENAC CHÍCH",       unit: "Viên", retailPrice: "4080",  minimumStock: 20 },
  { name: "CALCI CHÍCH",            unit: "Viên", retailPrice: "19000", minimumStock: 10 },
  { name: "LIDOCAIN",               unit: "Viên", retailPrice: "1800",  minimumStock: 20 },
  { name: "HYDROCORTISON",          unit: "Viên", retailPrice: "18000", minimumStock: 10 },
  { name: "NOSPA CHÍCH",            unit: "Viên", retailPrice: "7200",  minimumStock: 20 },
  { name: "SMECTA",                 unit: "Viên", retailPrice: "5000",  minimumStock: 20 },
  { name: "OFMANTIEN",              unit: "Viên", retailPrice: "4800",  minimumStock: 20 },
  { name: "Nospa viên",             unit: "Viên", retailPrice: "1200",  minimumStock: 20 },
  { name: "CEFU 500mg",             unit: "Viên", retailPrice: "3480",  minimumStock: 20 },
  { name: "Hapacol 250 gói",        unit: "Viên", retailPrice: "2000",  minimumStock: 30 },
  { name: "Amox hộp vàng 250mg",    unit: "Viên", retailPrice: "2000",  minimumStock: 30 },
  { name: "DUPHALAC",               unit: "Viên", retailPrice: "9000",  minimumStock: 10 },
  { name: "PREDNISON",              unit: "Viên", retailPrice: "396",   minimumStock: 30 },
  { name: "TANGANIN",               unit: "Viên", retailPrice: "900",   minimumStock: 20 },
  { name: "Vitamin 3B",             unit: "Viên", retailPrice: "184",   minimumStock: 30 },
  { name: "Calci D",                unit: "Viên", retailPrice: "345",   minimumStock: 30 },
  { name: "Maginew",                unit: "Viên", retailPrice: "403",   minimumStock: 20 },
  { name: "Para 650mg",             unit: "Viên", retailPrice: "380",   minimumStock: 30 },
  { name: "Loperamid",              unit: "Viên", retailPrice: "420",   minimumStock: 20 },
  { name: "Metro 250mg",            unit: "Viên", retailPrice: "525",   minimumStock: 20 },
  { name: "Mefenamic",              unit: "Viên", retailPrice: "839",   minimumStock: 20 },
  { name: "Diclo viên 75mg",        unit: "Viên", retailPrice: "252",   minimumStock: 20 },
  { name: "Terpin",                 unit: "Viên", retailPrice: "334",   minimumStock: 20 },
  { name: "Clophe",                 unit: "Viên", retailPrice: "105",   minimumStock: 30 },
  { name: "Cipro",                  unit: "Viên", retailPrice: "936",   minimumStock: 20 },
  { name: "Amox 250mg",             unit: "Viên", retailPrice: "534",   minimumStock: 30 },
  { name: "Furosemid",              unit: "Viên", retailPrice: "588",   minimumStock: 20 },
  { name: "Captopril",              unit: "Viên", retailPrice: "234",   minimumStock: 20 },
  { name: "Nifedipin",              unit: "Viên", retailPrice: "648",   minimumStock: 20 },
  { name: "Bihasan",                unit: "Viên", retailPrice: "1800",  minimumStock: 20 },
  { name: "Amlodipin",              unit: "Viên", retailPrice: "264",   minimumStock: 20 },
];

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error("DATABASE_URL is required");

  const url = new URL(dbUrl);
  const isAiven = url.hostname.includes("aivencloud.com");

  const pool = mysql.createPool({
    uri: dbUrl,
    ssl: isAiven ? { rejectUnauthorized: false } : undefined,
    waitForConnections: true,
    connectionLimit: 3,
  });

  const db = drizzle(pool);

  console.log(`Inserting ${MEDICINES.length} medicines...`);

  let inserted = 0;
  let skipped = 0;

  for (const med of MEDICINES) {
    try {
      await db.insert(medicines).values({
        name: med.name,
        unit: med.unit,
        minimumStock: med.minimumStock,
        currentStock: 0,
        retailPrice: med.retailPrice,
      });
      console.log(`  ✓ ${med.name}`);
      inserted++;
    } catch (err: any) {
      // Skip duplicates (ER_DUP_ENTRY) silently
      if (err?.code === "ER_DUP_ENTRY") {
        console.log(`  ~ ${med.name} (already exists, skipped)`);
        skipped++;
      } else {
        throw err;
      }
    }
  }

  console.log(`\nDone: ${inserted} inserted, ${skipped} skipped.`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

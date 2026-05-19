import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, FileSpreadsheet, Loader2 } from "lucide-react";
import { toast } from "sonner";

const MONTHS = [
  "Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6",
  "Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12",
];

function fmt(n: number) {
  return n === 0 ? "" : n.toLocaleString("vi-VN");
}
function fmtMoney(n: number) {
  return n === 0 ? "" : n.toLocaleString("vi-VN");
}
function fmtPrice(s: string | null) {
  if (!s) return "";
  const n = parseFloat(s);
  return isNaN(n) ? s : n.toLocaleString("vi-VN");
}

export default function Reports() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear]   = useState(now.getFullYear());

  const { data: stats } = trpc.stats.dashboard.useQuery();
  const { data: rows, isLoading, refetch } = trpc.stats.monthly.useQuery(
    { month, year },
    { enabled: true }
  );

  // Server already filters out zero-activity rows
  const activeRows = rows ?? [];

  // Totals
  const totals = activeRows.reduce(
    (acc, r) => ({
      openingValue:  acc.openingValue  + r.openingValue,
      importQty:     acc.importQty     + r.importQty,
      importValue:   acc.importValue   + r.importValue,
      totalQty:      acc.totalQty      + r.totalQty,
      totalValue:    acc.totalValue    + r.totalValue,
      exportQty:     acc.exportQty     + r.exportQty,
      exportValue:   acc.exportValue   + r.exportValue,
      closingStock:  acc.closingStock  + r.closingStock,
      closingValue:  acc.closingValue  + r.closingValue,
    }),
    { openingValue:0, importQty:0, importValue:0, totalQty:0, totalValue:0,
      exportQty:0, exportValue:0, closingStock:0, closingValue:0 }
  );

  // Export to CSV matching mẫu chuẩn
  const handleExportCSV = () => {
    if (!activeRows.length) { toast.error("Không có dữ liệu để xuất"); return; }

    const BOM = "\uFEFF"; // UTF-8 BOM for Excel
    const header1 = `BÁO CÁO XUẤT NHẬP TỒN KHO THUỐC DỊCH VỤ`;
    const header2 = `THÁNG ${month.toString().padStart(2,"0")} NĂM ${year}`;
    const colHeaders = [
      "STT","Tên dược / vật tư","ĐVT","Đơn giá",
      "Tồn đầu kỳ - SL","Tồn đầu kỳ - Trị giá",
      "Nhập - SL","Nhập - Thành tiền",
      "Tổng cộng - SL","Tổng cộng - Thành tiền",
      "Xuất - SL","Xuất - Thành tiền",
      "Tồn cuối kỳ - SL","Tồn cuối kỳ - Thành tiền",
    ].join(",");

    const dataRows = activeRows.map((r, i) => [
      i + 1,
      `"${r.name}"`,
      r.unit,
      r.retailPrice ? parseFloat(r.retailPrice).toLocaleString("vi-VN") : "",
      r.openingStock || "",
      r.openingValue || "",
      r.importQty || "",
      r.importValue || "",
      r.totalQty || "",
      r.totalValue || "",
      r.exportQty || "",
      r.exportValue || "",
      r.closingStock || "",
      r.closingValue || "",
    ].join(","));

    const totalRow = [
      "","Tổng cộng","","",
      "",totals.openingValue||"",
      totals.importQty||"",totals.importValue||"",
      totals.totalQty||"",totals.totalValue||"",
      totals.exportQty||"",totals.exportValue||"",
      totals.closingStock||"",totals.closingValue||"",
    ].join(",");

    const csv = [BOM, header1, header2, colHeaders, ...dataRows, totalRow].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `NXT-Thang${month.toString().padStart(2,"0")}-${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Đã xuất báo cáo NXT");
  };

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Báo cáo & thống kê</h1>
        <p className="text-muted-foreground mt-2">Báo cáo xuất nhập tồn kho theo tháng</p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Tổng thuốc",    value: stats?.totalMedicines ?? 0,        color: "" },
          { label: "Tổng tồn kho",  value: stats?.totalStock ?? 0,            color: "" },
          { label: "Dưới định mức", value: stats?.lowStockCount ?? 0,         color: "text-orange-600" },
          { label: "Sắp hết hạn",   value: stats?.expiringCount ?? 0,         color: "text-red-600" },
        ].map(c => (
          <Card key={c.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${c.color}`}>{c.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Month/Year picker + Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Báo cáo xuất nhập tồn — Mẫu chuẩn
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4 mb-6">
            <div>
              <Label>Tháng</Label>
              <select
                value={month}
                onChange={e => setMonth(parseInt(e.target.value))}
                className="mt-1 block w-36 px-3 py-2 border border-border rounded-md bg-background text-sm"
              >
                {MONTHS.map((m, i) => (
                  <option key={i+1} value={i+1}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Năm</Label>
              <select
                value={year}
                onChange={e => setYear(parseInt(e.target.value))}
                className="mt-1 block w-28 px-3 py-2 border border-border rounded-md bg-background text-sm"
              >
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <Button onClick={() => refetch()} variant="outline" size="sm">
              Xem báo cáo
            </Button>
            <Button onClick={handleExportCSV} className="gap-2" size="sm" disabled={!activeRows.length}>
              <Download className="h-4 w-4" />
              Xuất CSV
            </Button>
          </div>

          {/* Report title */}
          <div className="text-center mb-4 space-y-1">
            <p className="font-bold text-base uppercase">
              Báo cáo xuất nhập tồn kho thuốc dịch vụ
            </p>
            <p className="font-semibold text-sm">
              Tháng {month.toString().padStart(2,"0")} năm {year}
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : activeRows.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Không có dữ liệu cho tháng {month}/{year}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead rowSpan={2} className="text-center border-r w-10">STT</TableHead>
                    <TableHead rowSpan={2} className="border-r min-w-[180px]">Tên dược / vật tư</TableHead>
                    <TableHead rowSpan={2} className="text-center border-r w-16">ĐVT</TableHead>
                    <TableHead rowSpan={2} className="text-right border-r w-24">Đơn giá</TableHead>
                    <TableHead colSpan={2} className="text-center border-r border-b">Tồn đầu kỳ</TableHead>
                    <TableHead colSpan={2} className="text-center border-r border-b">Nhập</TableHead>
                    <TableHead colSpan={2} className="text-center border-r border-b">Tổng cộng</TableHead>
                    <TableHead colSpan={2} className="text-center border-r border-b">Xuất</TableHead>
                    <TableHead colSpan={2} className="text-center border-b">Tồn cuối kỳ</TableHead>
                  </TableRow>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-center border-r text-xs">SL</TableHead>
                    <TableHead className="text-right border-r text-xs">Trị giá</TableHead>
                    <TableHead className="text-center border-r text-xs">SL</TableHead>
                    <TableHead className="text-right border-r text-xs">Thành tiền</TableHead>
                    <TableHead className="text-center border-r text-xs">SL</TableHead>
                    <TableHead className="text-right border-r text-xs">Thành tiền</TableHead>
                    <TableHead className="text-center border-r text-xs">SL</TableHead>
                    <TableHead className="text-right border-r text-xs">Thành tiền</TableHead>
                    <TableHead className="text-center text-xs">SL</TableHead>
                    <TableHead className="text-right text-xs">Thành tiền</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeRows.map((r, i) => (
                    <TableRow key={r.medicineId} className="hover:bg-muted/30">
                      <TableCell className="text-center border-r text-sm">{i + 1}</TableCell>
                      <TableCell className="border-r text-sm font-medium">{r.name}</TableCell>
                      <TableCell className="text-center border-r text-sm">{r.unit}</TableCell>
                      <TableCell className="text-right border-r text-sm">{fmtPrice(r.retailPrice)}</TableCell>
                      {/* Tồn đầu kỳ */}
                      <TableCell className="text-center border-r text-sm">{fmt(r.openingStock)}</TableCell>
                      <TableCell className="text-right border-r text-sm">{fmtMoney(r.openingValue)}</TableCell>
                      {/* Nhập */}
                      <TableCell className="text-center border-r text-sm text-blue-700 font-medium">{fmt(r.importQty)}</TableCell>
                      <TableCell className="text-right border-r text-sm">{fmtMoney(r.importValue)}</TableCell>
                      {/* Tổng */}
                      <TableCell className="text-center border-r text-sm">{fmt(r.totalQty)}</TableCell>
                      <TableCell className="text-right border-r text-sm">{fmtMoney(r.totalValue)}</TableCell>
                      {/* Xuất */}
                      <TableCell className="text-center border-r text-sm text-red-700 font-medium">{fmt(r.exportQty)}</TableCell>
                      <TableCell className="text-right border-r text-sm">{fmtMoney(r.exportValue)}</TableCell>
                      {/* Tồn cuối */}
                      <TableCell className="text-center text-sm text-green-700 font-medium">{fmt(r.closingStock)}</TableCell>
                      <TableCell className="text-right text-sm">{fmtMoney(r.closingValue)}</TableCell>
                    </TableRow>
                  ))}

                  {/* Totals row */}
                  <TableRow className="bg-muted/60 font-bold border-t-2">
                    <TableCell colSpan={4} className="border-r text-sm">Tổng cộng</TableCell>
                    <TableCell className="text-center border-r text-sm"></TableCell>
                    <TableCell className="text-right border-r text-sm">{fmtMoney(totals.openingValue)}</TableCell>
                    <TableCell className="text-center border-r text-sm text-blue-700">{fmt(totals.importQty)}</TableCell>
                    <TableCell className="text-right border-r text-sm">{fmtMoney(totals.importValue)}</TableCell>
                    <TableCell className="text-center border-r text-sm">{fmt(totals.totalQty)}</TableCell>
                    <TableCell className="text-right border-r text-sm">{fmtMoney(totals.totalValue)}</TableCell>
                    <TableCell className="text-center border-r text-sm text-red-700">{fmt(totals.exportQty)}</TableCell>
                    <TableCell className="text-right border-r text-sm">{fmtMoney(totals.exportValue)}</TableCell>
                    <TableCell className="text-center text-sm text-green-700">{fmt(totals.closingStock)}</TableCell>
                    <TableCell className="text-right text-sm">{fmtMoney(totals.closingValue)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

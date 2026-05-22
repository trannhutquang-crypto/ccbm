import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyHistoryState } from "./EmptyStates";

export default function TransactionHistory() {
  const [filters, setFilters] = useState({
    medicineId: "",
    exportedBy: "",
    startDate: "",
    endDate: "",
    type: "" as "" | "import" | "export",
  });

  const { data: medicines } = trpc.medicines.list.useQuery();

  const { data: history, isLoading } = trpc.history.list.useQuery({
    medicineId: filters.medicineId ? parseInt(filters.medicineId) : undefined,
    exportedBy: filters.exportedBy || undefined,
    startDate: filters.startDate ? new Date(filters.startDate) : undefined,
    endDate: filters.endDate ? new Date(filters.endDate) : undefined,
    type: filters.type || undefined,
  });

  // Lookup map: medicineId → name
  const medicineMap = Object.fromEntries((medicines ?? []).map(m => [m.id, m.name]));

  const exporterNames = useMemo(() => {
    const names = new Set<string>();
    history?.exports?.forEach((exp) => {
      if (exp.exportedBy) {
        names.add(exp.exportedBy);
      }
    });
    return Array.from(names).sort((a, b) => a.localeCompare(b, "vi"));
  }, [history?.exports]);

  const handleReset = () => {
    setFilters({ medicineId: "", exportedBy: "", startDate: "", endDate: "", type: "" });
  };

  const hasData = (history?.imports?.length || 0) + (history?.exports?.length || 0) > 0;

  if (isLoading) {
    return <div className="animate-pulse space-y-4"><div className="h-96 bg-muted rounded"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Lịch sử giao dịch</h1>
        <p className="text-muted-foreground mt-2">Xem toàn bộ lịch sử nhập/xuất kho</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Bộ lọc</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="medicineFilter">Tên thuốc</Label>
              <Select value={filters.medicineId} onValueChange={(value) => setFilters({ ...filters, medicineId: value })}>
                <SelectTrigger id="medicineFilter" className="w-full">
                  <SelectValue placeholder="Tất cả thuốc" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tất cả thuốc</SelectItem>
                  {medicines?.map((m) => (
                    <SelectItem key={m.id} value={m.id.toString()}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="exportedBy">Người xuất</Label>
              <Select value={filters.exportedBy} onValueChange={(value) => setFilters({ ...filters, exportedBy: value })}>
                <SelectTrigger id="exportedBy" className="w-full">
                  <SelectValue placeholder="Tất cả người xuất" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tất cả người xuất</SelectItem>
                  {exporterNames.map((name) => (
                    <SelectItem key={name} value={name}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="startDate">Từ ngày</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="endDate">Đến ngày</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="type">Loại giao dịch</Label>
              <select
                id="type"
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value as any })}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm"
              >
                <option value="">Tất cả</option>
                <option value="import">Nhập kho</option>
                <option value="export">Xuất kho</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={handleReset}>Đặt lại</Button>
          </div>
        </CardContent>
      </Card>

      {/* History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lịch sử</CardTitle>
          <CardDescription>
            {(history?.imports?.length || 0) + (history?.exports?.length || 0)} giao dịch
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loại</TableHead>
                  <TableHead>Tên thuốc</TableHead>
                  <TableHead>Số lượng</TableHead>
                  <TableHead className="hidden sm:table-cell">Nhà cung cấp / Người xuất</TableHead>
                  <TableHead>Ngày</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!hasData ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <EmptyHistoryState />
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {history?.imports?.map((imp) => (
                      <TableRow key={`import-${imp.id}`}>
                        <TableCell>
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">Nhập</span>
                        </TableCell>
                        <TableCell className="font-medium">
                          {medicineMap[imp.medicineId] ?? `ID: ${imp.medicineId}`}
                        </TableCell>
                        <TableCell>{imp.quantity}</TableCell>
                        <TableCell className="hidden sm:table-cell">{imp.supplier}</TableCell>
                        <TableCell>{formatDate(imp.importDate)}</TableCell>
                      </TableRow>
                    ))}
                    {history?.exports?.map((exp) => (
                      <TableRow key={`export-${exp.id}`}>
                        <TableCell>
                          <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">Xuất</span>
                        </TableCell>
                        <TableCell className="font-medium">
                          {medicineMap[exp.medicineId] ?? `ID: ${exp.medicineId}`}
                        </TableCell>
                        <TableCell>{exp.quantity}</TableCell>
                        <TableCell className="hidden sm:table-cell">{exp.exportedBy}</TableCell>
                        <TableCell>{formatDate(exp.exportDate)}</TableCell>
                      </TableRow>
                    ))}
                  </>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

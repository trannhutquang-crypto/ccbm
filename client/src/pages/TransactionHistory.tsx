import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search } from "lucide-react";
import { EmptyHistoryState } from "./EmptyStates";

export default function TransactionHistory() {
  const [filters, setFilters] = useState({
    medicineId: "",
    exportedBy: "",
    startDate: "",
    endDate: "",
    type: "" as "" | "import" | "export",
  });

  const { data: history, isLoading } = trpc.history.list.useQuery({
    medicineId: filters.medicineId ? parseInt(filters.medicineId) : undefined,
    exportedBy: filters.exportedBy || undefined,
    startDate: filters.startDate ? new Date(filters.startDate) : undefined,
    endDate: filters.endDate ? new Date(filters.endDate) : undefined,
    type: filters.type || undefined,
  });

  const handleReset = () => {
    setFilters({
      medicineId: "",
      exportedBy: "",
      startDate: "",
      endDate: "",
      type: "",
    });
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
              <Label htmlFor="medicineId">ID Thuốc</Label>
              <Input
                id="medicineId"
                type="number"
                value={filters.medicineId}
                onChange={(e) => setFilters({ ...filters, medicineId: e.target.value })}
                placeholder="Nhập ID"
              />
            </div>
            <div>
              <Label htmlFor="exportedBy">Người xuất</Label>
              <Input
                id="exportedBy"
                value={filters.exportedBy}
                onChange={(e) => setFilters({ ...filters, exportedBy: e.target.value })}
                placeholder="Tên người xuất"
              />
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
                className="w-full px-3 py-2 border border-border rounded-md"
              >
                <option value="">Tất cả</option>
                <option value="import">Nhập kho</option>
                <option value="export">Xuất kho</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={handleReset}>
              Đặt lại
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lịch sử</CardTitle>
          <CardDescription>Danh sách nhập/xuất kho</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loại</TableHead>
                  <TableHead>Thuốc</TableHead>
                  <TableHead>Số lượng</TableHead>
                  <TableHead className="hidden sm:table-cell">Nhà cung cấp/Người xuất</TableHead>
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
                        <TableCell><span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">Nhập</span></TableCell>
                        <TableCell>ID: {imp.medicineId}</TableCell>
                        <TableCell>{imp.quantity}</TableCell>
                        <TableCell className="hidden sm:table-cell">{imp.supplier}</TableCell>
                        <TableCell>{imp.importDate?.toString().split("T")[0]}</TableCell>
                      </TableRow>
                    ))}
                    {history?.exports?.map((exp) => (
                      <TableRow key={`export-${exp.id}`}>
                        <TableCell><span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">Xuất</span></TableCell>
                        <TableCell>ID: {exp.medicineId}</TableCell>
                        <TableCell>{exp.quantity}</TableCell>
                        <TableCell className="hidden sm:table-cell">{exp.exportedBy}</TableCell>
                        <TableCell>{exp.exportDate?.toString().split("T")[0]}</TableCell>
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

import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";

export default function Reports() {
  const { data: stats } = trpc.stats.dashboard.useQuery();
  const { data: medicines } = trpc.medicines.list.useQuery();

  const handleExportCSV = () => {
    if (!medicines) return;

    const headers = ["ID", "Tên thuốc", "Đơn vị", "Tồn kho", "Định mức tối thiểu"];
    const rows = medicines.map(m => [
      m.id,
      m.name,
      m.unit,
      m.currentStock,
      m.minimumStock,
    ]);

    const csv = [
      headers.join(","),
      ...rows.map(row => row.join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    toast.success("Báo cáo đã được xuất");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Báo cáo & thống kê</h1>
        <p className="text-muted-foreground mt-2">Xem báo cáo và thống kê chi tiết</p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tổng thuốc</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalMedicines || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tổng tồn kho</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalStock || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Dưới định mức</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats?.lowStockCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sắp hết hạn</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.expiringCount || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>Xuất dữ liệu</CardTitle>
          <CardDescription>Tải xuống báo cáo dưới dạng CSV</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleExportCSV} className="gap-2 w-full sm:w-auto">
            <Download className="h-4 w-4" />
            Xuất báo cáo tồn kho
          </Button>
        </CardContent>
      </Card>

      {/* Detailed Report */}
      <Card>
        <CardHeader>
          <CardTitle>Báo cáo tồn kho chi tiết</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">Tồn kho theo trạng thái</h3>
              <div className="mt-2 space-y-2">
                <div className="flex flex-col sm:flex-row justify-between">
                  <span>Tồn kho bình thường:</span>
                  <span className="font-semibold">{Math.max(0, (stats?.totalMedicines || 0) - (stats?.lowStockCount || 0))} loại</span>
                </div>
                <div className="flex flex-col sm:flex-row justify-between">
                  <span>Dưới định mức:</span>
                  <span className="font-semibold text-orange-600">{stats?.lowStockCount || 0} loại</span>
                </div>
                <div className="flex flex-col sm:flex-row justify-between">
                  <span>Sắp hết hạn:</span>
                  <span className="font-semibold text-red-600">{stats?.expiringCount || 0} loại</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Thống kê tháng này</CardTitle>
          <CardDescription>Tổng nhập/xuất trong tháng hiện tại</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Tổng nhập tháng này</p>
                <p className="text-2xl font-bold">{stats?.totalImportedThisMonth || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tổng xuất tháng này</p>
                <p className="text-2xl font-bold">{stats?.totalExportedThisMonth || 0}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

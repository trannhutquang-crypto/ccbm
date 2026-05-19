import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Package, TrendingDown, TrendingUp, CalendarX } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

function daysUntil(dateStr: string | Date | null): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading } = trpc.stats.dashboard.useQuery();
  const { data: lowStockMedicines } = trpc.medicines.lowStock.useQuery();
  const { data: expiring7  } = trpc.medicines.expiringSoon.useQuery({ daysThreshold: 7  });
  const { data: expiring30 } = trpc.medicines.expiringSoon.useQuery({ daysThreshold: 30 });

  // Medicines expiring in 8–30 days (not in the critical 7-day group)
  const expiring7Ids  = new Set((expiring7  ?? []).map(m => m.id));
  const expiringSoon  = (expiring30 ?? []).filter(m => !expiring7Ids.has(m.id));
  const expiringCritical = expiring7 ?? [];

  const chartData = [
    { month: "T1", nhập: 0, xuất: 0 },
    { month: "T2", nhập: 0, xuất: 0 },
    { month: "T3", nhập: 0, xuất: 0 },
    { month: "T4", nhập: 0, xuất: 0 },
    { month: "T5", nhập: stats?.totalImportedThisMonth ?? 0, xuất: stats?.totalExportedThisMonth ?? 0 },
  ];

  const stockDistribution = [
    { name: "Tồn kho tốt", value: Math.max(0, (stats?.totalMedicines || 0) - (stats?.lowStockCount || 0)) },
    { name: "Dưới định mức", value: stats?.lowStockCount || 0 },
  ];
  const COLORS = ["#10b981", "#f59e0b"];

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/3" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {[1,2,3,4,5].map(i => <div key={i} className="h-24 bg-muted rounded" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Chào mừng, {user?.name}. Tổng quan hệ thống quản lý kho thuốc cấp cứu.
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng thuốc</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalMedicines || 0}</div>
            <p className="text-xs text-muted-foreground">Trong hệ thống</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tồn kho</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalStock || 0}</div>
            <p className="text-xs text-muted-foreground">Số lượng hiện tại</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nhập tháng</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats?.totalImportedThisMonth || 0}</div>
            <p className="text-xs text-muted-foreground">Số lượng nhập</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Xuất tháng</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.totalExportedThisMonth || 0}</div>
            <p className="text-xs text-muted-foreground">Số lượng xuất</p>
          </CardContent>
        </Card>
        <Card className={(expiringCritical.length > 0 || (lowStockMedicines?.length ?? 0) > 0) ? "border-orange-300" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cảnh báo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {(stats?.lowStockCount || 0) + (stats?.expiringCount || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Cần xử lý</p>
          </CardContent>
        </Card>
      </div>

      {/* ===== ALERTS ===== */}

      {/* Critical: expiring within 7 days */}
      {expiringCritical.length > 0 && (
        <Alert className="border-red-400 bg-red-50 dark:bg-red-950/30">
          <CalendarX className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-700 font-semibold">
            🚨 {expiringCritical.length} thuốc hết hạn trong 7 ngày tới
          </AlertTitle>
          <AlertDescription>
            <ul className="mt-2 space-y-1">
              {expiringCritical.map(m => {
                const days = daysUntil(m.expiryDate);
                return (
                  <li key={m.id} className="flex items-center justify-between text-sm text-red-800">
                    <span className="font-medium">{m.name}</span>
                    <span className="text-xs bg-red-200 text-red-800 px-2 py-0.5 rounded-full">
                      {days !== null && days <= 0
                        ? "Đã hết hạn"
                        : `Còn ${days} ngày`}
                    </span>
                  </li>
                );
              })}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Warning: expiring within 8–30 days */}
      {expiringSoon.length > 0 && (
        <Alert className="border-orange-300 bg-orange-50 dark:bg-orange-950/30">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-700 font-semibold">
            ⚠️ {expiringSoon.length} thuốc sắp hết hạn trong 30 ngày
          </AlertTitle>
          <AlertDescription>
            <ul className="mt-2 space-y-1">
              {expiringSoon.map(m => {
                const days = daysUntil(m.expiryDate);
                return (
                  <li key={m.id} className="flex items-center justify-between text-sm text-orange-800">
                    <span className="font-medium">{m.name}</span>
                    <span className="text-xs bg-orange-200 text-orange-800 px-2 py-0.5 rounded-full">
                      Còn {days} ngày
                    </span>
                  </li>
                );
              })}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Low stock */}
      {(lowStockMedicines?.length || 0) > 0 && (
        <Alert className="border-yellow-300 bg-yellow-50 dark:bg-yellow-950/30">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-700 font-semibold">
            📦 {lowStockMedicines?.length} thuốc dưới định mức tồn kho
          </AlertTitle>
          <AlertDescription>
            <ul className="mt-2 space-y-1">
              {lowStockMedicines?.map(m => (
                <li key={m.id} className="flex items-center justify-between text-sm text-yellow-800">
                  <span className="font-medium">{m.name}</span>
                  <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full">
                    Tồn: {m.currentStock} / Định mức: {m.minimumStock}
                  </span>
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Xu hướng Nhập/Xuất</CardTitle>
            <CardDescription>5 tháng gần nhất</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="nhập" stroke="#3b82f6" strokeWidth={2} />
                <Line type="monotone" dataKey="xuất" stroke="#ef4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Phân bố Tồn kho</CardTitle>
            <CardDescription>Trạng thái hiện tại</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={stockDistribution} cx="50%" cy="50%" labelLine={false}
                  label={({ name, value }) => value > 0 ? `${name}: ${value}` : ""}
                  outerRadius={90} dataKey="value">
                  {stockDistribution.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thống kê Nhập/Xuất theo tháng</CardTitle>
          <CardDescription>So sánh số lượng nhập và xuất</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="nhập" fill="#3b82f6" />
              <Bar dataKey="xuất" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { EmptyExportState } from "./EmptyStates";

const REASON_LABELS: Record<string, string> = {
  emergency_use: "Sử dụng cấp cứu",
  expired:       "Hết hạn",
  damaged:       "Hỏng",
  other:         "Khác",
};

type ExportItem = { medicineId: number; quantity: number; unitPrice: string };

export default function ExportManagement() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<ExportItem[]>([]);
  const [formData, setFormData] = useState({
    exportedBy: "",
    reason: "emergency_use" as const,
    totalPrice: "",
    exportDate: "",
    notes: "",
  });

  const { data: medicines } = trpc.medicines.list.useQuery();
  const [exportedByFilter, setExportedByFilter] = useState("");
  const { data: exports, isLoading, refetch } = trpc.exports.list.useQuery({
    limit: 50,
    exportedBy: exportedByFilter || undefined,
  });
  const createMutation = trpc.exports.create.useMutation();

  // Lookup maps
  const medicineMap    = Object.fromEntries((medicines ?? []).map(m => [m.id, m.name]));
  const retailPriceMap = Object.fromEntries(
    (medicines ?? []).map(m => [m.id, m.retailPrice ? m.retailPrice.toString() : ""])
  );

  // Auto-recalculate totalPrice whenever items change
  useEffect(() => {
    const total = items.reduce((sum, item) => {
      const price = parseFloat(item.unitPrice) || 0;
      const qty   = item.quantity || 0;
      return sum + price * qty;
    }, 0);
    setFormData(prev => ({ ...prev, totalPrice: total > 0 ? total.toString() : "" }));
  }, [items]);

  const handleMedicineChange = (idx: number, medicineId: number) => {
    const newItems = [...items];
    newItems[idx] = {
      ...newItems[idx],
      medicineId,
      // Auto-fill unit price from retailPrice
      unitPrice: retailPriceMap[medicineId] ?? "",
    };
    setItems(newItems);
  };

  const handleAddItem = () => {
    if (items.length >= 10) { toast.error("Tối đa 10 loại thuốc mỗi phiếu"); return; }
    setItems([...items, { medicineId: 0, quantity: 1, unitPrice: "" }]);
  };

  const handleRemoveItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));

  const resetForm = () => {
    setItems([]);
    setFormData({ exportedBy: "", reason: "emergency_use", totalPrice: "", exportDate: "", notes: "" });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) { toast.error("Vui lòng thêm ít nhất 1 loại thuốc"); return; }
    try {
      await createMutation.mutateAsync({
        items: items.map(item => ({
          medicineId: item.medicineId,
          quantity:   item.quantity,
          unitPrice:  item.unitPrice || undefined,
        })),
        exportedBy: formData.exportedBy,
        reason:     formData.reason,
        totalPrice: formData.totalPrice || undefined,
        exportDate: new Date(formData.exportDate),
        notes:      formData.notes || undefined,
      });
      toast.success("Phiếu xuất đã được tạo thành công");
      resetForm();
      setIsOpen(false);
      refetch();
    } catch (error: any) {
      toast.error(error?.message ?? "Lỗi khi tạo phiếu xuất");
    }
  };

  if (isLoading) {
    return <div className="animate-pulse space-y-4"><div className="h-96 bg-muted rounded"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý xuất kho</h1>
          <p className="text-muted-foreground mt-2">Quản lý phiếu xuất thuốc (tối đa 10 loại/phiếu)</p>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsOpen(open); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              Tạo phiếu xuất
            </Button>
          </DialogTrigger>
          <DialogContent className="w-full max-w-2xl">
            <DialogHeader>
              <DialogTitle>Tạo phiếu xuất kho</DialogTitle>
              <DialogDescription>Ghi nhận xuất thuốc từ kho (tối đa 10 loại)</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="exportedBy">Người xuất</Label>
                  <Input id="exportedBy" value={formData.exportedBy}
                    onChange={(e) => setFormData({ ...formData, exportedBy: e.target.value })} required />
                </div>
                <div>
                  <Label htmlFor="reason">Lý do xuất</Label>
                  <select id="reason" value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value as any })}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background">
                    <option value="emergency_use">Sử dụng cấp cứu</option>
                    <option value="expired">Hết hạn</option>
                    <option value="damaged">Hỏng</option>
                    <option value="other">Khác</option>
                  </select>
                </div>
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Danh sách thuốc xuất ({items.length}/10)</Label>
                </div>

                {items.length > 0 && (
                  <div className="grid grid-cols-[1fr_60px_100px_36px] gap-1 mb-1 px-1">
                    <span className="text-xs text-muted-foreground">Tên thuốc</span>
                    <span className="text-xs text-muted-foreground text-center">SL</span>
                    <span className="text-xs text-muted-foreground text-right">Đơn giá (đ)</span>
                    <span />
                  </div>
                )}

                <div className="space-y-2">
                  {items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-[1fr_60px_100px_36px] gap-1 items-center">
                      <select
                        value={item.medicineId || ""}
                        onChange={(e) => handleMedicineChange(idx, parseInt(e.target.value))}
                        className="px-2 py-2 border border-border rounded-md text-sm bg-background"
                        required
                      >
                        <option value="">Chọn thuốc</option>
                        {medicines?.map((m) => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>

                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => {
                          const newItems = [...items];
                          newItems[idx].quantity = parseInt(e.target.value) || 0;
                          setItems(newItems);
                        }}
                        className="text-center px-1"
                        min="1"
                        required
                      />

                      <Input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => {
                          const newItems = [...items];
                          newItems[idx].unitPrice = e.target.value;
                          setItems(newItems);
                        }}
                        className="text-right px-2"
                        placeholder="0"
                      />

                      <Button type="button" variant="ghost" size="sm" className="h-9 w-9 p-0"
                        onClick={() => handleRemoveItem(idx)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>

                <Button type="button" variant="outline" className="w-full mt-2" onClick={handleAddItem}>
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm thuốc
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="totalPrice">Tổng tiền (tự tính)</Label>
                  <Input id="totalPrice" type="number" value={formData.totalPrice} readOnly
                    className="bg-muted cursor-default"
                    placeholder="Tự động tính"
                  />
                </div>
                <div>
                  <Label htmlFor="exportDate">Ngày xuất</Label>
                  <Input id="exportDate" type="date" value={formData.exportDate}
                    onChange={(e) => setFormData({ ...formData, exportDate: e.target.value })} required />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Ghi chú</Label>
                <Input id="notes" value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
              </div>

              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Đang tạo..." : "Tạo phiếu xuất"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bộ lọc</CardTitle>
          <CardDescription>Giảm danh sách phiếu xuất theo tên người xuất</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
            <div>
              <Label htmlFor="exportedByFilter">Người xuất</Label>
              <Input
                id="exportedByFilter"
                value={exportedByFilter}
                onChange={(e) => setExportedByFilter(e.target.value)}
                placeholder="Lọc theo người xuất"
              />
            </div>
            <div className="flex items-end">
              <Button variant="outline" className="w-full sm:w-auto" onClick={() => setExportedByFilter("")}>Xóa lọc</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách phiếu xuất</CardTitle>
          <CardDescription>Tổng cộng {exports?.length || 0} phiếu xuất</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên thuốc</TableHead>
                  <TableHead>Số lượng</TableHead>
                  <TableHead className="hidden sm:table-cell">Người xuất</TableHead>
                  <TableHead className="hidden md:table-cell">Lý do</TableHead>
                  <TableHead className="hidden lg:table-cell">Tổng tiền</TableHead>
                  <TableHead>Ngày xuất</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!exports || exports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <EmptyExportState />
                    </TableCell>
                  </TableRow>
                ) : (
                  exports.map((exp) => (
                    <TableRow key={exp.id}>
                      <TableCell className="font-medium">
                        {medicineMap[exp.medicineId] ?? `ID: ${exp.medicineId}`}
                      </TableCell>
                      <TableCell>{exp.quantity}</TableCell>
                      <TableCell className="hidden sm:table-cell">{exp.exportedBy}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {REASON_LABELS[exp.reason] ?? exp.reason}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {exp.totalPrice
                          ? `${parseFloat(exp.totalPrice).toLocaleString("vi-VN")} đ`
                          : "-"}
                      </TableCell>
                      <TableCell>{formatDate(exp.exportDate)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

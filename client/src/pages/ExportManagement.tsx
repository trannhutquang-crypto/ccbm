import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { EmptyExportState } from "./EmptyStates";

export default function ExportManagement() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<Array<{ medicineId: number; quantity: number; unitPrice: string }>>([]);
  const [formData, setFormData] = useState({
    exportedBy: "",
    reason: "emergency_use" as const,
    totalPrice: "",
    exportDate: "",
    notes: "",
  });

  const { data: medicines } = trpc.medicines.list.useQuery();
  const { data: exports, isLoading, refetch } = trpc.exports.list.useQuery({ limit: 50 });
  const createMutation = trpc.exports.create.useMutation();

  const handleAddItem = () => {
    if (items.length < 10) {
      setItems([...items, { medicineId: 0, quantity: 0, unitPrice: "" }]);
    } else {
      toast.error("Tối đa 10 loại thuốc mỗi phiếu");
    }
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error("Vui lòng thêm ít nhất 1 loại thuốc");
      return;
    }

    try {
      await createMutation.mutateAsync({
        items: items.map(item => ({
          medicineId: item.medicineId,
          quantity: item.quantity,
          unitPrice: item.unitPrice || undefined,
        })),
        exportedBy: formData.exportedBy,
        reason: formData.reason,
        totalPrice: formData.totalPrice || undefined,
        exportDate: new Date(formData.exportDate),
        notes: formData.notes || undefined,
      });
      toast.success("Phiếu xuất đã được tạo thành công");
      setItems([]);
      setFormData({
        exportedBy: "",
        reason: "emergency_use",
        totalPrice: "",
        exportDate: "",
        notes: "",
      });
      setIsOpen(false);
      refetch();
    } catch (error) {
      toast.error("Lỗi khi tạo phiếu xuất");
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
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
            <form onSubmit={handleCreate} className="space-y-4 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="exportedBy">Người xuất</Label>
                  <Input
                    id="exportedBy"
                    value={formData.exportedBy}
                    onChange={(e) => setFormData({ ...formData, exportedBy: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="reason">Lý do xuất</Label>
                  <select
                    id="reason"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value as any })}
                    className="w-full px-3 py-2 border border-border rounded-md"
                  >
                    <option value="emergency_use">Sử dụng cấp cứu</option>
                    <option value="expired">Hết hạn</option>
                    <option value="damaged">Hỏng</option>
                    <option value="other">Khác</option>
                  </select>
                </div>
              </div>

              <div>
                <Label>Danh sách thuốc xuất ({items.length}/10)</Label>
                <div className="space-y-2 mt-2">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row gap-2 items-end">
                      <select
                        value={item.medicineId}
                        onChange={(e) => {
                          const newItems = [...items];
                          newItems[idx].medicineId = parseInt(e.target.value);
                          setItems(newItems);
                        }}
                        className="flex-1 px-3 py-2 border border-border rounded-md text-sm"
                        required
                      >
                        <option value="">Chọn thuốc</option>
                        {medicines?.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                      <Input
                        type="number"
                        placeholder="SL"
                        value={item.quantity}
                        onChange={(e) => {
                          const newItems = [...items];
                          newItems[idx].quantity = parseInt(e.target.value);
                          setItems(newItems);
                        }}
                        className="w-full sm:w-20"
                        min="1"
                        required
                      />
                      <Input
                        type="number"
                        placeholder="Giá"
                        value={item.unitPrice}
                        onChange={(e) => {
                          const newItems = [...items];
                          newItems[idx].unitPrice = e.target.value;
                          setItems(newItems);
                        }}
                        className="w-full sm:w-24"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(idx)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  ))}
                </div>
                {items.length < 10 && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full mt-2"
                    onClick={handleAddItem}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm thuốc
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="totalPrice">Tổng giá bán</Label>
                  <Input
                    id="totalPrice"
                    type="number"
                    value={formData.totalPrice}
                    onChange={(e) => setFormData({ ...formData, totalPrice: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="exportDate">Ngày xuất</Label>
                  <Input
                    id="exportDate"
                    type="date"
                    value={formData.exportDate}
                    onChange={(e) => setFormData({ ...formData, exportDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Ghi chú</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
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
          <CardTitle>Danh sách phiếu xuất</CardTitle>
          <CardDescription>Tổng cộng {exports?.length || 0} phiếu xuất</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Thuốc</TableHead>
                  <TableHead>Số lượng</TableHead>
                  <TableHead className="hidden sm:table-cell">Người xuất</TableHead>
                  <TableHead className="hidden md:table-cell">Lý do</TableHead>
                  <TableHead className="hidden lg:table-cell">Tổng giá</TableHead>
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
                      <TableCell className="font-medium">ID: {exp.medicineId}</TableCell>
                      <TableCell>{exp.quantity}</TableCell>
                      <TableCell className="hidden sm:table-cell">{exp.exportedBy}</TableCell>
                      <TableCell className="hidden md:table-cell">{exp.reason}</TableCell>
                      <TableCell className="hidden lg:table-cell">{exp.totalPrice || "-"}</TableCell>
                      <TableCell>{exp.exportDate?.toString().split("T")[0]}</TableCell>
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

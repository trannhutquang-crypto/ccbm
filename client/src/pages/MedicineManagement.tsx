import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit2, Trash2, AlertTriangle, X } from "lucide-react";
import { toast } from "sonner";
import { EmptyMedicineState } from "./EmptyStates";

export default function MedicineManagement() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: "", unit: "", minimumStock: 0, currentStock: 0, retailPrice: "", expiryDate: "" });

  const { data: medicines, isLoading, refetch } = trpc.medicines.list.useQuery();
  const { data: lowStockMedicines } = trpc.medicines.lowStock.useQuery();
  const createMutation = trpc.medicines.create.useMutation();
  const updateMutation = trpc.medicines.update.useMutation();
  const deleteMutation = trpc.medicines.delete.useMutation();

  const resetForm = () => {
    setFormData({ name: "", unit: "", minimumStock: 0, currentStock: 0, retailPrice: "", expiryDate: "" });
    setEditingId(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync({
        name: formData.name,
        unit: formData.unit,
        minimumStock: parseInt(formData.minimumStock.toString()),
        currentStock: parseInt(formData.currentStock.toString()),
        retailPrice: formData.retailPrice ? parseFloat(formData.retailPrice) : undefined,
        expiryDate: formData.expiryDate ? new Date(formData.expiryDate) : undefined,
      });
      toast.success("Thuốc đã được thêm thành công");
      resetForm();
      setIsOpen(false);
      refetch();
    } catch (error) {
      toast.error("Lỗi khi thêm thuốc");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    try {
      await updateMutation.mutateAsync({
        id: editingId,
        name: formData.name,
        unit: formData.unit,
        minimumStock: parseInt(formData.minimumStock.toString()),
        retailPrice: formData.retailPrice ? parseFloat(formData.retailPrice) : undefined,
      });
      toast.success("Thuốc đã được cập nhật thành công");
      resetForm();
      setIsOpen(false);
      refetch();
    } catch (error) {
      toast.error("Lỗi khi cập nhật thuốc");
    }
  };

  const handleEdit = (medicine: any) => {
    setEditingId(medicine.id);
    setFormData({
      name: medicine.name,
      unit: medicine.unit,
      minimumStock: medicine.minimumStock,
      currentStock: medicine.currentStock,
      retailPrice: medicine.retailPrice ? medicine.retailPrice.toString() : "",
      expiryDate: medicine.expiryDate ? new Date(medicine.expiryDate).toISOString().split('T')[0] : "",
    });
    setIsOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Bạn có chắc chắn muốn xóa thuốc này?")) {
      try {
        await deleteMutation.mutateAsync({ id });
        toast.success("Thuốc đã được xóa");
        refetch();
      } catch (error) {
        toast.error("Lỗi khi xóa thuốc");
      }
    }
  };

  const isLowStock = (medicineId: number) => {
    return lowStockMedicines?.some(m => m.id === medicineId);
  };

  if (isLoading) {
    return <div className="animate-pulse space-y-4"><div className="h-96 bg-muted rounded"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý danh mục thuốc</h1>
          <p className="text-muted-foreground mt-2">Quản lý danh sách thuốc cấp cứu</p>
        </div>
        {user?.role === "admin" && (
          <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) resetForm();
            setIsOpen(open);
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2 w-full sm:w-auto" onClick={() => resetForm()}>
                <Plus className="h-4 w-4" />
                Thêm thuốc
              </Button>
            </DialogTrigger>
            <DialogContent className="w-full max-w-md">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <DialogTitle>{editingId ? "Chỉnh sửa thuốc" : "Thêm thuốc mới"}</DialogTitle>
                    <DialogDescription>{editingId ? "Cập nhật thông tin thuốc cấp cứu" : "Nhập thông tin thuốc cấp cứu"}</DialogDescription>
                  </div>
                  <button onClick={() => {
                    resetForm();
                    setIsOpen(false);
                  }} className="text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </DialogHeader>
              <form onSubmit={editingId ? handleUpdate : handleCreate} className="space-y-4">
                <div>
                  <Label htmlFor="name">Tên thuốc</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ví dụ: Aspirin"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="unit">Đơn vị tính</Label>
                  <Input
                    id="unit"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="Ví dụ: viên, lọ, hộp"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="minimumStock">Định mức tồn kho tối thiểu</Label>
                  <Input
                    id="minimumStock"
                    type="number"
                    value={formData.minimumStock}
                    onChange={(e) => setFormData({ ...formData, minimumStock: parseInt(e.target.value) })}
                    placeholder="0"
                    min="0"
                    required
                  />
                </div>
                {!editingId && (
                  <div>
                    <Label htmlFor="currentStock">Tồn hiện tại</Label>
                    <Input
                      id="currentStock"
                      type="number"
                      value={formData.currentStock}
                      onChange={(e) => setFormData({ ...formData, currentStock: parseInt(e.target.value) })}
                      placeholder="0"
                      min="0"
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="retailPrice">Giá bán lẻ</Label>
                  <Input
                    id="retailPrice"
                    type="number"
                    step="0.01"
                    value={formData.retailPrice}
                    onChange={(e) => setFormData({ ...formData, retailPrice: e.target.value })}
                    placeholder="0.00"
                    min="0"
                  />
                </div>
                {!editingId && (
                  <div>
                    <Label htmlFor="expiryDate">Hạn dùng</Label>
                    <Input
                      id="expiryDate"
                      type="date"
                      value={formData.expiryDate}
                      onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    />
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingId ? (updateMutation.isPending ? "Đang cập nhật..." : "Cập nhật thuốc") : (createMutation.isPending ? "Đang thêm..." : "Thêm thuốc")}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Medicines Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách thuốc</CardTitle>
          <CardDescription>Tổng cộng {medicines?.length || 0} loại thuốc</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên thuốc</TableHead>
                  <TableHead>Đơn vị</TableHead>
                  <TableHead>Tồn kho</TableHead>
                  <TableHead className="hidden sm:table-cell">Định mức tối thiểu</TableHead>
                  <TableHead className="hidden md:table-cell">Giá bán lẻ</TableHead>
                  <TableHead className="hidden lg:table-cell">Hạn dùng</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  {user?.role === "admin" && <TableHead>Hành động</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {!medicines || medicines.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={user?.role === "admin" ? 8 : 7} className="text-center py-8">
                      <EmptyMedicineState />
                    </TableCell>
                  </TableRow>
                ) : (
                  medicines.map((medicine) => (
                    <TableRow key={medicine.id}>
                      <TableCell className="font-medium">{medicine.name}</TableCell>
                      <TableCell>{medicine.unit}</TableCell>
                      <TableCell>{medicine.currentStock}</TableCell>
                      <TableCell className="hidden sm:table-cell">{medicine.minimumStock}</TableCell>
                      <TableCell className="hidden md:table-cell">{medicine.retailPrice ? `${parseFloat(medicine.retailPrice.toString()).toLocaleString('vi-VN')} đ` : '-'}</TableCell>
                      <TableCell className="hidden lg:table-cell">{medicine.expiryDate ? new Date(medicine.expiryDate).toLocaleDateString('vi-VN') : '-'}</TableCell>
                      <TableCell>
                        {isLowStock(medicine.id) ? (
                          <div className="flex items-center gap-2 text-orange-600">
                            <AlertTriangle className="h-4 w-4" />
                            <span className="text-sm">Dưới định mức</span>
                          </div>
                        ) : (
                          <span className="text-sm text-green-600">Bình thường</span>
                        )}
                      </TableCell>
                      {user?.role === "admin" && (
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(medicine)}
                              title="Chỉnh sửa"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(medicine.id)}
                              disabled={deleteMutation.isPending}
                              title="Xóa"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
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

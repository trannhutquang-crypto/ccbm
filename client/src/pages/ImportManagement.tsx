import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { EmptyImportState } from "./EmptyStates";

export default function ImportManagement() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    medicineId: 0,
    quantity: 0,
    supplier: "",
    batchNumber: "",
    expiryDate: "",
    importDate: "",
    notes: "",
  });

  const { data: medicines } = trpc.medicines.list.useQuery();
  const { data: imports, isLoading, refetch } = trpc.imports.list.useQuery({ limit: 50 });
  const createMutation = trpc.imports.create.useMutation();

  // Lookup map: medicineId → name
  const medicineMap = Object.fromEntries((medicines ?? []).map(m => [m.id, m.name]));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync({
        medicineId: parseInt(formData.medicineId.toString()),
        quantity: parseInt(formData.quantity.toString()),
        supplier: formData.supplier,
        batchNumber: formData.batchNumber || undefined,
        expiryDate: new Date(formData.expiryDate),
        importDate: new Date(formData.importDate),
        notes: formData.notes || undefined,
      });
      toast.success("Phiếu nhập đã được tạo thành công");
      setFormData({ medicineId: 0, quantity: 0, supplier: "", batchNumber: "", expiryDate: "", importDate: "", notes: "" });
      setIsOpen(false);
      refetch();
    } catch (error) {
      toast.error("Lỗi khi tạo phiếu nhập");
    }
  };

  if (isLoading) {
    return <div className="animate-pulse space-y-4"><div className="h-96 bg-muted rounded"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý nhập kho</h1>
          <p className="text-muted-foreground mt-2">Quản lý phiếu nhập thuốc</p>
        </div>
        {user?.role === "admin" && (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                Tạo phiếu nhập
              </Button>
            </DialogTrigger>
            <DialogContent className="w-full max-w-md">
              <DialogHeader>
                <DialogTitle>Tạo phiếu nhập kho</DialogTitle>
                <DialogDescription>Ghi nhận nhập thuốc vào kho</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                <div>
                  <Label htmlFor="medicineId">Thuốc</Label>
                  <select
                    id="medicineId"
                    value={formData.medicineId}
                    onChange={(e) => setFormData({ ...formData, medicineId: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background"
                    required
                  >
                    <option value="">Chọn thuốc</option>
                    {medicines?.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="quantity">Số lượng</Label>
                  <Input id="quantity" type="number" value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })} min="1" required />
                </div>
                <div>
                  <Label htmlFor="supplier">Nhà cung cấp</Label>
                  <Input id="supplier" value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })} required />
                </div>
                <div>
                  <Label htmlFor="batchNumber">Số lô</Label>
                  <Input id="batchNumber" value={formData.batchNumber}
                    onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="expiryDate">Hạn sử dụng</Label>
                  <Input id="expiryDate" type="date" value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })} required />
                </div>
                <div>
                  <Label htmlFor="importDate">Ngày nhập</Label>
                  <Input id="importDate" type="date" value={formData.importDate}
                    onChange={(e) => setFormData({ ...formData, importDate: e.target.value })} required />
                </div>
                <div>
                  <Label htmlFor="notes">Ghi chú</Label>
                  <Input id="notes" value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
                </div>
                <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Đang tạo..." : "Tạo phiếu nhập"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách phiếu nhập</CardTitle>
          <CardDescription>Tổng cộng {imports?.length || 0} phiếu nhập</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên thuốc</TableHead>
                  <TableHead>Số lượng</TableHead>
                  <TableHead className="hidden sm:table-cell">Nhà cung cấp</TableHead>
                  <TableHead className="hidden md:table-cell">Số lô</TableHead>
                  <TableHead className="hidden lg:table-cell">Hạn sử dụng</TableHead>
                  <TableHead>Ngày nhập</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!imports || imports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <EmptyImportState />
                    </TableCell>
                  </TableRow>
                ) : (
                  imports.map((imp) => (
                    <TableRow key={imp.id}>
                      <TableCell className="font-medium">
                        {medicineMap[imp.medicineId] ?? `ID: ${imp.medicineId}`}
                      </TableCell>
                      <TableCell>{imp.quantity}</TableCell>
                      <TableCell className="hidden sm:table-cell">{imp.supplier}</TableCell>
                      <TableCell className="hidden md:table-cell">{imp.batchNumber || "-"}</TableCell>
                      <TableCell className="hidden lg:table-cell">{imp.expiryDate?.toString().split("T")[0]}</TableCell>
                      <TableCell>{imp.importDate?.toString().split("T")[0]}</TableCell>
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

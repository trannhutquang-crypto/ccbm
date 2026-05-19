import { Package, TrendingDown, AlertTriangle } from "lucide-react";

export function EmptyMedicineState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Package className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold">Chưa có thuốc nào</h3>
      <p className="text-muted-foreground text-sm">Danh sách thuốc trống. Hãy thêm thuốc mới để bắt đầu.</p>
    </div>
  );
}

export function EmptyImportState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <TrendingDown className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold">Chưa có phiếu nhập nào</h3>
      <p className="text-muted-foreground text-sm">Danh sách phiếu nhập trống. Hãy tạo phiếu nhập mới.</p>
    </div>
  );
}

export function EmptyExportState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <TrendingDown className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold">Chưa có phiếu xuất nào</h3>
      <p className="text-muted-foreground text-sm">Danh sách phiếu xuất trống. Hãy tạo phiếu xuất mới.</p>
    </div>
  );
}

export function EmptyHistoryState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold">Chưa có giao dịch nào</h3>
      <p className="text-muted-foreground text-sm">Lịch sử giao dịch trống. Hãy tạo phiếu nhập hoặc xuất để bắt đầu.</p>
    </div>
  );
}

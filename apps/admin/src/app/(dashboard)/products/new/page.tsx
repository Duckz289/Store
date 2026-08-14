import { ProductForm } from "@/components/product-form"
import { PageHeader } from "@/components/ui"

export default function NewProductPage() {
  return <div className="stack"><PageHeader eyebrow="Sản phẩm" title="Thêm sản phẩm" description="Tạo sản phẩm, biến thể mặc định và dữ liệu catalog trong một luồng." /><ProductForm /></div>
}

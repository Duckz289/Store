import { PromotionForm } from "@/components/promotion-form"
import { PageHeader } from "@/components/ui"

export default function NewPromotionPage() {
  return <div className="stack"><PageHeader eyebrow="Khuyến mãi" title="Tạo coupon" description="Thiết lập ưu đãi mới qua Medusa Admin API." /><PromotionForm /></div>
}

import { HttpTypes } from "@medusajs/types"
import { ShieldCheck, TruckFast } from "@medusajs/icons"
import Accordion from "./accordion"
import { asCatalogProduct } from "types/catalog"

type ProductTabsProps = {
  product: HttpTypes.StoreProduct
}

const metadataValue = (metadata: Record<string, unknown> | null | undefined, keys: string[]) => {
  if (!metadata) return null
  for (const key of keys) {
    const value = metadata[key]
    if (typeof value === "string" || typeof value === "number") return String(value)
  }
  return null
}

const ProductTabs = ({ product }: ProductTabsProps) => {
  const catalog = asCatalogProduct(product).catalog
  const warranty = metadataValue(product.metadata, ["warranty", "warranty_period", "bao_hanh"])
  const shipping = metadataValue(product.metadata, ["shipping", "shipping_note", "delivery"])
  const nativeSpecifications = [
    ["Chất liệu", product.material],
    ["Xuất xứ", product.origin_country],
    ["Loại sản phẩm", product.type?.value],
    ["Khối lượng", product.weight ? `${product.weight} g` : null],
    ["Kích thước", product.length && product.width && product.height ? `${product.length} × ${product.width} × ${product.height}` : null],
  ].filter((item): item is [string, string] => Boolean(item[1]))
  const specifications = [
    ...(catalog?.specifications?.items ?? []).map(
      (item) =>
        [
          item.label,
          `${item.value}${item.unit ? ` ${item.unit}` : ""}`,
        ] as [string, string]
    ),
    ...nativeSpecifications,
  ]

  return (
    <div className="rounded-[var(--hp-radius-card)] border border-[var(--hp-line)] bg-[var(--hp-surface)] px-5">
      <Accordion type="multiple">
        <Accordion.Item title="Thông số sản phẩm" headingSize="medium" value="specifications">
          <div className="py-5">
            {specifications.length ? (
              <dl className="grid grid-cols-1 gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
                {specifications.map(([label, value]) => (
                  <div key={label} className="flex items-start justify-between gap-4 border-b border-[var(--hp-line)] pb-3">
                    <dt className="text-[var(--hp-muted)]">{label}</dt>
                    <dd className="text-right font-medium text-[var(--hp-ink)]">{value}</dd>
                  </div>
                ))}
              </dl>
            ) : <p className="text-sm leading-6 text-[var(--hp-muted)]">Thông số chi tiết đang được cập nhật.</p>}
          </div>
        </Accordion.Item>
        <Accordion.Item title="Giao hàng" headingSize="medium" value="shipping">
          <div className="flex gap-3 py-5 text-sm leading-6 text-[var(--hp-muted)]">
            <TruckFast className="mt-0.5 h-5 w-5 shrink-0 text-[var(--hp-accent)]" />
            <p>{shipping || "Phí và thời gian giao hàng được xác nhận theo địa chỉ nhận hàng ở bước thanh toán."}</p>
          </div>
        </Accordion.Item>
        <Accordion.Item title="Bảo hành" headingSize="medium" value="warranty">
          <div className="flex gap-3 py-5 text-sm leading-6 text-[var(--hp-muted)]">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[var(--hp-accent)]" />
            <p>{warranty || "Chưa có thông tin bảo hành riêng được cấu hình cho sản phẩm này."}</p>
          </div>
        </Accordion.Item>
      </Accordion>
    </div>
  )
}

export default ProductTabs

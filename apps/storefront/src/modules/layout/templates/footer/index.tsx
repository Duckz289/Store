import { listCategories } from "@lib/data/categories"
import { listCollections } from "@lib/data/collections"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default async function Footer() {
  const [{ collections }, productCategories] = await Promise.all([
    listCollections({ fields: "id,handle,title" }),
    listCategories().catch(() => []),
  ])

  const topLevelCategories = (productCategories ?? [])
    .filter((category) => !category.parent_category)
    .slice(0, 6)

  return (
    <footer className="border-t border-[var(--hp-line)] bg-[var(--hp-ink)] text-white">
      <div className="content-container py-12 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.25fr_1fr_1fr_1fr]">
          <div>
            <LocalizedClientLink href="/" className="inline-flex flex-col leading-none">
              <span className="text-xl font-extrabold tracking-[-0.04em]">HƯNG PHÁT</span>
              <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/60">
                Điện tử tin cậy
              </span>
            </LocalizedClientLink>
            <p className="mt-5 max-w-xs text-sm leading-6 text-white/65">
              Mua sắm thiết bị điện tử với thông tin dễ hiểu và hỗ trợ sau mua
              có quy trình.
            </p>
          </div>

          <div>
            <h2 className="text-sm font-bold">Danh mục</h2>
            <ul className="mt-4 space-y-3 text-sm text-white/65">
              {topLevelCategories.map((category) => (
                <li key={category.id}>
                  <LocalizedClientLink
                    href={`/categories/${category.handle}`}
                    className="hover:text-white"
                  >
                    {category.name}
                  </LocalizedClientLink>
                </li>
              ))}
              <li>
                <LocalizedClientLink href="/store" className="font-semibold text-white hover:text-white/80">
                  Xem tất cả sản phẩm
                </LocalizedClientLink>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-bold">Khám phá</h2>
            <ul className="mt-4 space-y-3 text-sm text-white/65">
              {(collections ?? []).slice(0, 5).map((collection) => (
                <li key={collection.id}>
                  <LocalizedClientLink
                    href={`/collections/${collection.handle}`}
                    className="hover:text-white"
                  >
                    {collection.title}
                  </LocalizedClientLink>
                </li>
              ))}
              <li>
                <LocalizedClientLink href="/#repair" className="hover:text-white">
                  Dịch vụ sửa chữa
                </LocalizedClientLink>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-bold">Tài khoản và hỗ trợ</h2>
            <ul className="mt-4 space-y-3 text-sm text-white/65">
              <li>
                <LocalizedClientLink href="/account" className="hover:text-white">
                  Tài khoản
                </LocalizedClientLink>
              </li>
              <li>
                <LocalizedClientLink href="/account/orders" className="hover:text-white">
                  Tra cứu đơn hàng
                </LocalizedClientLink>
              </li>
              <li>
                <LocalizedClientLink href="/cart" className="hover:text-white">
                  Giỏ hàng
                </LocalizedClientLink>
              </li>
              <li>
                <LocalizedClientLink href="/repair" className="hover:text-white">
                  Hồ sơ sửa chữa
                </LocalizedClientLink>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/15 pt-5 text-xs text-white/55 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Điện Tử Hưng Phát. Bảo lưu mọi quyền.</p>
          <p>Thanh toán và giá được xác nhận bởi hệ thống cửa hàng.</p>
        </div>
      </div>
    </footer>
  )
}

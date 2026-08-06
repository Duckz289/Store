import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const CategoryShortcuts = ({
  categories,
}: {
  categories: HttpTypes.StoreProductCategory[]
}) => {
  const topLevelCategories = categories
    .filter((category) => !category.parent_category)
    .slice(0, 8)

  if (!topLevelCategories.length) {
    return null
  }

  return (
    <section className="content-container py-10 sm:py-14" aria-labelledby="category-heading">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--hp-accent)]">
            Bắt đầu từ nhu cầu của bạn
          </p>
          <h2 id="category-heading" className="mt-2 text-xl font-bold text-[var(--hp-ink)] sm:text-2xl">
            Khám phá danh mục
          </h2>
        </div>
        <LocalizedClientLink
          href="/store"
          className="hidden text-sm font-semibold text-[var(--hp-accent)] hover:text-[var(--hp-accent-strong)] sm:block"
        >
          Xem tất cả
        </LocalizedClientLink>
      </div>
      <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {topLevelCategories.map((category, index) => (
          <li key={category.id}>
            <LocalizedClientLink
              href={`/categories/${category.handle}`}
              className="group flex min-h-[112px] flex-col justify-between rounded-[var(--hp-radius-card)] border border-[var(--hp-line)] bg-[var(--hp-surface)] p-4 transition-colors hover:border-[var(--hp-accent)] hover:bg-[var(--hp-accent-soft)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hp-accent)]"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-[var(--hp-radius-control)] bg-[var(--hp-paper)] text-sm font-extrabold text-[var(--hp-accent)] group-hover:bg-white">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="mt-5 text-sm font-semibold leading-5 text-[var(--hp-ink)]">
                {category.name}
              </span>
            </LocalizedClientLink>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default CategoryShortcuts

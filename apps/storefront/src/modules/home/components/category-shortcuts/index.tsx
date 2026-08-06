import {
  Camera,
  Clock,
  ComputerDesktop,
  LaptopMobile,
  Phone,
  ShoppingBag,
  SquaresPlus,
  Tools,
} from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const shortcutIcons = [
  Phone,
  LaptopMobile,
  Camera,
  Clock,
  ShoppingBag,
  ComputerDesktop,
  Tools,
  SquaresPlus,
]

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
    <section className="border-y border-[var(--hp-line)] bg-[var(--hp-surface)]" aria-label="Danh mục phổ biến">
      <div className="content-container">
        <ul className="-mx-4 flex overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-4 sm:px-0 lg:grid-cols-8">
          {topLevelCategories.map((category, index) => {
            const Icon = shortcutIcons[index % shortcutIcons.length]

            return (
              <li key={category.id} className="min-w-[128px] sm:min-w-0">
                <LocalizedClientLink
                  href={`/categories/${category.handle}`}
                  className="group flex min-h-[112px] flex-col items-center justify-center gap-3 border-r border-[var(--hp-line)] px-3 py-4 text-center last:border-r-0 hover:bg-[var(--hp-accent-soft)]"
                >
                  <Icon className="h-8 w-8 text-[var(--hp-muted)] group-hover:text-[var(--hp-accent)]" />
                  <span className="text-[14px] font-medium leading-5 text-[var(--hp-ink)] group-hover:text-[var(--hp-accent)]">
                    {category.name}
                  </span>
                </LocalizedClientLink>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

export default CategoryShortcuts

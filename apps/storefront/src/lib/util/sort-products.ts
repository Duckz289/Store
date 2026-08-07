import { HttpTypes } from "@medusajs/types"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { asCatalogProduct } from "types/catalog"

interface MinPricedProduct extends HttpTypes.StoreProduct {
  _minPrice?: number
}

/**
 * Helper function to sort products by price until the store API supports sorting by price
 * @param products
 * @param sortBy
 * @returns products sorted by price
 */
export function sortProducts(
  products: HttpTypes.StoreProduct[],
  sortBy: SortOptions,
  merchandisingContext?: {
    kind: "categories" | "collections" | "homepage"
    id: string
  }
): HttpTypes.StoreProduct[] {
  const sortedProducts = [...products] as MinPricedProduct[]

  if (sortBy === "merchandising" && merchandisingContext) {
    sortedProducts.sort((left, right) => {
      const leftPosition =
        asCatalogProduct(left).catalog?.merchandising?.[
          merchandisingContext.kind
        ]?.[merchandisingContext.id]
      const rightPosition =
        asCatalogProduct(right).catalog?.merchandising?.[
          merchandisingContext.kind
        ]?.[merchandisingContext.id]

      return (
        (leftPosition ?? Number.MAX_SAFE_INTEGER) -
          (rightPosition ?? Number.MAX_SAFE_INTEGER) ||
        new Date(right.created_at!).getTime() -
          new Date(left.created_at!).getTime()
      )
    })
  }

  if (["price_asc", "price_desc"].includes(sortBy)) {
    // Precompute the minimum price for each product
    sortedProducts.forEach((product) => {
      if (product.variants && product.variants.length > 0) {
        product._minPrice = Math.min(
          ...product.variants.map(
            (variant) => variant?.calculated_price?.calculated_amount || 0
          )
        )
      } else {
        product._minPrice = Infinity
      }
    })

    // Sort products based on the precomputed minimum prices
    sortedProducts.sort((a, b) => {
      const diff = a._minPrice! - b._minPrice!
      return sortBy === "price_asc" ? diff : -diff
    })
  }

  if (sortBy === "created_at") {
    sortedProducts.sort((a, b) => {
      return (
        new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime()
      )
    })
  }

  return sortedProducts
}

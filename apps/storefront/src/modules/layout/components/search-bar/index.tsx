"use client"

import { searchCatalog, SearchCatalogResult } from "@lib/data/products"
import { MagnifyingGlass, XMark } from "@medusajs/icons"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { FormEvent, useEffect, useRef, useState } from "react"

const SearchBar = ({ countryCode }: { countryCode: string }) => {
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<SearchCatalogResult>(emptyResults)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const navigateToSearch = () => {
    const trimmedQuery = query.trim()

    if (!trimmedQuery) {
      inputRef.current?.focus()
      return
    }

    router.push(`/${countryCode}/store?q=${encodeURIComponent(
      trimmedQuery
    )}`)
  }

  useEffect(() => {
    const trimmedQuery = query.trim()

    if (trimmedQuery.length < 2) {
      setSuggestions(emptyResults)
      setIsOpen(false)
      setIsLoading(false)
      setHasError(false)
      return
    }

    let cancelled = false
    const timeout = window.setTimeout(async () => {
      setIsLoading(true)
      setHasError(false)

      try {
        const results = await searchCatalog({
          countryCode,
          query: trimmedQuery,
        })

        if (!cancelled) {
          setSuggestions(results)
          setIsOpen(true)
        }
      } catch {
        if (!cancelled) {
          setSuggestions(emptyResults)
          setIsOpen(true)
          setHasError(true)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }, 240)

    return () => {
      cancelled = true
      window.clearTimeout(timeout)
    }
  }, [countryCode, query, router])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    navigateToSearch()
  }

  const clearSearch = () => {
    setQuery("")
    setSuggestions(emptyResults)
    setIsOpen(false)
    inputRef.current?.focus()
  }

  return (
    <div className="relative w-full flex-1">
      <form
        role="search"
        onSubmit={handleSubmit}
        className="flex h-11 items-center rounded-[var(--hp-radius-control)] border border-[var(--hp-line)] bg-[var(--hp-surface)] px-3 transition-colors focus-within:border-[var(--hp-accent)] focus-within:ring-2 focus-within:ring-[var(--hp-accent-soft)]"
      >
        <MagnifyingGlass className="mr-2 h-5 w-5 shrink-0 text-[var(--hp-muted)]" />
        <div
          role="combobox"
          aria-expanded={isOpen}
          aria-controls="search-suggestions"
          aria-haspopup="listbox"
          className="flex min-w-0 flex-1 items-center"
        >
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => query.trim().length >= 2 && setIsOpen(true)}
            onBlur={() => window.setTimeout(() => setIsOpen(false), 160)}
            placeholder="Bạn muốn tìm sản phẩm nào?"
            aria-label="Tìm kiếm sản phẩm"
            aria-autocomplete="list"
            className="min-w-0 flex-1 border-none bg-transparent text-[14px] font-normal leading-5 text-[var(--hp-ink)] outline-none placeholder:text-[var(--hp-muted)] focus:border-none focus:outline-none focus-visible:outline-none focus:ring-0"
          />
        </div>
        {query && (
          <button
            type="button"
            onClick={clearSearch}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--hp-muted)] hover:bg-[var(--hp-paper)] hover:text-[var(--hp-ink)]"
            aria-label="Xóa tìm kiếm"
          >
            <XMark className="h-4 w-4" />
          </button>
        )}
        <button
          type="submit"
          className="ml-2 hidden rounded-[var(--hp-radius-control)] bg-[var(--hp-accent)] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[var(--hp-accent-strong)] xsmall:block"
        >
          Tìm
        </button>
      </form>

      {isOpen && (
        <div
          id="search-suggestions"
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+8px)] z-[70] overflow-hidden rounded-[var(--hp-radius-card)] border border-[var(--hp-line)] bg-[var(--hp-surface)] shadow-[var(--hp-shadow-card)]"
        >
          {isLoading ? (
            <p className="px-4 py-3 text-sm text-[var(--hp-muted)]">
              Đang tìm sản phẩm...
            </p>
          ) : hasError ? (
            <p className="px-4 py-3 text-sm text-[var(--hp-danger)]">
              Không thể tìm lúc này. Hãy thử lại sau.
            </p>
          ) : hasSearchResults(suggestions) ? (
            <div>
              {suggestions.categories.length || suggestions.brands.length ? (
                <div className="grid gap-4 border-b border-[var(--hp-line)] px-4 py-4 sm:grid-cols-2">
                  {suggestions.categories.length ? (
                    <div>
                      <p className="mb-2 text-xs font-semibold text-[var(--hp-muted)]">
                        Danh mục
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {suggestions.categories.map((category) => (
                          <LocalizedClientLink
                            key={category.id}
                            href={`/categories/${category.handle}`}
                            onClick={() => setIsOpen(false)}
                            className="rounded-[var(--hp-radius-control)] border border-[var(--hp-line)] px-2.5 py-1.5 text-xs font-semibold text-[var(--hp-ink)] hover:border-[var(--hp-accent)] hover:text-[var(--hp-accent)]"
                          >
                            {category.name}
                          </LocalizedClientLink>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {suggestions.brands.length ? (
                    <div>
                      <p className="mb-2 text-xs font-semibold text-[var(--hp-muted)]">
                        Hãng
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {suggestions.brands.map((brand) => (
                          <LocalizedClientLink
                            key={brand.handle}
                            href={`/store?brand=${encodeURIComponent(brand.handle)}`}
                            onClick={() => setIsOpen(false)}
                            className="rounded-[var(--hp-radius-control)] bg-[var(--hp-paper)] px-2.5 py-1.5 text-xs font-semibold text-[var(--hp-ink)] hover:text-[var(--hp-accent)]"
                          >
                            {brand.name}
                          </LocalizedClientLink>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
              <ul className="divide-y divide-[var(--hp-line)]">
              {suggestions.products.map((product) => (
                <li key={product.id} role="option" aria-selected="false">
                  <LocalizedClientLink
                    href={`/products/${product.handle}`}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-[var(--hp-ink)] hover:bg-[var(--hp-paper)]"
                  >
                    <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-[8px] bg-[var(--hp-paper)]">
                      {product.thumbnail ? (
                        <Image
                          unoptimized
                          fill
                          sizes="48px"
                          src={product.thumbnail}
                          alt={product.title}
                          className="object-contain"
                        />
                      ) : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-2 font-semibold">
                        {product.title}
                      </span>
                      <span className="mt-1 block text-xs text-[var(--hp-muted)]">
                        {[product.brand, product.model]
                          .filter(Boolean)
                          .join(" / ")}
                      </span>
                    </span>
                    {product.price ? (
                      <span className="shrink-0 text-xs font-bold text-[var(--hp-accent)]">
                        {formatVnd(product.price)}
                      </span>
                    ) : null}
                  </LocalizedClientLink>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={navigateToSearch}
                  className="w-full px-4 py-3 text-left text-sm font-semibold text-[var(--hp-accent)] hover:bg-[var(--hp-accent-soft)]"
                >
                  Xem tất cả kết quả cho “{query.trim()}”
                </button>
              </li>
              </ul>
            </div>
          ) : (
            <p className="px-4 py-3 text-sm text-[var(--hp-muted)]">
              Chưa tìm thấy sản phẩm phù hợp.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

const emptyResults: SearchCatalogResult = {
  products: [],
  categories: [],
  brands: [],
}

function hasSearchResults(results: SearchCatalogResult) {
  return Boolean(
    results.products.length || results.categories.length || results.brands.length,
  )
}

function formatVnd(amount: number) {
  return `${new Intl.NumberFormat("vi-VN").format(amount)} đ`
}

export default SearchBar

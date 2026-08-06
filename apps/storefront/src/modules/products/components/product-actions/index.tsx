"use client"

import { CheckCircleSolid, InformationCircle, ShoppingCart } from "@medusajs/icons"
import { addToCart } from "@lib/data/cart"
import { useIntersection } from "@lib/hooks/use-in-view"
import { HttpTypes } from "@medusajs/types"
import Divider from "@modules/common/components/divider"
import { Button } from "@modules/common/components/ui"
import { isEqual } from "lodash"
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import ProductPrice from "../product-price"
import MobileActions from "./mobile-actions"
import OptionSelect from "./option-select"

type ProductActionsProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  disabled?: boolean
}

const optionsAsKeymap = (variantOptions: HttpTypes.StoreProductVariant["options"]) =>
  variantOptions?.reduce((acc: Record<string, string>, option) => {
    if (option.option_id) acc[option.option_id] = option.value
    return acc
  }, {})

export default function ProductActions({ product, disabled }: ProductActionsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [options, setOptions] = useState<Record<string, string | undefined>>({})
  const [isAdding, setIsAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const countryCode = useParams().countryCode as string

  useEffect(() => {
    if (product.variants?.length === 1) {
      setOptions(optionsAsKeymap(product.variants[0].options) ?? {})
    }
  }, [product.variants])

  const selectedVariant = useMemo(() => product.variants?.find((variant) => isEqual(optionsAsKeymap(variant.options), options)), [product.variants, options])
  const isValidVariant = useMemo(() => product.variants?.some((variant) => isEqual(optionsAsKeymap(variant.options), options)), [product.variants, options])

  const setOptionValue = (optionId: string, value: string) => {
    setAddError(null)
    setOptions((current) => ({ ...current, [optionId]: value }))
  }

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    const value = isValidVariant ? selectedVariant?.id : null

    if (params.get("v_id") === value) return
    if (value) params.set("v_id", value)
    else params.delete("v_id")
    router.replace(`${pathname}?${params.toString()}`)
  }, [isValidVariant, pathname, router, searchParams, selectedVariant])

  const inStock = useMemo(() => {
    if (selectedVariant && !selectedVariant.manage_inventory) return true
    if (selectedVariant?.allow_backorder) return true
    return Boolean(selectedVariant?.manage_inventory && (selectedVariant.inventory_quantity || 0) > 0)
  }, [selectedVariant])

  const actionsRef = useRef<HTMLDivElement>(null)
  const inView = useIntersection(actionsRef, "0px")

  const handleAddToCart = async () => {
    if (!selectedVariant?.id) return
    setIsAdding(true)
    setAddError(null)
    try {
      await addToCart({ variantId: selectedVariant.id, quantity: 1, countryCode })
      router.refresh()
    } catch {
      setAddError("Không thể thêm sản phẩm vào giỏ hàng. Vui lòng thử lại.")
    } finally {
      setIsAdding(false)
    }
  }

  const needsSelection = (product.variants?.length ?? 0) > 1 && !selectedVariant
  const statusMessage = !selectedVariant
    ? "Chọn phiên bản để xem tồn kho chính xác"
    : inStock
    ? selectedVariant.manage_inventory
      ? `Còn ${selectedVariant.inventory_quantity || 0} sản phẩm`
      : "Sẵn sàng đặt hàng"
    : "Tạm hết hàng"

  return (
    <>
      <div ref={actionsRef} className="rounded-[var(--hp-radius-card)] border border-[var(--hp-line)] bg-[var(--hp-surface)] p-5 shadow-[var(--hp-shadow-card)]">
        <div className="flex flex-col gap-5">
          {(product.variants?.length ?? 0) > 1 && (
            <div className="flex flex-col gap-4">
              {(product.options || []).map((option) => (
                <OptionSelect key={option.id} option={option} current={options[option.id]} updateOption={setOptionValue} title={option.title ?? ""} data-testid="product-options" disabled={Boolean(disabled || isAdding)} />
              ))}
              <Divider />
            </div>
          )}

          <ProductPrice product={product} variant={selectedVariant} />

          <div className="space-y-2 text-sm">
            {selectedVariant?.sku ? <p className="text-[var(--hp-muted)]">SKU: <span className="font-medium text-[var(--hp-ink)]">{selectedVariant.sku}</span></p> : null}
            <p className={`flex items-center gap-2 font-medium ${inStock && selectedVariant ? "text-[var(--hp-success)]" : "text-[var(--hp-muted)]"}`} aria-live="polite">
              {inStock && selectedVariant ? <CheckCircleSolid className="h-4 w-4" /> : <InformationCircle className="h-4 w-4" />}
              {statusMessage}
            </p>
          </div>

          {addError ? <p className="rounded-[8px] bg-red-50 px-3 py-2 text-sm text-[var(--hp-danger)]" role="alert">{addError}</p> : null}

          <Button
            onClick={handleAddToCart}
            disabled={!inStock || !selectedVariant || Boolean(disabled) || isAdding || !isValidVariant}
            variant="primary"
            className="h-12 w-full !bg-[var(--hp-accent)] !text-white hover:!bg-[var(--hp-accent-strong)]"
            isLoading={isAdding}
            data-testid="add-product-button"
          >
            <ShoppingCart className="h-5 w-5" />
            {needsSelection ? "Chọn phiên bản" : !inStock ? "Tạm hết hàng" : "Thêm vào giỏ hàng"}
          </Button>
        </div>
      </div>
      <MobileActions product={product} variant={selectedVariant} options={options} updateOptions={setOptionValue} inStock={inStock} handleAddToCart={handleAddToCart} isAdding={isAdding} show={!inView} optionsDisabled={Boolean(disabled || isAdding)} />
    </>
  )
}

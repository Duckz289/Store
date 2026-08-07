"use client"

import { HttpTypes } from "@medusajs/types"
import { ChevronLeft, ChevronRight } from "@medusajs/icons"
import { getProductImage } from "@lib/util/product-image"
import Image from "next/image"
import { useMemo, useState } from "react"
import { asCatalogProduct } from "types/catalog"

type ImageGalleryProps = {
  product: HttpTypes.StoreProduct
  images: HttpTypes.StoreProductImage[]
}

const ImageGallery = ({ product, images }: ImageGalleryProps) => {
  const mediaAltText = asCatalogProduct(product).catalog?.media_alt_text
  const galleryImages = useMemo(() => {
    const sourceImages = images.filter((image) => image.url)
    const fallback = getProductImage(product)

    if (sourceImages.length) {
      return sourceImages
    }

    return fallback ? [{ id: "local-fallback", url: fallback }] : []
  }, [images, product])
  const [activeIndex, setActiveIndex] = useState(0)
  const activeImage = galleryImages[activeIndex]

  if (!activeImage?.url) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-[var(--hp-radius-card)] border border-dashed border-[var(--hp-line)] bg-[var(--hp-surface)] text-sm text-[var(--hp-muted)]">
        Hình sản phẩm đang được cập nhật
      </div>
    )
  }

  const showPrevious = () => setActiveIndex((index) => (index === 0 ? galleryImages.length - 1 : index - 1))
  const showNext = () => setActiveIndex((index) => (index === galleryImages.length - 1 ? 0 : index + 1))

  return (
    <div className={galleryImages.length > 1 ? "grid gap-3 sm:grid-cols-[76px_minmax(0,1fr)]" : "block"}>
      {galleryImages.length > 1 && (
        <div className="order-2 flex gap-2 overflow-x-auto pb-1 sm:order-1 sm:flex-col sm:overflow-visible">
          {galleryImages.map((image, index) => (
            <button
              key={image.id || image.url}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-[8px] border bg-[var(--hp-paper)] ${activeIndex === index ? "border-[var(--hp-accent)] ring-1 ring-[var(--hp-accent)]" : "border-[var(--hp-line)] hover:border-[var(--hp-accent)]"}`}
              aria-label={`Xem hình ${index + 1} của ${product.title}`}
              aria-current={activeIndex === index ? "true" : undefined}
            >
              <Image
                src={image.url!}
                alt={mediaAltText?.[image.url!] || `${product.title} ${index + 1}`}
                fill
                sizes="64px"
                className="object-contain p-1"
              />
            </button>
          ))}
        </div>
      )}
      <div className="group relative order-1 aspect-square overflow-hidden rounded-[var(--hp-radius-card)] border border-[var(--hp-line)] bg-[var(--hp-surface)] sm:order-2">
        <Image
          src={activeImage.url}
          alt={mediaAltText?.[activeImage.url] || product.title}
          fill
          priority
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 66vw, 760px"
          className="object-contain p-6"
        />
        {galleryImages.length > 1 && (
          <>
            <button type="button" onClick={showPrevious} className="absolute left-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--hp-line)] bg-white/95 text-[var(--hp-ink)] opacity-0 shadow-sm transition-opacity group-hover:opacity-100 focus:opacity-100" aria-label="Hình trước">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button type="button" onClick={showNext} className="absolute right-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--hp-line)] bg-white/95 text-[var(--hp-ink)] opacity-0 shadow-sm transition-opacity group-hover:opacity-100 focus:opacity-100" aria-label="Hình tiếp theo">
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default ImageGallery

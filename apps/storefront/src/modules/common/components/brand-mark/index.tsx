import { clx } from "@modules/common/components/ui"
import Image from "next/image"

type BrandMarkProps = {
  name: string
  logoUrl?: string | null
  logoAlt?: string | null
  className?: string
  /** Set when the brand name is already rendered next to the mark. */
  decorative?: boolean
}

/**
 * Renders a brand's real logo, or nothing at all. Initial-letter avatars are
 * deliberately not used: a made-up monogram reads as a brand identity the shop
 * does not have, so a brand without a logo simply shows its name as text.
 */
const BrandMark = ({
  name,
  logoUrl,
  logoAlt,
  className,
  decorative = true,
}: BrandMarkProps) => {
  if (!logoUrl?.trim()) return null

  return (
    <span
      className={clx(
        "relative inline-flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-md border border-[var(--hp-line)] bg-white",
        className
      )}
    >
      <Image
        className="h-full w-full object-contain p-1"
        src={logoUrl}
        alt={decorative ? "" : logoAlt?.trim() || `Logo ${name}`}
        aria-hidden={decorative || undefined}
        width={28}
        height={28}
        unoptimized
        loading="lazy"
      />
    </span>
  )
}

export default BrandMark

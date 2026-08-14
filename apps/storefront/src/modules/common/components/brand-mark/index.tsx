import { clx } from "@modules/common/components/ui"
import Image from "next/image"

type BrandMarkProps = {
  name: string
  logoUrl?: string | null
  className?: string
}

const initialsFor = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

const BrandMark = ({ name, logoUrl, className }: BrandMarkProps) => (
  <span
    className={clx(
      "relative inline-flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-md border border-[var(--hp-line)] bg-white text-[10px] font-extrabold tracking-tight text-[var(--hp-ink)]",
      className,
    )}
    aria-hidden="true"
  >
    <span>{initialsFor(name)}</span>
    {logoUrl ? (
      <Image
        className="absolute inset-0 h-full w-full bg-white object-contain p-1"
        src={logoUrl}
        alt=""
        width={28}
        height={28}
        unoptimized
        loading="lazy"
        onError={(event) => {
          event.currentTarget.style.display = "none"
        }}
      />
    ) : null}
  </span>
)

export default BrandMark

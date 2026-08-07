"use client"

import units from "@modules/account/data/vietnamese-administrative-units.json"
import { useMemo, useState } from "react"

type Ward = {
  Code: string
  FullName: string
  ProvinceCode: string
}

type Province = {
  Code: string
  FullName: string
  Wards: Ward[]
}

const provinceData = units as Province[]

type VietnamAddressFieldsProps = {
  initialProvince?: string
  initialCity?: string
}

const findProvince = (value: string) => {
  if (!value) return undefined

  return provinceData.find((province) => {
    const name = province.FullName.toLowerCase()
    const input = value.toLowerCase()
    return name === input || name.endsWith(` ${input}`) || input.endsWith(` ${name}`)
  })
}

const VietnamAddressFields = ({
  initialProvince = "",
  initialCity = "",
}: VietnamAddressFieldsProps) => {
  const initialProvinceRecord = useMemo(
    () => findProvince(initialProvince),
    [initialProvince]
  )
  const [province, setProvince] = useState(
    initialProvinceRecord?.FullName ?? initialProvince
  )
  const [city, setCity] = useState(initialCity)
  const provinceCode = findProvince(province)?.Code ?? ""

  const wards = useMemo(
    () => provinceData.find((province) => province.Code === provinceCode)?.Wards ?? [],
    [provinceCode]
  )

  const hasCustomCity = city && !wards.some((ward) => ward.FullName === city)
  const hasCustomProvince = province && !provinceData.some((item) => item.FullName === province)

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <label className="flex flex-col gap-1 text-sm font-medium text-[var(--hp-ink)]">
        <span>Tỉnh / thành phố<span className="text-[var(--hp-accent)]">*</span></span>
        <select
          name="province"
          required
          value={province}
          onChange={(event) => {
            setProvince(event.target.value)
            setCity("")
          }}
          className="h-11 w-full rounded-[var(--hp-radius-control)] border border-[var(--hp-line)] bg-white px-3 text-sm text-[var(--hp-ink)] outline-none transition focus:border-[var(--hp-accent)] focus:ring-2 focus:ring-[var(--hp-accent-soft)]"
          autoComplete="address-level1"
          data-testid="province-select"
        >
          <option value="">Chọn tỉnh / thành phố</option>
          {hasCustomProvince && <option value={province}>{province}</option>}
          {provinceData.map((province) => (
            <option key={province.Code} value={province.FullName}>
              {province.FullName}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-[var(--hp-ink)]">
        <span>Phường / xã<span className="text-[var(--hp-accent)]">*</span></span>
        <select
          name="city"
          required
          value={city}
          onChange={(event) => setCity(event.target.value)}
          disabled={!provinceCode}
          className="h-11 w-full rounded-[var(--hp-radius-control)] border border-[var(--hp-line)] bg-white px-3 text-sm text-[var(--hp-ink)] outline-none transition focus:border-[var(--hp-accent)] focus:ring-2 focus:ring-[var(--hp-accent-soft)] disabled:cursor-not-allowed disabled:bg-[var(--hp-paper)] disabled:text-[var(--hp-muted)]"
          autoComplete="address-level2"
          data-testid="ward-select"
        >
          <option value="">
            {provinceCode ? "Chọn phường / xã" : "Chọn tỉnh trước"}
          </option>
          {hasCustomCity && <option value={city}>{city}</option>}
          {wards.map((ward) => (
            <option key={ward.Code} value={ward.FullName}>
              {ward.FullName}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}

export default VietnamAddressFields

import { HttpTypes } from "@medusajs/types"
import { clx } from "@modules/common/components/ui"
import React from "react"

type OptionSelectProps = {
  option: HttpTypes.StoreProductOption
  current: string | undefined
  updateOption: (optionId: string, value: string) => void
  title: string
  disabled: boolean
  "data-testid"?: string
}

const OptionSelect: React.FC<OptionSelectProps> = ({ option, current, updateOption, title, "data-testid": dataTestId, disabled }) => {
  const values = (option.values ?? []).map((value) => value.value).filter(Boolean) as string[]

  return (
    <fieldset className="flex flex-col gap-3" disabled={disabled} data-testid={dataTestId}>
      <legend className="text-sm font-semibold text-[var(--hp-ink)]">Chọn {title}</legend>
      <div className="flex flex-wrap gap-2">
        {values.map((value) => {
          const isSelected = value === current
          return (
            <button
              type="button"
              onClick={() => updateOption(option.id, value)}
              key={value}
              className={clx("min-h-10 rounded-[var(--hp-radius-control)] border px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hp-accent)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50", {
                "border-[var(--hp-accent)] bg-[var(--hp-accent-soft)] text-[var(--hp-accent)]": isSelected,
                "border-[var(--hp-line)] bg-[var(--hp-surface)] text-[var(--hp-ink)] hover:border-[var(--hp-accent)]": !isSelected,
              })}
              aria-pressed={isSelected}
            >
              {value}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

export default OptionSelect

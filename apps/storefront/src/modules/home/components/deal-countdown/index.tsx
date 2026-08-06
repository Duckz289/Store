"use client"

import { useEffect, useState } from "react"

const getRemainingTime = () => {
  const now = new Date()
  const end = new Date(now)

  end.setHours(23, 59, 59, 999)

  const remaining = Math.max(0, end.getTime() - now.getTime())
  const hours = Math.floor(remaining / 3_600_000)
  const minutes = Math.floor((remaining % 3_600_000) / 60_000)
  const seconds = Math.floor((remaining % 60_000) / 1_000)

  return [hours, minutes, seconds].map((value) =>
    String(value).padStart(2, "0")
  )
}

const DealCountdown = () => {
  const [parts, setParts] = useState(["00", "00", "00"])

  useEffect(() => {
    const update = () => setParts(getRemainingTime())

    update()
    const timer = window.setInterval(update, 1_000)

    return () => window.clearInterval(timer)
  }, [])

  return (
    <div className="flex items-center gap-1.5 tabular-nums" aria-label={`Còn ${parts[0]} giờ ${parts[1]} phút ${parts[2]} giây`}>
      {parts.map((part, index) => (
        <span key={`${index}-${part}`} className="flex items-center gap-1.5">
          <span className="flex h-8 min-w-9 items-center justify-center rounded-[6px] bg-[var(--hp-ink)] px-2 text-[13px] font-semibold text-white">
            {part}
          </span>
          {index < parts.length - 1 && (
            <span className="text-sm font-semibold text-[var(--hp-muted)]">:</span>
          )}
        </span>
      ))}
    </div>
  )
}

export default DealCountdown

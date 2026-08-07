import { deleteLineItem } from "@lib/data/cart"
import { Spinner, Trash } from "@medusajs/icons"
import { clx } from "@modules/common/components/ui"
import { useState } from "react"

const DeleteButton = ({
  id,
  children,
  className,
  "data-testid": dataTestId,
}: {
  id: string
  children?: React.ReactNode
  className?: string
  "data-testid"?: string
}) => {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    setError(null)
    setIsDeleting(true)
    await deleteLineItem(id).catch((err) => {
      setError(
        err instanceof Error ? err.message : "Không thể xóa sản phẩm khỏi giỏ hàng."
      )
    })
    setIsDeleting(false)
  }

  return (
    <div
      className={clx(
        "flex items-center justify-between text-small-regular",
        className
      )}
    >
      <button
        type="button"
        aria-label={children ? undefined : "Xóa sản phẩm khỏi giỏ hàng"}
        disabled={isDeleting}
        className="flex gap-x-1 text-ui-fg-subtle hover:text-ui-fg-base cursor-pointer"
        data-testid={dataTestId}
        onClick={() => handleDelete(id)}
      >
        {isDeleting ? <Spinner className="animate-spin" /> : <Trash />}
        <span>{children}</span>
      </button>
      {error && (
        <span className="text-rose-500 text-xs" role="alert" aria-live="assertive">
          {error}
        </span>
      )}
    </div>
  )
}

export default DeleteButton

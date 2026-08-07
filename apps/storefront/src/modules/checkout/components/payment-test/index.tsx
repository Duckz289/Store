import { Badge } from "@modules/common/components/ui"

const PaymentTest = ({ className }: { className?: string }) => {
  return (
    <Badge color="orange" className={className}>
      <span className="font-semibold">Lưu ý:</span> Chỉ dùng để kiểm thử.
    </Badge>
  )
}

export default PaymentTest

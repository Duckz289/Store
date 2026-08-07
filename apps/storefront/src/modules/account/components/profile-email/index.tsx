import { HttpTypes } from "@medusajs/types"

type MyInformationProps = {
  customer: HttpTypes.StoreCustomer
}

const ProfileEmail: React.FC<MyInformationProps> = ({ customer }) => {
  return (
    <section className="w-full" data-testid="account-email-editor">
      <p className="type-header-label uppercase text-[var(--hp-muted)]">Email đăng nhập</p>
      <p className="type-body mt-1 font-medium text-[var(--hp-ink)]">{customer.email}</p>
      <p className="type-product-spec mt-2 text-[var(--hp-muted)]">
        Email là định danh đăng nhập và chưa hỗ trợ tự thay đổi để tránh mất quyền truy cập.
      </p>
    </section>
  )
}

export default ProfileEmail

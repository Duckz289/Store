import { Metadata } from "next"
import { notFound } from "next/navigation"

import AddressBook from "@modules/account/components/address-book"

import { retrieveCustomer } from "@lib/data/customer"

export const metadata: Metadata = {
  title: "Addresses",
  description: "View your addresses",
}

export default async function Addresses() {
  const customer = await retrieveCustomer()

  if (!customer) {
    notFound()
  }

  return (
    <div className="w-full" data-testid="addresses-page-wrapper">
      <div className="mb-8 flex flex-col gap-y-4">
        <h1 className="type-section-title">Địa chỉ đã lưu</h1>
        <p className="type-body text-[var(--hp-muted)]">
          Lưu địa chỉ giao hàng tại Việt Nam để sử dụng nhanh hơn khi thanh toán.
        </p>
      </div>
      <AddressBook customer={customer} />
    </div>
  )
}

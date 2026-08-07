import repeat from "@lib/util/repeat"
import { HttpTypes } from "@medusajs/types"
import { Heading, Table } from "@modules/common/components/ui"

import Item from "@modules/cart/components/item"
import SkeletonLineItem from "@modules/skeletons/components/skeleton-line-item"

type ItemsTemplateProps = {
  cart?: HttpTypes.StoreCart
}

const ItemsTemplate = ({ cart }: ItemsTemplateProps) => {
  const items = cart?.items
  return (
    <div>
      <div className="pb-3 flex items-center">
        <Heading level="h1" className="type-section-title">Giỏ hàng</Heading>
      </div>
      <div className="min-w-0 max-w-full w-full overflow-x-auto -mx-2 px-2" role="region" aria-label="Sản phẩm trong giỏ hàng" tabIndex={0}>
      <Table className="table-fixed min-w-[680px]">
        <Table.Header className="border-t-0">
          <Table.Row className="text-ui-fg-subtle txt-medium-plus">
            <Table.HeaderCell className="w-24 !pl-0">Sản phẩm</Table.HeaderCell>
            <Table.HeaderCell></Table.HeaderCell>
            <Table.HeaderCell className="w-36">Số lượng</Table.HeaderCell>
            <Table.HeaderCell className="hidden w-32 small:table-cell">
              Đơn giá
            </Table.HeaderCell>
            <Table.HeaderCell className="w-40 !pr-0 text-right">
              Thành tiền
            </Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {items
            ? items
                .sort((a, b) => {
                  return (a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1
                })
                .map((item) => {
                  return (
                    <Item
                      key={item.id}
                      item={item}
                      currencyCode={cart?.currency_code}
                    />
                  )
                })
            : repeat(5).map((i) => {
                return <SkeletonLineItem key={i} />
              })}
        </Table.Body>
      </Table>
      </div>
    </div>
  )
}

export default ItemsTemplate

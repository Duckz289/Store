import { defineWidgetConfig } from "@medusajs/admin-sdk"
import type { AdminOrder, DetailWidgetProps } from "@medusajs/framework/types"
import { Button, Container, Heading, Text } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"

import { sdk } from "../lib/sdk"
import type { RepairCase } from "../types/repair"

const OrderRepairsWidget = ({ data }: DetailWidgetProps<AdminOrder>) => {
  const { data: response } = useQuery({
    queryKey: ["order-repair-cases", data.id],
    queryFn: () =>
      sdk.client.fetch<{ repair_cases: RepairCase[] }>(
        `/admin/orders/${data.id}/repairs`
      ),
  })
  const cases = response?.repair_cases ?? []

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Repair service</Heading>
        <Button size="small" variant="secondary" asChild>
          <Link to="/repairs">View repairs</Link>
        </Button>
      </div>
      <div className="px-6 py-4">
        {cases.length ? (
          cases.map((repairCase) => (
            <div className="flex justify-between py-1" key={repairCase.id}>
              <Link
                className="text-ui-fg-interactive hover:underline"
                to={`/repairs/${repairCase.id}`}
              >
                {repairCase.code}
              </Link>
              <Text size="small">{repairCase.status.replace(/_/g, " ")}</Text>
            </div>
          ))
        ) : (
          <Text size="small" className="text-ui-fg-subtle">
            No repair case references this order.
          </Text>
        )}
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "order.details.side.after",
})

export default OrderRepairsWidget

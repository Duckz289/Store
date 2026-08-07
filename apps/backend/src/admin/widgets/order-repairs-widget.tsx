import { defineWidgetConfig } from "@medusajs/admin-sdk"
import type { AdminOrder, DetailWidgetProps } from "@medusajs/framework/types"
import { Button, Container, Heading, Text } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"

import { sdk } from "../lib/sdk"
import type { RepairCase } from "../types/repair"

const OrderRepairsWidget = ({ data }: DetailWidgetProps<AdminOrder>) => {
  const { t } = useTranslation()
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
        <Heading level="h2">{t("common.repairService")}</Heading>
        <Button size="small" variant="secondary" asChild>
          <Link to="/repairs">{t("common.viewRepairs")}</Link>
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
              <Text size="small">
                {t(`repairs.statuses.${repairCase.status}`, {
                  defaultValue: repairCase.status.replace(/_/g, " "),
                })}
              </Text>
            </div>
          ))
        ) : (
          <Text size="small" className="text-ui-fg-subtle">
            {t("common.empty")}
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

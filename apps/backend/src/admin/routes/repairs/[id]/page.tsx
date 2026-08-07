import { Badge, Container, Heading, Text } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"

import { sdk } from "../../../lib/sdk"
import type { RepairDetailResponse } from "../../../types/repair"

const RepairDetailPage = () => {
  const { t } = useTranslation()
  const { id } = useParams()
  const { data, isLoading, error } = useQuery({
    queryKey: ["repair-case", id],
    enabled: Boolean(id),
    queryFn: () =>
      sdk.client.fetch<RepairDetailResponse>(`/admin/repairs/${id}`),
  })
  const repairCase = data?.repair_case

  if (isLoading) {
    return <Container><Text>{t("repairs.loading")}</Text></Container>
  }
  if (error || !repairCase) {
    return <Container><Text className="text-ui-fg-error">{t("repairs.loadError")}</Text></Container>
  }

  return (
    <div className="flex flex-col gap-y-3">
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <Heading level="h1">{repairCase.code}</Heading>
            <Text size="small" className="text-ui-fg-subtle">
              {t("repairs.revision", { value: repairCase.revision })}
            </Text>
          </div>
          <Badge>{t(`repairs.statuses.${repairCase.status}`, { defaultValue: repairCase.status.replace(/_/g, " ") })}</Badge>
        </div>
        <div className="grid grid-cols-2 gap-4 px-6 py-4">
          <div>
            <Text weight="plus">{t("repairs.device")}</Text>
            <Text>
              {[repairCase.device?.brand, repairCase.device?.model]
                .filter(Boolean)
                .join(" ") || t("repairs.unknownDevice")}
            </Text>
            <Text size="small" className="text-ui-fg-subtle">
              {t("repairs.serial", { value: repairCase.device?.serial_number ?? "-" })}
            </Text>
          </div>
          <div>
            <Text weight="plus">{t("repairs.slaDue")}</Text>
            <Text>
              {repairCase.sla_due_at
                ? new Date(repairCase.sla_due_at).toLocaleString()
                : t("repairs.notSet")}
            </Text>
          </div>
        </div>
      </Container>

      <Container className="p-0">
        <div className="px-6 py-4">
          <Heading level="h2">{t("repairs.history")}</Heading>
        </div>
        <div className="divide-y">
          {repairCase.status_history?.map((entry) => (
            <div className="flex justify-between px-6 py-3" key={entry.id}>
              <Text>
                {entry.from_status
                  ? t(`repairs.statuses.${entry.from_status}`, {
                      defaultValue: entry.from_status.replace(/_/g, " "),
                    })
                  : t("repairs.created")} → {t(`repairs.statuses.${entry.to_status}`, {
                    defaultValue: entry.to_status.replace(/_/g, " "),
                  })}
              </Text>
              <Text size="small" className="text-ui-fg-subtle">
                {new Date(entry.occurred_at).toLocaleString()}
              </Text>
            </div>
          ))}
        </div>
      </Container>
    </div>
  )
}

export const handle = {
  breadcrumb: () => "Hồ sơ sửa chữa",
}

export default RepairDetailPage

import { Badge, Container, Heading, Text } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"

import { sdk } from "../../../lib/sdk"
import type { RepairContactResponse, RepairDetailResponse } from "../../../types/repair"

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
  const contact = useQuery({
    queryKey: ["repair-contact", id],
    enabled: Boolean(id),
    queryFn: () =>
      sdk.client.fetch<RepairContactResponse>(`/admin/repairs/${id}/contact`),
  })

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
        <div className="grid gap-4 px-6 py-4 md:grid-cols-2">
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

      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Heading level="h2">Khách hàng và thiết bị</Heading>
        </div>
        <div className="grid gap-4 px-6 py-4 md:grid-cols-2">
          <div className="grid gap-1">
            <Text weight="plus">Thông tin liên hệ</Text>
            {contact.isLoading ? <Text className="text-ui-fg-subtle">Đang tải thông tin được cấp quyền...</Text> : null}
            {contact.data?.contact ? <>
              <Text>{contact.data.contact.full_name}</Text>
              <Text>{contact.data.contact.phone}</Text>
              <Text>{contact.data.contact.email || "-"}</Text>
            </> : null}
            {contact.error ? <Text className="text-ui-fg-subtle">Thông tin liên hệ chỉ hiển thị cho vai trò được cấp quyền.</Text> : null}
          </div>
          <div className="grid gap-1">
            <Text weight="plus">Tình trạng khách mô tả</Text>
            <Text>{repairCase.device?.condition_summary || repairCase.public_summary || "-"}</Text>
            <Text size="small" className="text-ui-fg-subtle">SKU: {repairCase.device?.sku || "-"}</Text>
          </div>
        </div>
      </Container>

      <Container className="divide-y p-0">
        <div className="px-6 py-4"><Heading level="h2">Chẩn đoán và báo giá</Heading></div>
        <div className="grid gap-6 px-6 py-4 lg:grid-cols-2">
          <div className="grid gap-3">
            <Text weight="plus">Chẩn đoán</Text>
            {repairCase.diagnoses?.length ? repairCase.diagnoses.map((diagnosis) => <div className="rounded-md border p-3" key={diagnosis.id}>
              <div className="flex items-center justify-between gap-2"><Text weight="plus">Phiên bản {diagnosis.version}</Text><Badge>{diagnosis.severity}</Badge></div>
              <Text className="mt-2">{diagnosis.findings}</Text>
              <Text size="small" className="mt-1 text-ui-fg-subtle">{diagnosis.recommended_action}</Text>
            </div>) : <Text className="text-ui-fg-subtle">Chưa có chẩn đoán được ghi nhận.</Text>}
          </div>
          <div className="grid gap-3">
            <Text weight="plus">Báo giá</Text>
            {repairCase.quotes?.length ? repairCase.quotes.map((quote) => <div className="rounded-md border p-3" key={quote.id}>
              <div className="flex items-center justify-between gap-2"><Text weight="plus">Báo giá v{quote.version}</Text><Badge>{quote.status}</Badge></div>
              <div className="mt-2 grid gap-1">{quote.items?.map((item) => <Text size="small" key={item.id}>{item.quantity} × {item.title}{item.sku ? ` (${item.sku})` : ""}</Text>)}</div>
              <Text size="small" className="mt-2 text-ui-fg-subtle">Tổng: {quote.total.toLocaleString("vi-VN")} {quote.currency_code.toUpperCase()}</Text>
            </div>) : <Text className="text-ui-fg-subtle">Chưa có báo giá.</Text>}
          </div>
        </div>
      </Container>

      <Container className="divide-y p-0">
        <div className="px-6 py-4"><Heading level="h2">Phân công và linh kiện</Heading></div>
        <div className="grid gap-6 px-6 py-4 md:grid-cols-2">
          <div className="grid gap-2"><Text weight="plus">Kỹ thuật viên</Text>{repairCase.assignments?.length ? repairCase.assignments.map((assignment) => <Text key={assignment.id}>{assignment.technician_name}</Text>) : <Text className="text-ui-fg-subtle">Chưa phân công.</Text>}</div>
          <div className="grid gap-2"><Text weight="plus">Linh kiện</Text>{repairCase.parts?.length ? repairCase.parts.map((part) => <Text key={part.id}>{part.quantity} × {part.title} <span className="text-ui-fg-subtle">({part.status})</span></Text>) : <Text className="text-ui-fg-subtle">Chưa có linh kiện được ghi nhận.</Text>}</div>
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

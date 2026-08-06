import { Badge, Container, Heading, Text } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { useParams } from "react-router-dom"

import { sdk } from "../../../lib/sdk"
import type { RepairDetailResponse } from "../../../types/repair"

const RepairDetailPage = () => {
  const { id } = useParams()
  const { data, isLoading, error } = useQuery({
    queryKey: ["repair-case", id],
    enabled: Boolean(id),
    queryFn: () =>
      sdk.client.fetch<RepairDetailResponse>(`/admin/repairs/${id}`),
  })
  const repairCase = data?.repair_case

  if (isLoading) {
    return <Container><Text>Loading repair case...</Text></Container>
  }
  if (error || !repairCase) {
    return <Container><Text className="text-ui-fg-error">Unable to load repair case.</Text></Container>
  }

  return (
    <div className="flex flex-col gap-y-3">
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <Heading level="h1">{repairCase.code}</Heading>
            <Text size="small" className="text-ui-fg-subtle">
              Revision {repairCase.revision}
            </Text>
          </div>
          <Badge>{repairCase.status.replace(/_/g, " ")}</Badge>
        </div>
        <div className="grid grid-cols-2 gap-4 px-6 py-4">
          <div>
            <Text weight="plus">Device</Text>
            <Text>
              {[repairCase.device?.brand, repairCase.device?.model]
                .filter(Boolean)
                .join(" ") || "Unknown device"}
            </Text>
            <Text size="small" className="text-ui-fg-subtle">
              Serial: {repairCase.device?.serial_number ?? "-"}
            </Text>
          </div>
          <div>
            <Text weight="plus">SLA due</Text>
            <Text>
              {repairCase.sla_due_at
                ? new Date(repairCase.sla_due_at).toLocaleString()
                : "Not set"}
            </Text>
          </div>
        </div>
      </Container>

      <Container className="p-0">
        <div className="px-6 py-4">
          <Heading level="h2">Status history</Heading>
        </div>
        <div className="divide-y">
          {repairCase.status_history?.map((entry) => (
            <div className="flex justify-between px-6 py-3" key={entry.id}>
              <Text>
                {entry.from_status ?? "created"} → {entry.to_status}
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
  breadcrumb: () => "Repair case",
}

export default RepairDetailPage

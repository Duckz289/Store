import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Badge, Container, Heading, Table, Text } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"

import { sdk } from "../../lib/sdk"
import type { RepairListResponse } from "../../types/repair"

const RepairsPage = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["repair-cases"],
    queryFn: () =>
      sdk.client.fetch<RepairListResponse>("/admin/repairs?limit=100"),
  })

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h1">Repair cases</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Independent service lifecycle; repair cases are not commerce orders.
          </Text>
        </div>
      </div>
      <div className="px-6 py-4">
        {isLoading ? <Text>Loading repair cases...</Text> : null}
        {error ? <Text className="text-ui-fg-error">Unable to load cases.</Text> : null}
        {!isLoading && !error ? (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Code</Table.HeaderCell>
                <Table.HeaderCell>Device</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <Table.HeaderCell>SLA due</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {data?.repair_cases.map((repairCase) => (
                <Table.Row key={repairCase.id}>
                  <Table.Cell>
                    <Link
                      className="text-ui-fg-interactive hover:underline"
                      to={`/repairs/${repairCase.id}`}
                    >
                      {repairCase.code}
                    </Link>
                  </Table.Cell>
                  <Table.Cell>
                    {[repairCase.device?.brand, repairCase.device?.model]
                      .filter(Boolean)
                      .join(" ") || "Unknown device"}
                  </Table.Cell>
                  <Table.Cell>
                    <Badge>{repairCase.status.replace(/_/g, " ")}</Badge>
                  </Table.Cell>
                  <Table.Cell>
                    {repairCase.sla_due_at
                      ? new Date(repairCase.sla_due_at).toLocaleString()
                      : "-"}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        ) : null}
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Repairs",
  rank: 45,
})

export default RepairsPage

import { defineWidgetConfig } from "@medusajs/admin-sdk"
import type { AdminOrder, DetailWidgetProps } from "@medusajs/framework/types"
import { Badge, Button, Container, Heading, Text } from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { FormEvent, useState } from "react"

import { sdk } from "../lib/sdk"
import type { VietQrAdminResponse } from "../types/vietqr"

const OrderVietQrWidget = ({ data }: DetailWidgetProps<AdminOrder>) => {
  const queryClient = useQueryClient()
  const [transactionReference, setTransactionReference] = useState("")
  const [observedAmount, setObservedAmount] = useState("")
  const [observedReference, setObservedReference] = useState("")
  const [observedAt, setObservedAt] = useState(() =>
    new Date().toISOString().slice(0, 16)
  )
  const { data: response, isLoading } = useQuery({
    queryKey: ["order-vietqr", data.id],
    queryFn: () =>
      sdk.client.fetch<VietQrAdminResponse>(`/admin/orders/${data.id}/vietqr`),
  })
  const vietqr = response?.vietqr
  const confirm = useMutation({
    mutationFn: () =>
      sdk.client.fetch(`/admin/orders/${data.id}/vietqr/confirm`, {
        method: "POST",
        body: {
          idempotency_key: `vietqr-admin-${crypto.randomUUID()}`,
          observed_amount: observedAmount || vietqr?.expected_amount,
          currency_code: "vnd",
          observed_reference:
            observedReference || vietqr?.transfer_content || "",
          bank_transaction_reference: transactionReference,
          observed_at: new Date(observedAt).toISOString(),
        },
      }),
    onSuccess: async () => {
      setTransactionReference("")
      await queryClient.invalidateQueries({
        queryKey: ["order-vietqr", data.id],
      })
    },
  })

  if (isLoading || !vietqr) {
    return null
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    confirm.mutate()
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">VietQR manual review</Heading>
        <Badge>{vietqr.payment_session_status.replaceAll("_", " ")}</Badge>
      </div>
      <div className="grid gap-4 px-6 py-4">
        <div className="flex gap-4">
          <img
            src={vietqr.qr_image_url}
            alt="VietQR payment"
            className="h-40 w-40"
          />
          <div>
            <Text size="small">Reference: {vietqr.reference}</Text>
            <Text size="small">Amount: {vietqr.expected_amount} VND</Text>
            <Text size="small">
              Receiver: {vietqr.account_name} · {vietqr.account_number}
            </Text>
            <Text size="small">
              Expires: {new Date(vietqr.expires_at).toLocaleString()}
            </Text>
            <Text size="small" className="text-ui-fg-subtle">
              Check the bank statement. A receipt image or this page is not
              payment evidence.
            </Text>
          </div>
        </div>
        {!vietqr.captured_at ? (
          <form className="grid gap-3" onSubmit={submit}>
            <label className="grid gap-1 text-sm">
              Observed amount (VND)
              <input
                className="rounded-md border border-ui-border-base px-3 py-2"
                inputMode="numeric"
                pattern="[1-9][0-9]{0,12}"
                value={observedAmount || vietqr.expected_amount}
                onChange={(event) => setObservedAmount(event.target.value)}
                required
              />
            </label>
            <label className="grid gap-1 text-sm">
              Observed transfer content
              <input
                className="rounded-md border border-ui-border-base px-3 py-2"
                value={observedReference || vietqr.transfer_content}
                onChange={(event) => setObservedReference(event.target.value)}
                required
              />
            </label>
            <label className="grid gap-1 text-sm">
              Bank transaction reference
              <input
                className="rounded-md border border-ui-border-base px-3 py-2"
                value={transactionReference}
                onChange={(event) => setTransactionReference(event.target.value)}
                minLength={4}
                required
              />
            </label>
            <label className="grid gap-1 text-sm">
              Bank transaction time
              <input
                className="rounded-md border border-ui-border-base px-3 py-2"
                type="datetime-local"
                value={observedAt}
                onChange={(event) => setObservedAt(event.target.value)}
                required
              />
            </label>
            <Button
              type="submit"
              isLoading={confirm.isPending}
              disabled={!transactionReference}
            >
              Record observation and confirm only if exact
            </Button>
            {confirm.error ? (
              <Text size="small" className="text-ui-fg-error">
                {confirm.error.message}
              </Text>
            ) : null}
          </form>
        ) : (
          <Text size="small">Captured at {new Date(vietqr.captured_at).toLocaleString()}</Text>
        )}
        {vietqr.observations.length ? (
          <div>
            <Text size="small" weight="plus">
              Latest observation
            </Text>
            <Text size="small">
              {vietqr.observations[0].outcome} · {vietqr.observations[0].observed_amount} VND ·{" "}
              {vietqr.observations[0].bank_transaction_reference}
            </Text>
          </div>
        ) : null}
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "order.details.side.after",
})

export default OrderVietQrWidget

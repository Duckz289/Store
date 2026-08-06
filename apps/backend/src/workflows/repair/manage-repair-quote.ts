import { MedusaError, Modules } from "@medusajs/framework/utils"
import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"

import { REPAIR_MODULE } from "../../modules/repair"
import RepairModuleService from "../../modules/repair/service"
import { SECURITY_MODULE } from "../../modules/security"
import SecurityModuleService from "../../modules/security/service"
import {
  calculateQuote,
  generateCapabilityToken,
  QuoteLineInput,
  stableHash,
} from "../../utils/repair-domain"
import { prepareAuditEvent } from "../../utils/security-audit"

type ActorInput = {
  actor_id: string
  actor_type: "user"
}

export type SaveRepairQuoteInput = ActorInput & {
  repair_case_id: string
  quote_id?: string
  idempotency_key: string
  currency_code: string
  diagnosis_version: number
  valid_until?: string | Date | null
  items: QuoteLineInput[]
}

const saveRepairQuoteStep = createStep(
  "save-repair-quote",
  async (input: SaveRepairQuoteInput, { container }) => {
    const repairService = container.resolve<RepairModuleService>(REPAIR_MODULE)
    const securityService = container.resolve<SecurityModuleService>(
      SECURITY_MODULE
    )
    const locking = container.resolve(Modules.LOCKING)
    const requestHash = stableHash(input)

    const response = await locking.execute(
      `repair-case:${input.repair_case_id}`,
      async () => {
      const receipts = await repairService.listRepairCommandReceipts({
        command_key: input.idempotency_key,
      })
      if (receipts.length) {
        if (receipts[0].request_hash !== requestHash) {
          throw new MedusaError(
            MedusaError.Types.CONFLICT,
            "REPAIR_IDEMPOTENCY_KEY_REUSED"
          )
        }
        return new StepResponse({
          quote: await repairService.retrieveRepairQuote(receipts[0].result_id, {
            relations: ["items"],
          }),
          replayed: true,
        })
      }

      const repairCase = await repairService.retrieveRepairCase(
        input.repair_case_id
      )
      if (repairCase.status !== "quote") {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          "REPAIR_QUOTE_REQUIRES_QUOTE_STATUS"
        )
      }
      const diagnoses = await repairService.listRepairDiagnoses({
        case_id: repairCase.id,
        version: input.diagnosis_version,
      })
      if (!diagnoses.length) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "REPAIR_DIAGNOSIS_VERSION_NOT_FOUND"
        )
      }

      const calculated = calculateQuote(input.items)
      const existingQuote = input.quote_id
        ? await repairService.retrieveRepairQuote(input.quote_id, {
            relations: ["items"],
          })
        : null
      if (existingQuote && existingQuote.case_id !== repairCase.id) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "REPAIR_QUOTE_CASE_MISMATCH"
        )
      }
      if (existingQuote && existingQuote.status !== "draft") {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          "REPAIR_QUOTE_IMMUTABLE"
        )
      }

      let quote = existingQuote
      const previousItems = existingQuote?.items ?? []
      try {
        if (quote) {
          if (previousItems.length) {
            await repairService.deleteRepairQuoteItems(
              previousItems.map((item) => item.id)
            )
          }
          quote = await repairService.updateRepairQuotes({
            id: quote.id,
            currency_code: input.currency_code.toLowerCase(),
            diagnosis_version: input.diagnosis_version,
            subtotal: calculated.subtotal,
            total: calculated.total,
            valid_until: input.valid_until
              ? new Date(input.valid_until)
              : null,
          })
        } else {
          const quotes = await repairService.listRepairQuotes(
            { case_id: repairCase.id },
            { order: { version: "DESC" }, take: 1 }
          )
          quote = await repairService.createRepairQuotes({
            case_id: repairCase.id,
            version: (quotes[0]?.version ?? 0) + 1,
            status: "draft",
            currency_code: input.currency_code.toLowerCase(),
            diagnosis_version: input.diagnosis_version,
            subtotal: calculated.subtotal,
            total: calculated.total,
            valid_until: input.valid_until
              ? new Date(input.valid_until)
              : null,
            created_by: input.actor_id,
          })
        }
        await repairService.createRepairQuoteItems(
          calculated.items.map((item) => ({
            quote_id: quote!.id,
            kind: item.kind,
            title: item.title,
            sku: item.sku ?? null,
            quantity: item.quantity,
            unit_price: item.unit_price,
            line_total: item.line_total,
            internal_cost: item.internal_cost ?? null,
            position: item.position,
          }))
        )
        await repairService.createRepairCommandReceipts({
          command_key: input.idempotency_key,
          command_type: "repair.quote.save",
          request_hash: requestHash,
          result_type: "repair_quote",
          result_id: quote.id,
          actor_id: input.actor_id,
          completed_at: new Date(),
        })
        await securityService.createAuditEvents(
          prepareAuditEvent({
            correlation_id: `repair:${repairCase.id}`,
            actor_id: input.actor_id,
            actor_type: input.actor_type,
            action: existingQuote
              ? "repair.quote.draft_updated"
              : "repair.quote.draft_created",
            resource_type: "repair_quote",
            resource_id: quote.id,
            outcome: "success",
            metadata: {
              repair_case_id: repairCase.id,
              version: quote.version,
              currency_code: quote.currency_code,
              total: quote.total,
              item_count: calculated.items.length,
            },
          })
        )

        return new StepResponse({
          quote: await repairService.retrieveRepairQuote(quote.id, {
            relations: ["items"],
          }),
          replayed: false,
        })
      } catch (error) {
        if (quote && !existingQuote) {
          const items = await repairService.listRepairQuoteItems({
            quote_id: quote.id,
          })
          await repairService
            .deleteRepairQuoteItems(items.map((item) => item.id))
            .catch(() => undefined)
          await repairService.deleteRepairQuotes(quote.id).catch(() => undefined)
        } else if (existingQuote) {
          const currentItems = await repairService.listRepairQuoteItems({
            quote_id: existingQuote.id,
          })
          await repairService
            .deleteRepairQuoteItems(currentItems.map((item) => item.id))
            .catch(() => undefined)
          await repairService
            .updateRepairQuotes({
              id: existingQuote.id,
              currency_code: existingQuote.currency_code,
              diagnosis_version: existingQuote.diagnosis_version,
              subtotal: existingQuote.subtotal,
              total: existingQuote.total,
              valid_until: existingQuote.valid_until,
            })
            .catch(() => undefined)
          if (previousItems.length) {
            await repairService
              .createRepairQuoteItems(
                previousItems.map((item) => ({
                  quote_id: existingQuote.id,
                  kind: item.kind,
                  title: item.title,
                  sku: item.sku,
                  quantity: item.quantity,
                  unit_price: item.unit_price,
                  line_total: item.line_total,
                  internal_cost: item.internal_cost,
                  position: item.position,
                }))
              )
              .catch(() => undefined)
          }
        }
        throw error
      }
      }
    )
    return new StepResponse(response.output)
  }
)

export const saveRepairQuoteWorkflow = createWorkflow(
  "save-repair-quote",
  (input: SaveRepairQuoteInput) =>
    new WorkflowResponse(saveRepairQuoteStep(input))
)

export type SubmitRepairQuoteInput = ActorInput & {
  repair_case_id: string
  quote_id: string
  idempotency_key: string
  expires_in_hours?: number
}

type SubmitRepairQuoteOutput = {
  quote: Awaited<ReturnType<RepairModuleService["retrieveRepairQuote"]>>
  decision_token: string | null
  token_id: string | null
  replayed: boolean
}

const submitRepairQuoteStep = createStep<
  SubmitRepairQuoteInput,
  SubmitRepairQuoteOutput,
  undefined
>(
  "submit-repair-quote",
  async (input: SubmitRepairQuoteInput, { container }) => {
    const repairService = container.resolve<RepairModuleService>(REPAIR_MODULE)
    const securityService = container.resolve<SecurityModuleService>(
      SECURITY_MODULE
    )
    const locking = container.resolve(Modules.LOCKING)
    const requestHash = stableHash(input)

    const response = await locking.execute(
      `repair-case:${input.repair_case_id}`,
      async () => {
      const receipts = await repairService.listRepairCommandReceipts({
        command_key: input.idempotency_key,
      })
      if (receipts.length) {
        if (receipts[0].request_hash !== requestHash) {
          throw new MedusaError(
            MedusaError.Types.CONFLICT,
            "REPAIR_IDEMPOTENCY_KEY_REUSED"
          )
        }
        return new StepResponse({
          quote: await repairService.retrieveRepairQuote(input.quote_id, {
            relations: ["items"],
          }),
          decision_token: null,
          token_id: null,
          replayed: true,
        })
      }

      const repairCase = await repairService.retrieveRepairCase(
        input.repair_case_id
      )
      const quote = await repairService.retrieveRepairQuote(input.quote_id, {
        relations: ["items"],
      })
      if (
        repairCase.status !== "quote" ||
        quote.case_id !== repairCase.id ||
        quote.status !== "draft"
      ) {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          "REPAIR_QUOTE_CANNOT_BE_SUBMITTED"
        )
      }
      if (!quote.items?.length) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "REPAIR_QUOTE_ITEMS_REQUIRED"
        )
      }

      const now = new Date()
      const expiresIn = Math.min(
        Math.max(input.expires_in_hours ?? 72, 1),
        24 * 30
      )
      const validUntil = new Date(now.getTime() + expiresIn * 60 * 60 * 1000)
      const contentHash = stableHash({
        currency_code: quote.currency_code,
        diagnosis_version: quote.diagnosis_version,
        total: quote.total,
        items: quote.items.map((item) => ({
          kind: item.kind,
          title: item.title,
          sku: item.sku,
          quantity: item.quantity,
          unit_price: item.unit_price,
          line_total: item.line_total,
          position: item.position,
        })),
      })
      const capability = generateCapabilityToken()

      let tokenId: string | null = null
      let historyId: string | null = null
      try {
        const submitted = await repairService.updateRepairQuotes({
          id: quote.id,
          status: "submitted",
          content_hash: contentHash,
          valid_until: validUntil,
          submitted_at: now,
        })
        const token = await repairService.createRepairAccessTokens({
          case_id: repairCase.id,
          quote_id: quote.id,
          token_hash: capability.token_hash,
          purpose: "quote_decision",
          expires_at: validUntil,
        })
        tokenId = token.id
        const updatedCase = await repairService.updateRepairCases({
          id: repairCase.id,
          status: "awaiting_customer_decision",
          revision: repairCase.revision + 1,
        })
        const history = await repairService.createRepairStatusHistories({
          case_id: repairCase.id,
          from_status: "quote",
          to_status: "awaiting_customer_decision",
          actor_type: "user",
          actor_id: input.actor_id,
          idempotency_key: input.idempotency_key,
          sequence: updatedCase.revision,
          occurred_at: now,
        })
        historyId = history.id
        await repairService.createRepairCommandReceipts({
          command_key: input.idempotency_key,
          command_type: "repair.quote.submit",
          request_hash: requestHash,
          result_type: "repair_quote",
          result_id: quote.id,
          actor_id: input.actor_id,
          completed_at: now,
        })
        await securityService.createAuditEvents(
          prepareAuditEvent({
            correlation_id: `repair:${repairCase.id}`,
            actor_id: input.actor_id,
            actor_type: "user",
            action: "repair.quote.submitted",
            resource_type: "repair_quote",
            resource_id: quote.id,
            outcome: "success",
            metadata: {
              repair_case_id: repairCase.id,
              version: quote.version,
              total: quote.total,
              currency_code: quote.currency_code,
              valid_until: validUntil.toISOString(),
            },
          })
        )

        return new StepResponse({
          quote: submitted,
          decision_token: capability.token,
          token_id: token.id,
          replayed: false,
        })
      } catch (error) {
        const receipts = await repairService.listRepairCommandReceipts({
          command_key: input.idempotency_key,
        })
        if (receipts.length) {
          await repairService
            .deleteRepairCommandReceipts(receipts.map((item) => item.id))
            .catch(() => undefined)
        }
        if (historyId) {
          await repairService
            .deleteRepairStatusHistories(historyId)
            .catch(() => undefined)
        }
        await repairService
          .updateRepairCases({
            id: repairCase.id,
            status: repairCase.status,
            revision: repairCase.revision,
          })
          .catch(() => undefined)
        if (tokenId) {
          await repairService
            .deleteRepairAccessTokens(tokenId)
            .catch(() => undefined)
        }
        await repairService
          .updateRepairQuotes({
            id: quote.id,
            status: quote.status,
            content_hash: quote.content_hash,
            valid_until: quote.valid_until,
            submitted_at: quote.submitted_at,
          })
          .catch(() => undefined)
        throw error
      }
      }
    )
    return new StepResponse(response.output)
  }
)

export const submitRepairQuoteWorkflow = createWorkflow(
  "submit-repair-quote",
  (input: SubmitRepairQuoteInput) =>
    new WorkflowResponse(submitRepairQuoteStep(input))
)

export type DecideRepairQuoteInput = {
  repair_code: string
  decision_token: string
  decision: "approved" | "rejected"
  idempotency_key: string
  evidence?: string | null
}

const decideRepairQuoteStep = createStep(
  "decide-repair-quote",
  async (input: DecideRepairQuoteInput, { container }) => {
    const repairService = container.resolve<RepairModuleService>(REPAIR_MODULE)
    const securityService = container.resolve<SecurityModuleService>(
      SECURITY_MODULE
    )
    const locking = container.resolve(Modules.LOCKING)
    const requestHash = stableHash({ ...input, decision_token: "<redacted>" })
    const cases = await repairService.listRepairCases({ code: input.repair_code })
    if (!cases.length) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "REPAIR_CASE_NOT_FOUND")
    }
    const repairCaseId = cases[0].id

    const response = await locking.execute(
      `repair-case:${repairCaseId}`,
      async () => {
      const receipts = await repairService.listRepairCommandReceipts({
        command_key: input.idempotency_key,
      })
      if (receipts.length) {
        if (receipts[0].request_hash !== requestHash) {
          throw new MedusaError(
            MedusaError.Types.CONFLICT,
            "REPAIR_IDEMPOTENCY_KEY_REUSED"
          )
        }
        return new StepResponse({
          repair_case: await repairService.retrieveRepairCase(repairCaseId),
          replayed: true,
        })
      }

      const repairCase = await repairService.retrieveRepairCase(repairCaseId)
      const tokens = await repairService.listRepairAccessTokens({
        case_id: repairCase.id,
        token_hash: stableHash(input.decision_token),
        purpose: "quote_decision",
      })
      const token = tokens[0]
      const now = new Date()
      if (
        !token ||
        token.consumed_at ||
        token.revoked_at ||
        new Date(token.expires_at) <= now
      ) {
        throw new MedusaError(
          MedusaError.Types.UNAUTHORIZED,
          "REPAIR_QUOTE_TOKEN_INVALID"
        )
      }
      const quote = await repairService.retrieveRepairQuote(token.quote_id, {
        relations: ["items"],
      })
      if (
        repairCase.status !== "awaiting_customer_decision" ||
        quote.status !== "submitted" ||
        quote.case_id !== repairCase.id
      ) {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          "REPAIR_QUOTE_DECISION_NOT_ALLOWED"
        )
      }
      const currentHash = stableHash({
        currency_code: quote.currency_code,
        diagnosis_version: quote.diagnosis_version,
        total: quote.total,
        items: quote.items.map((item) => ({
          kind: item.kind,
          title: item.title,
          sku: item.sku,
          quantity: item.quantity,
          unit_price: item.unit_price,
          line_total: item.line_total,
          position: item.position,
        })),
      })
      if (currentHash !== quote.content_hash) {
        throw new MedusaError(
          MedusaError.Types.CONFLICT,
          "REPAIR_QUOTE_INTEGRITY_FAILED"
        )
      }

      const nextStatus = input.decision === "approved" ? "repair" : "return_ready"
      let decisionId: string | null = null
      let historyId: string | null = null
      try {
        const decision = await repairService.createRepairQuoteDecisions({
          quote_id: quote.id,
          decision: input.decision,
          actor_type: "customer",
          actor_id: null,
          evidence: input.evidence?.trim() || null,
          decided_at: now,
          idempotency_key: input.idempotency_key,
        })
        decisionId = decision.id
        await repairService.updateRepairAccessTokens({
          id: token.id,
          consumed_at: now,
        })
        await repairService.updateRepairQuotes({
          id: quote.id,
          status: input.decision,
          decided_at: now,
        })
        const updatedCase = await repairService.updateRepairCases({
          id: repairCase.id,
          status: nextStatus,
          revision: repairCase.revision + 1,
          ready_at: nextStatus === "return_ready" ? now : repairCase.ready_at,
        })
        const history = await repairService.createRepairStatusHistories({
          case_id: repairCase.id,
          from_status: "awaiting_customer_decision",
          to_status: nextStatus,
          actor_type: "customer",
          actor_id: null,
          reason_code:
            input.decision === "approved"
              ? "customer_approved_quote"
              : "customer_rejected_quote",
          idempotency_key: input.idempotency_key,
          sequence: updatedCase.revision,
          occurred_at: now,
        })
        historyId = history.id
        await repairService.createRepairCommandReceipts({
          command_key: input.idempotency_key,
          command_type: `repair.quote.${input.decision}`,
          request_hash: requestHash,
          result_type: "repair_case",
          result_id: repairCase.id,
          completed_at: now,
        })
        await securityService.createAuditEvents(
          prepareAuditEvent({
            correlation_id: `repair:${repairCase.id}`,
            actor_type: "customer",
            action: `repair.quote.${input.decision}`,
            resource_type: "repair_quote",
            resource_id: quote.id,
            outcome: "success",
            metadata: {
              repair_case_id: repairCase.id,
              version: quote.version,
              total: quote.total,
              currency_code: quote.currency_code,
            },
          })
        )

        return new StepResponse({ repair_case: updatedCase, replayed: false })
      } catch (error) {
        const receipts = await repairService.listRepairCommandReceipts({
          command_key: input.idempotency_key,
        })
        if (receipts.length) {
          await repairService
            .deleteRepairCommandReceipts(receipts.map((item) => item.id))
            .catch(() => undefined)
        }
        if (historyId) {
          await repairService
            .deleteRepairStatusHistories(historyId)
            .catch(() => undefined)
        }
        await repairService
          .updateRepairCases({
            id: repairCase.id,
            status: repairCase.status,
            revision: repairCase.revision,
            ready_at: repairCase.ready_at,
          })
          .catch(() => undefined)
        await repairService
          .updateRepairQuotes({
            id: quote.id,
            status: quote.status,
            decided_at: quote.decided_at,
          })
          .catch(() => undefined)
        await repairService
          .updateRepairAccessTokens({ id: token.id, consumed_at: null })
          .catch(() => undefined)
        if (decisionId) {
          await repairService
            .deleteRepairQuoteDecisions(decisionId)
            .catch(() => undefined)
        }
        throw error
      }
      }
    )
    return new StepResponse(response.output)
  }
)

export const decideRepairQuoteWorkflow = createWorkflow(
  "decide-repair-quote",
  (input: DecideRepairQuoteInput) =>
    new WorkflowResponse(decideRepairQuoteStep(input))
)

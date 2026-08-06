import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260806141918 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "vietqr_transfer_observation" drop constraint if exists "vietqr_transfer_observation_bank_transaction_hash_unique";`);
    this.addSql(`alter table if exists "vietqr_reconciliation_issue" drop constraint if exists "vietqr_reconciliation_issue_fingerprint_unique";`);
    this.addSql(`alter table if exists "vietqr_manual_refund" drop constraint if exists "vietqr_manual_refund_bank_transaction_hash_unique";`);
    this.addSql(`alter table if exists "vietqr_command_receipt" drop constraint if exists "vietqr_command_receipt_operation_idempotency_key_unique";`);
    this.addSql(`create table if not exists "vietqr_command_receipt" ("id" text not null, "operation" text check ("operation" in ('confirm', 'cancel', 'refund', 'reconcile')) not null, "idempotency_key" text not null, "request_hash" text not null, "result_type" text not null, "result_id" text not null, "actor_id" text null, "completed_at" timestamptz not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "vietqr_command_receipt_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_vietqr_command_receipt_deleted_at" ON "vietqr_command_receipt" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_vietqr_command_receipt_operation_idempotency_key_unique" ON "vietqr_command_receipt" ("operation", "idempotency_key") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "vietqr_manual_refund" ("id" text not null, "payment_id" text not null, "order_id" text null, "amount" numeric not null, "currency_code" text not null, "bank_transaction_reference" text not null, "bank_transaction_hash" text not null, "note" text null, "actor_id" text not null, "medusa_refund_id" text null, "refunded_at" timestamptz not null, "raw_amount" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "vietqr_manual_refund_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_vietqr_manual_refund_deleted_at" ON "vietqr_manual_refund" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_vietqr_manual_refund_bank_transaction_hash_unique" ON "vietqr_manual_refund" ("bank_transaction_hash") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_vietqr_manual_refund_payment_id_refunded_at" ON "vietqr_manual_refund" ("payment_id", "refunded_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "vietqr_reconciliation_issue" ("id" text not null, "payment_session_id" text not null, "order_id" text null, "fingerprint" text not null, "issue_type" text check ("issue_type" in ('expired_pending', 'exact_without_capture', 'amount_currency_mismatch', 'duplicate_bank_transaction', 'capture_without_observation', 'refund_without_receipt', 'intent_integrity')) not null, "status" text check ("status" in ('open', 'resolved')) not null, "details" jsonb null, "detected_at" timestamptz not null, "resolved_at" timestamptz null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "vietqr_reconciliation_issue_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_vietqr_reconciliation_issue_deleted_at" ON "vietqr_reconciliation_issue" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_vietqr_reconciliation_issue_fingerprint_unique" ON "vietqr_reconciliation_issue" ("fingerprint") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_vietqr_reconciliation_issue_payment_session_id_status" ON "vietqr_reconciliation_issue" ("payment_session_id", "status") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "vietqr_transfer_observation" ("id" text not null, "payment_session_id" text not null, "order_id" text not null, "provider_reference" text not null, "expected_amount" numeric not null, "observed_amount" numeric not null, "currency_code" text not null, "observed_reference" text not null, "outcome" text check ("outcome" in ('exact', 'underpaid', 'overpaid', 'wrong_reference', 'expired')) not null, "bank_transaction_reference" text not null, "bank_transaction_hash" text not null, "note" text null, "actor_id" text not null, "observed_at" timestamptz not null, "raw_expected_amount" jsonb not null, "raw_observed_amount" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "vietqr_transfer_observation_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_vietqr_transfer_observation_deleted_at" ON "vietqr_transfer_observation" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_vietqr_transfer_observation_bank_transaction_hash_unique" ON "vietqr_transfer_observation" ("bank_transaction_hash") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_vietqr_transfer_observation_payment_session_id_observed_at" ON "vietqr_transfer_observation" ("payment_session_id", "observed_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "vietqr_command_receipt" cascade;`);

    this.addSql(`drop table if exists "vietqr_manual_refund" cascade;`);

    this.addSql(`drop table if exists "vietqr_reconciliation_issue" cascade;`);

    this.addSql(`drop table if exists "vietqr_transfer_observation" cascade;`);
  }

}

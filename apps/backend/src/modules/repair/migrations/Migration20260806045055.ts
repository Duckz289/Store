import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260806045055 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "repair_technician_assignment" drop constraint if exists "repair_technician_assignment_idempotency_key_unique";`);
    this.addSql(`alter table if exists "repair_status_history" drop constraint if exists "repair_status_history_case_id_sequence_unique";`);
    this.addSql(`alter table if exists "repair_status_history" drop constraint if exists "repair_status_history_idempotency_key_unique";`);
    this.addSql(`alter table if exists "repair_reconciliation_issue" drop constraint if exists "repair_reconciliation_issue_fingerprint_unique";`);
    this.addSql(`alter table if exists "repair_quote_decision" drop constraint if exists "repair_quote_decision_idempotency_key_unique";`);
    this.addSql(`alter table if exists "repair_quote_decision" drop constraint if exists "repair_quote_decision_quote_id_unique";`);
    this.addSql(`alter table if exists "repair_access_token" drop constraint if exists "repair_access_token_token_hash_unique";`);
    this.addSql(`alter table if exists "repair_quote" drop constraint if exists "repair_quote_case_id_version_unique";`);
    this.addSql(`alter table if exists "repair_part_usage" drop constraint if exists "repair_part_usage_reversal_key_unique";`);
    this.addSql(`alter table if exists "repair_part_usage" drop constraint if exists "repair_part_usage_idempotency_key_unique";`);
    this.addSql(`alter table if exists "repair_diagnosis" drop constraint if exists "repair_diagnosis_case_id_version_unique";`);
    this.addSql(`alter table if exists "repair_device_snapshot" drop constraint if exists "repair_device_snapshot_case_id_unique";`);
    this.addSql(`alter table if exists "repair_contact_snapshot" drop constraint if exists "repair_contact_snapshot_case_id_unique";`);
    this.addSql(`alter table if exists "repair_command_receipt" drop constraint if exists "repair_command_receipt_command_key_unique";`);
    this.addSql(`alter table if exists "repair_attachment" drop constraint if exists "repair_attachment_file_reference_unique";`);
    this.addSql(`alter table if exists "repair_case" drop constraint if exists "repair_case_code_unique";`);
    this.addSql(`create table if not exists "repair_case" ("id" text not null, "code" text not null, "status" text check ("status" in ('intake', 'diagnosis', 'quote', 'awaiting_customer_decision', 'repair', 'quality_assurance', 'return_ready', 'returned', 'closed', 'canceled')) not null, "revision" integer not null default 1, "public_summary" text null, "internal_note" text null, "intake_source" text check ("intake_source" in ('store', 'admin')) not null, "sla_due_at" timestamptz null, "promised_due_at" timestamptz null, "received_at" timestamptz null, "repair_completed_at" timestamptz null, "ready_at" timestamptz null, "returned_at" timestamptz null, "closed_at" timestamptz null, "canceled_at" timestamptz null, "last_reconciled_at" timestamptz null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "repair_case_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_repair_case_deleted_at" ON "repair_case" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_repair_case_code_unique" ON "repair_case" ("code") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_repair_case_status_sla_due_at" ON "repair_case" ("status", "sla_due_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_repair_case_created_at" ON "repair_case" ("created_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "repair_attachment" ("id" text not null, "file_reference" text not null, "storage_provider" text not null, "classification" text check ("classification" in ('intake_photo', 'diagnosis_photo', 'qa_photo', 'handover_document')) not null, "mime_type" text not null, "size_bytes" integer not null, "checksum" text not null, "uploaded_by" text null, "anonymized_at" timestamptz null, "case_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "repair_attachment_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_repair_attachment_case_id" ON "repair_attachment" ("case_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_repair_attachment_deleted_at" ON "repair_attachment" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_repair_attachment_file_reference_unique" ON "repair_attachment" ("file_reference") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_repair_attachment_case_id_classification" ON "repair_attachment" ("case_id", "classification") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "repair_command_receipt" ("id" text not null, "command_key" text not null, "command_type" text not null, "request_hash" text not null, "result_type" text not null, "result_id" text not null, "actor_id" text null, "completed_at" timestamptz not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "repair_command_receipt_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_repair_command_receipt_deleted_at" ON "repair_command_receipt" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_repair_command_receipt_command_key_unique" ON "repair_command_receipt" ("command_key") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "repair_contact_snapshot" ("id" text not null, "full_name" text not null, "phone_normalized" text not null, "phone_lookup_hash" text not null, "email" text null, "consented_at" timestamptz not null, "anonymized_at" timestamptz null, "case_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "repair_contact_snapshot_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_repair_contact_snapshot_case_id_unique" ON "repair_contact_snapshot" ("case_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_repair_contact_snapshot_deleted_at" ON "repair_contact_snapshot" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_repair_contact_snapshot_phone_lookup_hash" ON "repair_contact_snapshot" ("phone_lookup_hash") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "repair_device_snapshot" ("id" text not null, "device_type" text not null, "brand" text null, "model" text not null, "color" text null, "serial_number" text null, "imei" text null, "condition_summary" text not null, "accessories" jsonb null, "product_title" text null, "variant_title" text null, "sku" text null, "order_display_id" text null, "purchased_at" timestamptz null, "warranty_context" text null, "anonymized_at" timestamptz null, "case_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "repair_device_snapshot_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_repair_device_snapshot_case_id_unique" ON "repair_device_snapshot" ("case_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_repair_device_snapshot_deleted_at" ON "repair_device_snapshot" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "repair_diagnosis" ("id" text not null, "version" integer not null, "severity" text check ("severity" in ('low', 'medium', 'high', 'critical')) not null, "findings" text not null, "recommended_action" text not null, "internal_note" text null, "diagnosed_by" text not null, "diagnosed_by_name" text null, "completed_at" timestamptz not null, "case_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "repair_diagnosis_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_repair_diagnosis_case_id" ON "repair_diagnosis" ("case_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_repair_diagnosis_deleted_at" ON "repair_diagnosis" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_repair_diagnosis_case_id_version_unique" ON "repair_diagnosis" ("case_id", "version") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "repair_part_usage" ("id" text not null, "status" text check ("status" in ('pending', 'applied', 'reversed')) not null, "inventory_item_id" text not null, "location_id" text not null, "sku" text null, "title" text not null, "quantity" integer not null, "applied_at" timestamptz null, "reversed_at" timestamptz null, "idempotency_key" text not null, "reversal_key" text null, "actor_id" text not null, "case_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "repair_part_usage_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_repair_part_usage_case_id" ON "repair_part_usage" ("case_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_repair_part_usage_deleted_at" ON "repair_part_usage" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_repair_part_usage_idempotency_key_unique" ON "repair_part_usage" ("idempotency_key") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_repair_part_usage_reversal_key_unique" ON "repair_part_usage" ("reversal_key") WHERE reversal_key IS NOT NULL AND deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_repair_part_usage_case_id_status" ON "repair_part_usage" ("case_id", "status") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "repair_quote" ("id" text not null, "version" integer not null, "status" text check ("status" in ('draft', 'submitted', 'approved', 'rejected', 'superseded', 'expired')) not null, "currency_code" text not null, "subtotal" integer not null default 0, "total" integer not null default 0, "content_hash" text null, "diagnosis_version" integer not null, "valid_until" timestamptz null, "submitted_at" timestamptz null, "decided_at" timestamptz null, "created_by" text not null, "case_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "repair_quote_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_repair_quote_case_id" ON "repair_quote" ("case_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_repair_quote_deleted_at" ON "repair_quote" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_repair_quote_case_id_version_unique" ON "repair_quote" ("case_id", "version") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_repair_quote_status_valid_until" ON "repair_quote" ("status", "valid_until") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "repair_access_token" ("id" text not null, "token_hash" text not null, "purpose" text check ("purpose" in ('quote_decision')) not null, "expires_at" timestamptz not null, "consumed_at" timestamptz null, "revoked_at" timestamptz null, "case_id" text not null, "quote_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "repair_access_token_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_repair_access_token_case_id" ON "repair_access_token" ("case_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_repair_access_token_quote_id" ON "repair_access_token" ("quote_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_repair_access_token_deleted_at" ON "repair_access_token" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_repair_access_token_token_hash_unique" ON "repair_access_token" ("token_hash") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_repair_access_token_case_id_purpose" ON "repair_access_token" ("case_id", "purpose") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "repair_quote_decision" ("id" text not null, "decision" text check ("decision" in ('approved', 'rejected')) not null, "actor_type" text check ("actor_type" in ('customer', 'user')) not null, "actor_id" text null, "evidence" text null, "decided_at" timestamptz not null, "idempotency_key" text not null, "quote_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "repair_quote_decision_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_repair_quote_decision_quote_id" ON "repair_quote_decision" ("quote_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_repair_quote_decision_deleted_at" ON "repair_quote_decision" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_repair_quote_decision_quote_id_unique" ON "repair_quote_decision" ("quote_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_repair_quote_decision_idempotency_key_unique" ON "repair_quote_decision" ("idempotency_key") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "repair_quote_item" ("id" text not null, "kind" text check ("kind" in ('service', 'part', 'labor', 'discount')) not null, "title" text not null, "sku" text null, "quantity" integer not null, "unit_price" integer not null, "line_total" integer not null, "internal_cost" integer null, "position" integer not null, "quote_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "repair_quote_item_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_repair_quote_item_quote_id" ON "repair_quote_item" ("quote_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_repair_quote_item_deleted_at" ON "repair_quote_item" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_repair_quote_item_quote_id_position" ON "repair_quote_item" ("quote_id", "position") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "repair_reconciliation_issue" ("id" text not null, "repair_case_id" text not null, "fingerprint" text not null, "issue_type" text check ("issue_type" in ('status_history_mismatch', 'quote_integrity', 'pending_part_usage', 'terminal_resource_active', 'sla_overdue', 'retention_due')) not null, "status" text check ("status" in ('open', 'resolved')) not null, "details" jsonb null, "detected_at" timestamptz not null, "resolved_at" timestamptz null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "repair_reconciliation_issue_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_repair_reconciliation_issue_deleted_at" ON "repair_reconciliation_issue" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_repair_reconciliation_issue_fingerprint_unique" ON "repair_reconciliation_issue" ("fingerprint") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_repair_reconciliation_issue_repair_case_id_status" ON "repair_reconciliation_issue" ("repair_case_id", "status") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "repair_status_history" ("id" text not null, "from_status" text check ("from_status" in ('intake', 'diagnosis', 'quote', 'awaiting_customer_decision', 'repair', 'quality_assurance', 'return_ready', 'returned', 'closed', 'canceled')) null, "to_status" text check ("to_status" in ('intake', 'diagnosis', 'quote', 'awaiting_customer_decision', 'repair', 'quality_assurance', 'return_ready', 'returned', 'closed', 'canceled')) not null, "actor_type" text check ("actor_type" in ('customer', 'user', 'system')) not null, "actor_id" text null, "reason_code" text null, "public_note" text null, "metadata" jsonb null, "idempotency_key" text not null, "sequence" integer not null, "occurred_at" timestamptz not null, "case_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "repair_status_history_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_repair_status_history_case_id" ON "repair_status_history" ("case_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_repair_status_history_deleted_at" ON "repair_status_history" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_repair_status_history_idempotency_key_unique" ON "repair_status_history" ("idempotency_key") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_repair_status_history_case_id_sequence_unique" ON "repair_status_history" ("case_id", "sequence") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "repair_technician_assignment" ("id" text not null, "technician_user_id" text not null, "technician_name" text not null, "assigned_by" text not null, "assigned_at" timestamptz not null, "ended_at" timestamptz null, "idempotency_key" text not null, "case_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "repair_technician_assignment_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_repair_technician_assignment_case_id" ON "repair_technician_assignment" ("case_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_repair_technician_assignment_deleted_at" ON "repair_technician_assignment" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_repair_technician_assignment_idempotency_key_unique" ON "repair_technician_assignment" ("idempotency_key") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_repair_technician_assignment_case_id_ended_at" ON "repair_technician_assignment" ("case_id", "ended_at") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "repair_attachment" add constraint "repair_attachment_case_id_foreign" foreign key ("case_id") references "repair_case" ("id") on update cascade;`);

    this.addSql(`alter table if exists "repair_contact_snapshot" add constraint "repair_contact_snapshot_case_id_foreign" foreign key ("case_id") references "repair_case" ("id") on update cascade;`);

    this.addSql(`alter table if exists "repair_device_snapshot" add constraint "repair_device_snapshot_case_id_foreign" foreign key ("case_id") references "repair_case" ("id") on update cascade;`);

    this.addSql(`alter table if exists "repair_diagnosis" add constraint "repair_diagnosis_case_id_foreign" foreign key ("case_id") references "repair_case" ("id") on update cascade;`);

    this.addSql(`alter table if exists "repair_part_usage" add constraint "repair_part_usage_case_id_foreign" foreign key ("case_id") references "repair_case" ("id") on update cascade;`);

    this.addSql(`alter table if exists "repair_quote" add constraint "repair_quote_case_id_foreign" foreign key ("case_id") references "repair_case" ("id") on update cascade;`);

    this.addSql(`alter table if exists "repair_access_token" add constraint "repair_access_token_case_id_foreign" foreign key ("case_id") references "repair_case" ("id") on update cascade;`);
    this.addSql(`alter table if exists "repair_access_token" add constraint "repair_access_token_quote_id_foreign" foreign key ("quote_id") references "repair_quote" ("id") on update cascade;`);

    this.addSql(`alter table if exists "repair_quote_decision" add constraint "repair_quote_decision_quote_id_foreign" foreign key ("quote_id") references "repair_quote" ("id") on update cascade;`);

    this.addSql(`alter table if exists "repair_quote_item" add constraint "repair_quote_item_quote_id_foreign" foreign key ("quote_id") references "repair_quote" ("id") on update cascade;`);

    this.addSql(`alter table if exists "repair_status_history" add constraint "repair_status_history_case_id_foreign" foreign key ("case_id") references "repair_case" ("id") on update cascade;`);

    this.addSql(`alter table if exists "repair_technician_assignment" add constraint "repair_technician_assignment_case_id_foreign" foreign key ("case_id") references "repair_case" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "repair_attachment" drop constraint if exists "repair_attachment_case_id_foreign";`);

    this.addSql(`alter table if exists "repair_contact_snapshot" drop constraint if exists "repair_contact_snapshot_case_id_foreign";`);

    this.addSql(`alter table if exists "repair_device_snapshot" drop constraint if exists "repair_device_snapshot_case_id_foreign";`);

    this.addSql(`alter table if exists "repair_diagnosis" drop constraint if exists "repair_diagnosis_case_id_foreign";`);

    this.addSql(`alter table if exists "repair_part_usage" drop constraint if exists "repair_part_usage_case_id_foreign";`);

    this.addSql(`alter table if exists "repair_quote" drop constraint if exists "repair_quote_case_id_foreign";`);

    this.addSql(`alter table if exists "repair_access_token" drop constraint if exists "repair_access_token_case_id_foreign";`);

    this.addSql(`alter table if exists "repair_status_history" drop constraint if exists "repair_status_history_case_id_foreign";`);

    this.addSql(`alter table if exists "repair_technician_assignment" drop constraint if exists "repair_technician_assignment_case_id_foreign";`);

    this.addSql(`alter table if exists "repair_access_token" drop constraint if exists "repair_access_token_quote_id_foreign";`);

    this.addSql(`alter table if exists "repair_quote_decision" drop constraint if exists "repair_quote_decision_quote_id_foreign";`);

    this.addSql(`alter table if exists "repair_quote_item" drop constraint if exists "repair_quote_item_quote_id_foreign";`);

    this.addSql(`drop table if exists "repair_case" cascade;`);

    this.addSql(`drop table if exists "repair_attachment" cascade;`);

    this.addSql(`drop table if exists "repair_command_receipt" cascade;`);

    this.addSql(`drop table if exists "repair_contact_snapshot" cascade;`);

    this.addSql(`drop table if exists "repair_device_snapshot" cascade;`);

    this.addSql(`drop table if exists "repair_diagnosis" cascade;`);

    this.addSql(`drop table if exists "repair_part_usage" cascade;`);

    this.addSql(`drop table if exists "repair_quote" cascade;`);

    this.addSql(`drop table if exists "repair_access_token" cascade;`);

    this.addSql(`drop table if exists "repair_quote_decision" cascade;`);

    this.addSql(`drop table if exists "repair_quote_item" cascade;`);

    this.addSql(`drop table if exists "repair_reconciliation_issue" cascade;`);

    this.addSql(`drop table if exists "repair_status_history" cascade;`);

    this.addSql(`drop table if exists "repair_technician_assignment" cascade;`);
  }

}

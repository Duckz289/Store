import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260806034003 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "security_audit_event" drop constraint if exists "security_audit_event_event_hash_unique";`);
    this.addSql(`create table if not exists "security_audit_event" ("id" text not null, "correlation_id" text not null, "actor_id" text null, "actor_type" text null, "auth_identity_id" text null, "action" text not null, "resource_type" text not null, "resource_id" text null, "request_method" text null, "request_path" text null, "outcome" text check ("outcome" in ('success', 'denied', 'error')) not null, "status_code" integer null, "before" jsonb null, "after" jsonb null, "metadata" jsonb null, "integrity_nonce" text not null, "event_hash" text not null, "occurred_at" timestamptz not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "security_audit_event_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_security_audit_event_deleted_at" ON "security_audit_event" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_security_audit_event_event_hash_unique" ON "security_audit_event" ("event_hash") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_security_audit_event_correlation_id" ON "security_audit_event" ("correlation_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_security_audit_event_actor_id" ON "security_audit_event" ("actor_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_security_audit_event_resource_type_resource_id" ON "security_audit_event" ("resource_type", "resource_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_security_audit_event_occurred_at" ON "security_audit_event" ("occurred_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "security_mfa_assurance" ("id" text not null, "auth_identity_id" text not null, "actor_id" text not null, "credential_hash" text not null, "verification_method" text not null, "verified_at" timestamptz not null, "expires_at" timestamptz not null, "revoked_at" timestamptz null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "security_mfa_assurance_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_security_mfa_assurance_deleted_at" ON "security_mfa_assurance" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_security_mfa_assurance_credential_hash" ON "security_mfa_assurance" ("credential_hash") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_security_mfa_assurance_auth_identity_id_expires_at" ON "security_mfa_assurance" ("auth_identity_id", "expires_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "security_audit_event" cascade;`);

    this.addSql(`drop table if exists "security_mfa_assurance" cascade;`);
  }

}

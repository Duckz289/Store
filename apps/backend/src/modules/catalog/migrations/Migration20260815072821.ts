import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260815072821 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "catalog_brand" add column if not exists "kind" text check ("kind" in ('manufacturer', 'store_label', 'unspecified')) not null default 'manufacturer', add column if not exists "logo_alt" text null;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_catalog_brand_kind" ON "catalog_brand" ("kind") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop index if exists "IDX_catalog_brand_kind";`);
    this.addSql(`alter table if exists "catalog_brand" drop column if exists "kind", drop column if exists "logo_alt";`);
  }

}

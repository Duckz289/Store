import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260815073146 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "catalog_product_profile" add column if not exists "data_source" text check ("data_source" in ('real', 'demo_fixture')) not null default 'real', add column if not exists "internal_note" text null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "catalog_product_profile" drop column if exists "data_source", drop column if exists "internal_note";`);
  }

}

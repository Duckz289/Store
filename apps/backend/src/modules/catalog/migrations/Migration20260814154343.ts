import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260814154343 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "catalog_brand" add column if not exists "logo_url" text null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "catalog_brand" drop column if exists "logo_url";`);
  }

}

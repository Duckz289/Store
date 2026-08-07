import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260807134313 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "catalog_brand" drop constraint if exists "catalog_brand_handle_unique";`);
    this.addSql(`create table if not exists "catalog_brand" ("id" text not null, "name" text not null, "handle" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "catalog_brand_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_catalog_brand_deleted_at" ON "catalog_brand" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_catalog_brand_handle_unique" ON "catalog_brand" ("handle") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_catalog_brand_name" ON "catalog_brand" ("name") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "catalog_product_profile" ("id" text not null, "model" text null, "specifications" jsonb null, "media_alt_text" jsonb null, "merchandising" jsonb null, "brand_id" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "catalog_product_profile_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_catalog_product_profile_brand_id" ON "catalog_product_profile" ("brand_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_catalog_product_profile_deleted_at" ON "catalog_product_profile" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "catalog_product_profile" add constraint "catalog_product_profile_brand_id_foreign" foreign key ("brand_id") references "catalog_brand" ("id") on update cascade on delete set null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "catalog_product_profile" drop constraint if exists "catalog_product_profile_brand_id_foreign";`);

    this.addSql(`drop table if exists "catalog_brand" cascade;`);

    this.addSql(`drop table if exists "catalog_product_profile" cascade;`);
  }

}

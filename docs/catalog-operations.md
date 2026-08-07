# Catalog operations

Medusa Admin is the operational source of truth for catalog data. The storefront
owns presentation, branding, layout, and copy that is not catalog data; it does
not maintain a second product, price, or inventory database.

## Taxonomy contract

- **Product Type**: loại sản phẩm lớn, for example Điện thoại, Laptop, Phụ kiện,
  and Thiết bị mạng.
- **Category**: danh mục khách dùng để duyệt/lọc. Categories have stable handles
  and may gain nested children later without changing the storefront architecture.
- **Collection**: nhóm marketing/merchandising, such as Flash Deal, Hàng mới,
  and Ưu đãi nổi bật. Medusa’s native Product model currently has one primary
  Collection relationship, so the seed uses Flash Deal for the current homepage
  membership and creates the other operator-facing marketing buckets without
  pretending that a product belongs to several native collections at once.
- **Tags**: optional flexible metadata. Tags are not a replacement for Product
  Type, Category, or Collection.
- **Brand**: manufacturer/consumer brand from the Catalog extension. A Brand has
  a stable ID, handle, and name; never infer it from a product title or tag.
- **Model**: product model/family identifier stored in the linked Catalog
  profile.
- **Variant**: phiên bản bán được, with its own options, price, SKU, and stock
  relationship.
- **SKU**: mã duy nhất cho variant.

The current top-level category URLs retain their existing Vietnamese handles for
bookmark compatibility. New nested categories should use a stable handle and
parent category relationship; do not compare display labels in storefront code.

## Source-of-truth boundaries

| Data | Source of truth |
| --- | --- |
| Product identity, title, handle, media | Medusa Product |
| Brand, model, specifications, image alt text | Catalog profile linked to Medusa Product |
| Product Type, Category, Collection | Medusa catalog entities |
| Variant options and SKU | Medusa Product Variant |
| VND price and calculated promotion price | Medusa Pricing/Promotion modules |
| Availability and quantity | Medusa Inventory Module |
| Branding, visual layout, section styling | Storefront code |

The storefront reads published products through the Store API. Draft, rejected,
or unpublished products must not be made visible by frontend configuration.

## Complete product workflow

### A. Create product

In **Products → Create**, enter the native Medusa product name, description, and
stable handle. Save as Draft while the product is incomplete. Do not put Brand,
Model, Category, or price copies in metadata.

### B. Add media

Use the native **Media** section to upload the thumbnail and gallery through the
configured Medusa File Module. Reorder, replace, or remove images there. After
saving the product, use **Brand, model and specifications → Image alt text** for
an accessible description of each current image. Production storage is selected
through the File Module provider; it is not a storefront concern.

### C. Set Brand and Model

In **Brand, model and specifications**, select an existing Brand or create one
inline. Brand handles are stable lowercase hyphenated identifiers. Enter Model as
the manufacturer's model/family value. These fields are linked to the native
product and are returned to the storefront with it.

### D. Set Type and Category

Use native **Product organization** to select Product Type and one or more
Categories. Type is the high-level kind; Category is the customer navigation
hierarchy. Do not use Collection for taxonomy.

### E. Add specifications

Add rows in the catalog widget. Each row has a stable `snake_case` key, display
label, value, and optional unit. Keys must be unique within the product. Rows are
ordered explicitly and may vary by Category; the storefront renders the rows it
receives instead of checking product names.

### F. Add variants and options

Use native **Options** and **Variants**. A physical sellable configuration is a
variant, not a separate custom product record. Set title, option values, barcode
only when used, shipping dimensions/weight when relevant, and keep backorder off
unless the business explicitly allows it.

### G. Assign SKU

Every physical sellable variant must have one non-empty globally unique SKU.
Use the convention below. The Admin guard reports duplicate SKUs before Medusa's
native workflow can reuse a variant, and the native unique index remains the
database constraint. Repair the conflicting variant rather than regenerating
unrelated valid SKUs.

### H. Set VND base price

Open the variant's native Prices editor, select the Vietnam region/sales channel,
and set the normal VND base price. Confirm the effective base price in Admin and
the calculated VND price in Preview. Promotions, coupons, sales, crossed-out
prices, and price lists are separate work and are not managed by this workflow.

### I. Set inventory

Keep `manage_inventory=true` for normal physical variants and `allow_backorder=false`
unless explicitly approved. Use native Inventory to link the Inventory Item and
adjust stock at **Kho chính Hưng Phát**. Inspect stocked, reserved, and available
quantities in Medusa; never write stock with SQL or product metadata.

### J. Preview product

Save the product, then click **Preview storefront** in the catalog widget. The
preview page reuses the real Product Card and PDP and provides Desktop/Mobile
frames. Preview is read-only. Its signed link expires after five minutes, is
bound to one product, is issued only to an authenticated Admin, is no-store and
no-index, and does not add to cart or change inventory/order/payment state.
Unsaved form edits are not included; save before previewing.

### K. Publish or unpublish

Use native product status. Draft/rejected products stay out of normal Store API
responses. Publish only after media, variant, SKU, VND price, inventory, preview,
and sales-channel assignment have been checked. Unpublish with the same native
status control; URLs/handles remain unchanged.

### L. Add or remove from Collection

Use native Product Collection membership for merchandising groups. A product has
one native primary Collection in this Medusa version. Configure the Collection
position in the catalog widget separately from each Category and from Homepage
Flash Deal position. Changing Flash Deal order never changes Category order.

## Stock-location policy

There is one primary stock location: **Kho chính Hưng Phát**. Every managed
physical variant must have a linked Inventory Item and an Inventory Level at this
location. Storefront stock text is derived from Medusa availability; operators
must adjust stock through Admin Inventory, never through frontend code or SQL.

## SKU rules

Use a stable uppercase convention such as `BRAND-PRODUCT-VARIANT`, separated by
hyphens and without spaces. For example, `HP-WORKPRO14-16-512`.

- Every sellable physical variant needs a non-empty SKU.
- SKUs are globally unique across sellable variants.
- Preserve a valid existing SKU during normalization; do not renumber it only
  to match an example.
- A duplicate or missing SKU is a seed conflict and must be repaired explicitly.

## Storefront mapping

- Category navigation and filters use Medusa category IDs/handles.
- `/categories/<handle>` remains the category URL shape.
- Flash Deal products come from the Medusa `flash-deal` Collection.
- The homepage’s secondary rail reuses that same native Collection response so
  membership is controlled in Admin without an extra merchandising database.
- Category, Collection, and Homepage positions are context-specific values in
  the linked Catalog profile. Lower values appear first; missing values fall
  back after positioned products.
- Prices, variants, and stock are requested from the Store API for the Vietnam
  region and VND sales context.

## Future extension boundaries

The following are deliberately **future work and are not implemented now**:

- Goods Receipt
- Stock Movement ledger
- Supplier
- Purchase Order
- Stock Transfer
- Multi-warehouse
- Barcode workflow
- Reorder point
- Cost accounting
- Promotions, coupons, and sale campaigns

Do not introduce a parallel inventory or merchandising database to implement
these later milestones.

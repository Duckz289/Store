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
| Product Type, Category, Collection | Medusa catalog entities |
| Variant options and SKU | Medusa Product Variant |
| VND price and calculated promotion price | Medusa Pricing/Promotion modules |
| Availability and quantity | Medusa Inventory Module |
| Branding, visual layout, section styling | Storefront code |

The storefront reads published products through the Store API. Draft, rejected,
or unpublished products must not be made visible by frontend configuration.

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
- Prices, variants, and stock are requested from the Store API for the Vietnam
  region and VND sales context.

## Shop-operator workflows

1. **Add a new product**: Admin → Products → Create; enter identity, media,
   description, Product Type, and Category.
2. **Add a variant/SKU**: create the sellable option combination, assign a unique
   SKU, and enable inventory management for physical stock.
3. **Set VND price**: set the price for the Vietnam region/sales channel in VND.
4. **Add inventory**: open the variant Inventory action and set stock at Kho chính
   Hưng Phát.
5. **Assign category/type**: use Product Organization; do not encode these in
   tags or frontend labels.
6. **Add/remove Flash Deal membership**: open the Flash Deal Collection and
   manage product membership.
7. **Publish/unpublish**: use Medusa’s native product status. Unpublish when a
   product should no longer appear in the storefront.

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

Do not introduce a parallel inventory or merchandising database to implement
these later milestones.

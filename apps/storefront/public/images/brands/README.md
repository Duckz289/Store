# Logo thương hiệu

Các file SVG trong thư mục này là logo thật của hãng sản xuất, dùng để nhận diện
sản phẩm cửa hàng đang bán. Seed (`apps/backend/src/scripts/initial-data-seed.ts`)
tải chúng lên qua Medusa File Module, nên storefront phục vụ logo từ chính origin
của mình, không hotlink URL bên ngoài.

## Nguồn và giấy phép

Tất cả logo lấy từ Wikimedia Commons và đều ở trạng thái **Public domain**
(logo chỉ gồm chữ và hình khối đơn giản, dưới ngưỡng bảo hộ quyền tác giả).
Danh sách đầy đủ kèm link trang mô tả gốc nằm trong `manifest.json`.

Logo vẫn là **nhãn hiệu** của chủ sở hữu. Ở đây chúng chỉ được dùng để chỉ đúng
sản phẩm của hãng mà cửa hàng phân phối, không dùng làm nhận diện của Hưng Phát.

## Hãng chưa có logo

Chưa tìm được logo có giấy phép phù hợp cho: **Sunhouse, Kangaroo, Casper**.

Các hãng này vẫn có sản phẩm và vẫn xuất hiện trong bộ lọc dưới dạng chip chữ.
Chúng **không** xuất hiện ở khối "Hãng đang có hàng" trong menu danh mục, và
storefront **không bao giờ** thay logo bằng chữ cái viết tắt. Trong Admin Catalog
chúng hiển thị nhãn "Chưa có logo".

Để bổ sung: vào `http://localhost:8020/admin/catalog`, sửa thương hiệu và tải logo
lên (SVG/PNG/WebP, tối đa 512 KB, nền trong suốt hoặc nền trắng). Nên lấy từ press
kit hoặc brand media kit chính thức của hãng.

## Chuẩn file

- Định dạng SVG, nền trong suốt.
- Mọi file đều có `viewBox` để `object-fit: contain` co giãn đúng tỉ lệ, không méo.
- Tên file trùng `handle` của brand trong seed (`asus.svg` ↔ brand `asus`).

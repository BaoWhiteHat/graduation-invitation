# Thiệp mời tốt nghiệp · Lê Quốc Bảo

Thiệp mời tương tác với hoạt cảnh cybersecurity, chuyến bay, mascot và PDF cá nhân hóa tên khách.

## Chạy trên máy

Yêu cầu Node.js 22.12 trở lên.

```sh
npm ci
npm run dev
```

```sh
node --test tests/*.test.js
npm run build
```

## Deploy lên Vercel

1. Push repo lên GitHub, rồi chọn **Add New → Project** trong Vercel và import repo.
2. Chọn nhánh đã push làm Production Branch. Framework: **Vite**, build: `npm run build`, output: `dist` (đã khai báo trong `vercel.json`).
3. Nếu đang dùng Web3Forms, thêm `VITE_WEB3FORMS_KEY` vào Environment Variables trước khi deploy. Xem `.env.example`. Không commit `.env`. Các biến bắt đầu bằng `VITE_` được đưa vào mã trình duyệt, nên không dùng cho bí mật máy chủ.
4. Deploy và mở link HTTPS được Vercel cấp. Kiểm tra link bằng cửa sổ ẩn danh để chắc khách không cần đăng nhập.

Vercel lưu và phục vụ bản build; máy tính cá nhân có thể tắt sau khi deploy. Những lần push sau sẽ tạo bản deploy mới qua kết nối GitHub.

## Deploy thử trên GitHub Pages

Workflow `.github/workflows/pages.yml` build và deploy mỗi lần push lên `main`. Trong **Settings → Pages**, chọn **Source: GitHub Actions**, để trống **Custom domain** khi dùng link miễn phí:

https://baowhitehat.github.io/graduation-invitation/

Thêm Repository Variable `VITE_WEB3FORMS_KEY` trong **Settings → Secrets and variables → Actions → Variables** nếu dùng Web3Forms. Biến `VITE_` là cấu hình đưa vào trình duyệt. Workflow dùng đường dẫn `/graduation-invitation/`; build mặc định trên Vercel vẫn dùng `/`.

## Gửi lời mời riêng

Thêm tên khách vào URL công khai, ví dụ:

```text
https://TEN-DU-AN.vercel.app/?guest=Nguy%E1%BB%85n%20Minh%20Anh
```

Khách xác nhận tên tại màn hình đầu; vé, lời mời và PDF dùng tên đã xác nhận. Mở website bằng link gốc để trải nghiệm từ đầu. Các tham số preview chỉ dùng trong môi trường phát triển.

## Âm thanh

Nguồn nhạc, hiệu ứng và ghi nhận tác giả được lưu tại `docs/audio-sources.md` và trang `/credits.html`.

# Deploy Cùng Con lên Render + Supabase

Đã có cấu hình chạy thật với PostgreSQL. Không cần Supabase Auth, Storage, `anon` hay `service_role`: tài khoản vẫn do ứng dụng quản lý; video lưu link YouTube/Google Drive. Ảnh giáo viên tải lên lưu trong dữ liệu PostgreSQL; ảnh và giọng đọc đi kèm ứng dụng nằm trong `assets/`.

## Cập nhật ứng dụng đang chạy

Bản mới bổ sung lộ trình Toán và Máy tính: tổng 80 bài, 5 mẫu lộ trình. Khi khởi động, server nạp thêm hai mẫu; giáo viên chọn giao cho từng học sinh. Mục **Hoạt động vui vẻ** có ghép ảnh và bốn loại hoạt động do giáo viên quản lý.

100 hoạt động mẫu (20 bài mỗi lộ trình) đã được nạp vào SQLite local bằng các script `scripts/seed-*-fun.mjs`. Mã nguồn, ảnh và âm thanh của bộ mẫu được đưa lên Git; **push Git không tự nhập 100 hoạt động này vào Supabase**. Các script nạp hiện dành cho SQLite, không chạy chúng trên ổ tạm Render. Khi cần đưa nội dung mẫu lên production, phải nhập bổ sung vào dữ liệu đang có, giữ bản sao lưu và các chỉnh sửa của giáo viên; không nhập đè database local.

Bản cập nhật quản lý giáo viên tự bổ sung thư viện 3 mẫu lộ trình vào dữ liệu Supabase khi khởi động lần đầu. Các bản đã giao và điểm hiện có được giữ nguyên. Giáo viên tạo/sửa/xóa mẫu dùng chung rồi giao bản riêng cho từng học sinh; gỡ bản đã giao giữ lại lịch sử. Kết quả ghép ảnh, luyện 5 câu và câu hỏi video được lưu khi hoàn thành, tách khỏi điểm giáo viên. Không nhập đè SQLite local lên Supabase.

40 tranh ghép (20 kỹ năng sống, 10 động vật, 10 xe cộ), giọng đọc và câu hỏi đi cùng mã nguồn. Không cần chạy SQL hoặc upload Storage. Chỉ các nguồn video đã có câu hỏi tương ứng mới hiện hoạt động video.

Push nhánh `main` lên GitHub để Render tự deploy nếu Auto-Deploy đang bật. Khi phiên bản mới khởi động với `DATABASE_URL` hiện có, ứng dụng bổ sung 24 bài Động vật/Xe cộ và hai kế hoạch còn thiếu cho mỗi trẻ vào Supabase, giữ nguyên tài khoản, phân công, bài đã sửa và điểm cũ. Có 3 video được gắn vào 12 bài phù hợp; link giáo viên đã thêm hoặc chủ động xóa được giữ nguyên. Không chạy `db:migrate` để ghi đè database đang sử dụng.

Ảnh/giọng đọc cập nhật theo mã nguồn; không cần upload Supabase Storage. Kiểm tra sau deploy bằng tài khoản giáo viên: đủ 3 thẻ lộ trình, bài mới có hình/giọng Việt và nút xem video. Tổng bộ bài mặc định hiện là **68 bài** (44 bài cũ + 24 bài mới), mỗi trẻ có 3 lộ trình.

## 1. Chọn giữ dữ liệu cũ hoặc bắt đầu mới

**Muốn giữ hồ sơ, tài khoản, bài học và điểm đang có:** làm bước 2 rồi chạy chuyển dữ liệu ở bước 3 **trước khi khởi động app bằng PostgreSQL hoặc deploy Render lần đầu**.

**Muốn bắt đầu mới:** bỏ qua bước 3. Lần đầu Render khởi động sẽ tạo schema, tài khoản admin từ biến môi trường và đủ **68 bài**. Không tạo học sinh hay tài khoản test. Các lần deploy sau chỉ bổ sung nội dung chủ đề còn thiếu, không ghi đè bài đã chỉnh.

## 2. Chuẩn bị Supabase và `.env`

Trong Supabase, **Connect → Session pooler**, lấy URL PostgreSQL cổng **5432**. Dùng project riêng cho app. URL đã điền host/project trong `.env.example`; thay mật khẩu mới sau khi đổi mật khẩu đã chia sẻ trong chat.

Tại thư mục chứa `package.json`:

```powershell
npm ci
Copy-Item .env.example .env
```

Chỉ chạy `Copy-Item` khi chưa có `.env`. Chỉnh trực tiếp trong IDE:

```dotenv
DATABASE_URL=postgresql://postgres.PROJECT_REF:PASSWORD_DA_MA_HOA@POOLER_HOST:5432/postgres
ADMIN_USERNAME=admin
ADMIN_PASSWORD=MAT_KHAU_ADMIN_RIENG_CUA_BAN
NODE_ENV=development
HOST=0.0.0.0
COOKIE_SECURE=0
TRUST_PROXY=0
```

Mật khẩu DB và mật khẩu tài khoản admin là **hai mật khẩu khác nhau**. Phần mật khẩu trong URL phải percent-encode ký tự đặc biệt: `@` → `%40`, `#` → `%23`, `%` → `%25`, `/` → `%2F`, `:` → `%3A`. Không đặt nguyên URL vào lệnh shell hoặc gửi lại chat.

```powershell
npm run db:check
```

Lệnh chỉ kiểm tra kết nối, không tạo bảng hoặc ghi dữ liệu. TLS xác minh chứng chỉ khi kết nối ra ngoài máy. Ứng dụng tự nạp `supabase-ca.crt` cho hostname thuộc Supabase, khắc phục `SELF_SIGNED_CERT_IN_CHAIN` trên Render. Chứng chỉ công khai lấy từ https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt (Supabase Root 2021 CA, hạn 26/04/2031). Nếu dùng CA riêng, đặt `DATABASE_CA_FILE` trỏ tới tệp PEM; không tắt xác minh TLS.

Ứng dụng tự tạo các bảng trong schema **`aac_private`**, thu hồi quyền `PUBLIC`, `anon`, `authenticated` và bật RLS. Không thêm schema này vào các schema công khai của Supabase Data API. Dùng kết nối database của backend để chạy app, không gọi trực tiếp bảng từ trình duyệt.

## 3. Chuyển dữ liệu SQLite hiện tại (nếu muốn giữ)

Trong thời gian chuyển, dừng người dùng ghi thêm vào app local. Không chạy `npm start` với PostgreSQL trước khi chuyển.

```powershell
npm run db:migrate -- data/aac.sqlite
```

Công cụ sẽ:

- Tạo bản sao SQLite trong `data/backups/`.
- Chuyển dữ liệu giáo dục, tài khoản và mật khẩu đã băm, phân công, nhật ký và bản dự phòng khôi phục.
- Đối chiếu dữ liệu và tài khoản trong một giao dịch; lỗi thì rollback.
- **Từ chối ghi đè nếu Supabase đã có tài khoản hoặc dữ liệu sử dụng.** Chạy lại sau thành công cũng từ chối để tránh ghi đè.
- Không chuyển phiên đăng nhập đang mở; đăng nhập lại bằng tài khoản cũ. Tệp SQLite local không bị sửa.

Nếu báo một bài còn video tải lên, đưa video đó lên Drive/YouTube và cung cấp tệp ánh xạ riêng, ví dụ `data/video-links.json`:

```json
{
  "MA_BAI_HOC": {
    "drive": {
      "url": "https://drive.google.com/file/d/ID_TEP_VIDEO/view",
      "title": "Tên video",
      "channel": "Giáo viên / nguồn video",
      "note": "Thực hành sau khi xem"
    }
  }
}
```

```powershell
npm run db:migrate -- data/aac.sqlite --video-links data/video-links.json
```

Có thể dùng thuộc tính `youtube` thay `drive` với cùng bốn trường. Không âm thầm bỏ video cũ; công cụ sẽ dừng nếu bài hiện tại hoặc bản khôi phục lịch sử còn tham chiếu tệp mà chưa có link thay thế. Kiểm tra hoặc đổi mật khẩu các tài khoản test trước khi cho người dùng thật truy cập.

## 4. Đưa mã lên Git và tạo Render Blueprint

Đưa mã nguồn lên repository của bạn, gồm `package.json`, `package-lock.json`, các tệp `.mjs/.js/.css`, `content/`, `assets/` và các tài liệu học liệu cần dùng. Không đưa `.env`, `data/`, `tmp/`, `node_modules/` lên Git; `.gitignore` đã loại các mục này.

Có hai tệp Blueprint phù hợp hai cách đẩy repository:

- Nếu repository chứa thư mục con **`apptuvanhoctap/`**: dùng `render.yaml` ở thư mục ngoài. Tệp này đã đặt `rootDir: apptuvanhoctap`.
- Nếu repository bắt đầu ngay tại **thư mục chứa `package.json`**: dùng `render.yaml` nằm cùng `package.json`, không cần Root Directory.

Trong Render: **New → Blueprint → chọn repository → Apply**. Điền các giá trị được hỏi:

| Biến | Giá trị |
| --- | --- |
| `DATABASE_URL` | URL Session pooler chứa mật khẩu DB đã mã hóa; cùng URL đã kiểm tra ở local |
| `ADMIN_PASSWORD` | Mật khẩu tài khoản admin đầu tiên nếu DB trống; không dùng mật khẩu DB |
| `ADMIN_USERNAME` | Mặc định `admin`; có thể chỉnh |

Blueprint đã cấu hình Node **24**, `npm ci --omit=dev`, `npm start`, `HOST=0.0.0.0`, `NODE_ENV=production`, `COOKIE_SECURE=1`, `TRUST_PROXY=1` và health check **`/api/health`**. Render cấp `PORT` tự động, không cần đặt `PORT=3000` trên Render. Không cần persistent disk.

Nếu tạo Web Service thủ công, nhập các thông số tương tự. Biến `ADMIN_USERNAME/ADMIN_PASSWORD` chỉ dùng khi chưa có tài khoản nào, không đổi mật khẩu trên mỗi lần khởi động. Nếu đã chuyển SQLite, đăng nhập bằng tài khoản cũ, không phải tài khoản mới trong env. Có thể bỏ hai biến admin sau khi đã khởi tạo thành công.

Khi `NODE_ENV=production` mà thiếu `DATABASE_URL`, máy chủ sẽ dừng thay vì tự rơi về SQLite trên ổ đĩa tạm.

## 5. Kiểm tra sau deploy

1. Truy cập `https://TEN-APP.onrender.com/api/health`, phải trả `{"ok":true}`.
2. Đăng nhập bằng admin mới hoặc tài khoản đã chuyển. Tạo giáo viên, học sinh và phân công nếu bắt đầu mới.
3. Giáo viên chọn mẫu cấp 1/cấp 2, lưu cho học sinh rồi kiểm tra 3 card lộ trình. Bộ bài không tự gán theo năm sinh.
4. Thử một link YouTube và một video Drive bạn sở hữu. Drive cần quyền xem phù hợp; video dùng chung có thể bật “Bất kỳ ai có đường liên kết → Người xem”. Video riêng tư cần cấp quyền đúng người. Link giữ `resourcekey` nếu có.
5. Redeploy hoặc restart Render, đăng nhập lại và kiểm tra hồ sơ/điểm còn nguyên. Cài PWA qua HTTPS trên điện thoại.

Link Drive dùng trình phát chính thức `/preview`; chỉ tải khi bấm xem. Drive có thể yêu cầu đăng nhập, chặn cookie bên thứ ba, chờ xử lý video hoặc giới hạn lưu lượng; có nút mở nguồn để dự phòng. Không yêu cầu Google API key. Chưa có link Drive thật do bạn cung cấp để kiểm tra quyền và nội dung; kiểm thử tự động dùng trình phát mô phỏng.

## Giới hạn và sao lưu

- Dữ liệu giáo dục hiện vẫn là một snapshot JSON trong PostgreSQL, giới hạn **22 MB**; ảnh thẻ nhỏ lưu cùng snapshot. Các lần sửa được khóa giao dịch và kiểm tra phiên bản để tránh ghi đè. Đây là kiến trúc cho quy mô nhỏ, chưa phải thiết kế phân bảng cho tải lớn.
- PostgreSQL lưu bền vững dữ liệu, tài khoản và phiên đăng nhập. Render không lưu video/ảnh riêng trên ổ đĩa. Supabase Storage không cần trong phiên bản này.
- API backup của admin chỉ xuất nội dung giáo dục, không xuất mật khẩu/tài khoản. Muốn sao lưu đầy đủ, dùng backup/`pg_dump` database, gồm schema `aac_private`; kiểm tra tính năng backup theo gói Supabase của bạn.
- Render Free có thể ngủ khi ít truy cập; lần mở đầu có thể chậm. Supabase Free có giới hạn và có thể tạm dừng project; kiểm tra dashboard nếu health check lỗi.

## Kiểm thử đã chuẩn bị

```powershell
npm test
npm run test:postgres
npm run test:ui
```

`test:postgres` chạy PostgreSQL thật trong thư mục tạm riêng, kiểm tra đa phiên, khởi động lại, phân quyền, điểm mở khóa và chuyển SQLite. Không sử dụng project Supabase thật hoặc `.env` của bạn. Test giao diện sử dụng Edge; môi trường khác cần cấu hình trình duyệt Playwright phù hợp.

# Tóm tắt Quá trình Xây dựng và Bàn giao Dự án Website `loc.digital`

Tài liệu này tổng hợp toàn bộ thông tin kiến trúc, cấu trúc thư mục, các tính năng đã thực hiện, hệ thống hiệu ứng chuyển động (animations) và các lưu ý tối ưu hóa kỹ thuật của website **loc.digital** (portfolio cá nhân của Phuc Loc Nguyen). Tài liệu này được chuẩn bị để bàn giao cho agent **Claude Sonnet 4.6** tiếp tục phát triển.

---

## 1. Thông tin Chung (Project Overview)
- **Tên dự án:** Portfolio cá nhân Phuc Loc Nguyen
- **Website URL:** [https://loc.digital](https://loc.digital)
- **Công nghệ chính (Tech Stack):**
  - **Framework:** [Astro (v4.16+)](https://astro.build/) với cấu hình tích hợp chạy Static Site Generation (SSG).
  - **UI Libraries:** React (v19) và Framer Motion (v12) hỗ trợ xây dựng các component tương tác động phức tạp.
  - **Styling:** Tailwind CSS (v3.4) kết hợp với hệ thống **Vanilla CSS** tùy chỉnh rất chi tiết viết trong [src/styles/global.css](file:///Users/nguyenphucloc/Library/Mobile%20Documents/com~apple~CloudDocs/porfolio/src/styles/global.css).
  - **Image Processing:** [Sharp](https://sharp.pixelplumbing.com/) để nén và xử lý hình ảnh tự động khi build.
  - **Deployment:** Tự động hóa qua [Vercel](https://vercel.com/) liên kết với kho lưu trữ GitHub.

---

## 2. Kiến trúc & Cấu trúc Thư mục (Architecture & Folder Structure)

Dưới đây là sơ đồ tổ chức mã nguồn chính của dự án:

```text
porfolio/
├── astro.config.mjs          # Cấu hình chính của Astro (site URL, các integration, tối ưu Sharp, Vite)
├── tailwind.config.mjs       # Cấu hình Tailwind (Đặc biệt: Tắt preflight để bảo vệ styles Vanilla)
├── package.json              # Danh sách dependencies (Astro, React, Framer Motion, Sharp...)
├── docs/                     # Tài liệu dự án, design system, animation notes, build summary
│   ├── animation-effects.md  # Tài liệu chi tiết về các hiệu ứng chuyển động trên web
│   ├── design-rules.md       # Quy chuẩn thiết kế và style guideline của loc.digital
│   └── loc-digital-build-summary.md
├── public/                   # Thư mục chứa các tài nguyên tĩnh trực tiếp (logos, favicons...)
└── src/
    ├── assets/
    │   └── photos/           # Ảnh gốc phân giải cao được phân loại theo địa danh (để Sharp xử lý)
    ├── components/
    │   ├── ui/               # Component UI dùng chung cho hero, hiệu ứng chữ, collage và dialog
    │   └── writing/          # Component cho dashboard/editor bài viết
    ├── content/              # Quản lý nội dung tĩnh thông qua Astro Content Collections
    │   ├── config.ts         # Khai báo schema định dạng dữ liệu (pages, writing, projects, photos, gear)
    │   ├── gear/             # JSON chứa danh sách thiết bị
    │   ├── photos/           # Dữ liệu ảnh dạng JSON phân chia theo địa danh
    │   ├── projects/         # Thông tin chi tiết về các dự án thực tế
    │   └── writing/          # Các bài viết Markdown (.md) chia sẻ kiến thức
    ├── data/
    │   └── projects.ts       # Dữ liệu backup/chia sẻ danh sách dự án
    ├── layouts/
    │   └── Layout.astro      # Layout bao ngoài chính chứa header, footer, SEO metadata, và JS hiệu ứng toàn trang
    ├── lib/
    │   ├── cms.ts            # Hỗ trợ lấy dữ liệu từ Content Collections
    │   ├── locations.ts      # Chứa mảng dữ liệu tĩnh phục vụ cho trang hình ảnh
    │   ├── photo-assets.ts   # Module cốt lõi sử dụng Sharp tối ưu ảnh thành AVIF & WebP + tạo srcsets
    │   └── writing.ts        # Helper lấy và sắp xếp các bài viết
    ├── pages/                # Các file định nghĩa trang (Routing của Astro)
    │   ├── index.astro       # Trang chủ (Hero Section, Timeline kinh nghiệm, Dải ảnh chạy vô tận, Bài viết mới)
    │   ├── about.astro       # Trang giới thiệu thông tin bản thân
    │   ├── gear.astro        # Trang giới thiệu thiết bị sử dụng hàng ngày
    │   ├── photos.astro      # Trang hiển thị ảnh phân loại theo địa danh (Dạng tab-switching)
    │   ├── gallery.astro     # Thư viện ảnh dạng Masonry 6 cột (tự động phân bổ ảnh vào cột ngắn nhất)
    │   ├── question.astro    # Trang Q&A tương tác
    │   ├── workflow-space.astro # Trang trưng bày không gian làm việc với hiệu ứng bay bổng
    │   └── work/
    │       ├── index.astro   # Danh sách dự án (hiệu ứng hover làm mờ các dòng khác)
    │       └── [slug].astro  # Chi tiết từng dự án marketing/growth
    └── styles/
        └── global.css        # Toàn bộ hệ thống style CSS, biến màu sắc, typography và hiệu ứng
```

---

## 3. Các Hiệu ứng Chuyển động Nổi bật (Animations & Transitions)
Hệ thống hiệu ứng của website kết hợp hài hòa giữa **CSS Transitions/Animations** và **JavaScript (Intersection Observer & requestAnimationFrame)** để tạo trải nghiệm mượt mà, cao cấp:

1. **Page Load Entrance (Hiệu ứng Load Trang):**
   - Nội dung `body` ẩn (`opacity: 0`, dịch chuyển xuống `16px`). Khi DOM sẵn sàng, JS kích hoạt class `.ready` để làm mờ dần và trượt lên mượt mà với thời gian `1.1s`.
2. **Toki Stretched Reveal (Hiệu ứng Xuất hiện khi Cuộn):**
   - Áp dụng cho các thẻ có class `.r` hoặc `.toki-r` thông qua **Intersection Observer**.
   - Khi phần tử sắp xuất hiện, nó được kéo giãn nhẹ chiều dọc (`scaleY(1.08)`), làm mờ (`blur(8px)`), trượt từ dưới lên `24px` với cubic-bezier tùy chỉnh và hỗ trợ độ trễ so le (`data-d="1"` đến `7`).
3. **Hero Floating Text (Chữ nổi Hero):**
   - Các từ khóa tiêu đề ở trang chủ (`Performance.`, `Strategy.`, `Scaling revenue`) sử dụng `@keyframes` CSS dao động lên xuống lệch nhịp để trông như đang nổi trên nước.
4. **Work List Hover Blur (Hover làm mờ xung quanh):**
   - Trong trang danh sách dự án `/work`, khi người dùng hover vào một dòng dự án, CSS selector thông minh `.project-list:hover .project-row:not(:hover)` sẽ làm mờ các dòng còn lại xuống `opacity: 0.35` và `blur(3px)`.
5. **Zoom & Depth Hover (Chiều sâu 3D khi hover):**
   - Hover vào thẻ dự án sẽ zoom nhẹ hình ảnh đại diện (`scale(1.02)`) kèm bóng đổ mềm, đồng thời logo thương hiệu bên trong zoom nhẹ tạo cảm giác parallax 3D.
6. **Gallery Infinite Scroll & Drag-to-Scroll (Homepage Marquee):**
   - Dải ảnh ở trang chủ tự động chạy ngang vô tận nhờ `requestAnimationFrame` liên tục cộng dồn `scrollLeft`. Tự động dừng khi di chuột hoặc touch để xem kỹ hơn.
   - Hỗ trợ kéo thả chuột (drag-to-scroll) trên máy tính với quán tính trượt tự nhiên (momentum glide) được tính toán bằng vận tốc di chuyển chuột.
7. **Typed.js (Chữ gõ Hero):**
   - Sử dụng thư viện ngoài qua CDN để gõ liên tục cụm từ khóa: `'data.'`, `'automation.'`, `'ads.'`.
8. **Dynamic Favicon (Favicon động):**
   - Tự động thay đổi favicon dựa trên trạng thái cửa sổ trình duyệt: hiển thị biểu tượng hoạt động (`https://65wv0vnolo.ufs.sh/f/0DwDtVjMS59hn9SRdiJ5TFbsKzkHujxQqSNBdEect3LIpPhg`) khi tab đang mở và chuyển sang trạng thái nghỉ (`https://65wv0vnolo.ufs.sh/f/0DwDtVjMS59hn9SRdiJ5TFbsKzkHujxQqSNBdEect3LIpPhg`) khi người dùng chuyển sang tab khác để giữ tương tác thương hiệu.

---

## 4. Các Giải pháp Kỹ thuật & Tối ưu hóa Quan trọng

### A. Tối ưu hóa Ảnh qua sharp trong Astro ([src/lib/photo-assets.ts](file:///Users/nguyenphucloc/Library/Mobile%20Documents/com~apple~CloudDocs/porfolio/src/lib/photo-assets.ts))
Để xử lý hàng loạt bức ảnh chụp thực tế có độ phân giải siêu cao (ảnh gốc từ máy ảnh kỹ thuật số có dung lượng lên đến 26MB+):
- Định cấu hình `image.service.config.limitInputPixels: false` trong `astro.config.mjs` để tránh bị tràn bộ nhớ khi build trên Vercel.
- Tự động chuyển đổi và tạo srcset định dạng **AVIF** (nhẹ hơn WebP khoảng 30%) làm định dạng mặc định, đồng thời tạo định dạng **WebP** làm fallback cho các trình duyệt cũ.
- Sử dụng hàm `optimizePhoto` để giới hạn các kích thước cần thiết tùy thuộc vào grid (ví dụ: masonry columns tối đa 520px) nhằm tránh tải ảnh quá lớn gây lãng phí băng thông.

### B. Masonry Layout logic động ([src/pages/gallery.astro](file:///Users/nguyenphucloc/Library/Mobile%20Documents/com~apple~CloudDocs/porfolio/src/pages/gallery.astro))
- Không sử dụng CSS columns thông thường (dễ làm đứt/lệch thứ tự ảnh khi cuộn) hay thư viện nặng nề. Trang `/gallery` tự dựng bố cục Masonry bằng một đoạn script JS nhỏ:
  - Chia trang thành 6 cột (hoặc 4, 3, 2 tùy kích thước màn hình).
  - Duyệt qua danh sách ảnh đã tải, đo tỷ lệ khung hình (`ph / pw`), và luôn chèn ảnh tiếp theo vào **cột có tổng chiều cao hiện tại ngắn nhất**.
  - Kết hợp với `IntersectionObserver` để thực hiện lazy load ảnh theo từng nhóm 15 chiếc, giảm thiểu số lượng DOM render ban đầu.

### C. Khắc phục Xung đột CSS (Tailwind vs Vanilla CSS)
- Dự án sử dụng Tailwind CSS cho các component React mới tích hợp, nhưng styles nền tảng của trang web lại được tùy biến cao độ bằng Vanilla CSS.
- Để ngăn Tailwind reset đè lên các thuộc tính đặc trưng của Vanilla CSS, tùy chọn `preflight` đã bị tắt hoàn toàn trong cấu hình Tailwind:
  ```javascript
  // tailwind.config.mjs
  export default {
    corePlugins: {
      preflight: false,
    },
    // ...
  }
  ```

### D. Loại bỏ WordPress CMS & Keystatic CMS
- Dự án đã được tái cấu trúc hoàn toàn để **loại bỏ tích hợp WordPress** và các tệp dư thừa của Keystatic CMS nhằm đưa dự án về trạng thái Static 100%.
- Tất cả nội dung hiện được lưu trữ cục bộ dưới dạng tệp dữ liệu tĩnh trong thư mục `src/content/` và được biên dịch tĩnh khi deploy, mang lại tốc độ phản hồi cực nhanh (gần như tức thời).

---

## 5. Trạng thái Deploy hiện tại
- **Nền tảng:** Vercel.
- **Trạng thái:** Tự động kích hoạt build và deploy khi có commit mới đẩy lên nhánh `main`.
- **Tập lệnh bỏ qua (`.vercelignore`):** Đã định cấu hình để bỏ qua các thư mục sao lưu cục bộ dạng `.nosync` do iCloud tạo ra trên máy macOS, giúp tránh lỗi không tìm thấy tệp hoặc làm tăng dung lượng thư mục build không cần thiết.

---

## 6. Chỉ dẫn cho Claude Sonnet 4.6 (Handoff Guidelines)

Khi tiếp nhận dự án này, Claude có thể thực hiện ngay các công việc sau:

1. **Quản lý Bài viết (Writing/Blog):**
   - Thêm các tệp `.md` mới vào thư mục [src/content/writing/](file:///Users/nguyenphucloc/Library/Mobile%20Documents/com~apple~CloudDocs/porfolio/src/content/writing). Schema bắt buộc phải có tiêu đề (`title`), tiêu đề phụ (`headline`), ngày xuất bản (`publishedAt`), và cờ bản nháp `draft: false` để bài viết xuất hiện ngoài trang chủ và trang blog.

2. **Quản lý Hình ảnh (Photos & Gallery):**
   - Khi thêm ảnh mới, hãy đưa tệp ảnh chất lượng cao vào [src/assets/photos/](file:///Users/nguyenphucloc/Library/Mobile%20Documents/com~apple~CloudDocs/porfolio/src/assets/photos).
   - Khai báo thông tin ảnh mới vào cơ sở dữ liệu địa danh tương ứng tại [src/lib/locations.ts](file:///Users/nguyenphucloc/Library/Mobile%20Documents/com~apple~CloudDocs/porfolio/src/lib/locations.ts) hoặc [src/content/photos/](file:///Users/nguyenphucloc/Library/Mobile%20Documents/com~apple~CloudDocs/porfolio/src/content/photos) (tùy thuộc trang sử dụng nguồn nào). Module tối ưu hóa ảnh sẽ tự động nén ảnh thô thành các định dạng tối ưu khi chạy build.

3. **Cập nhật Thông tin Dự án:**
   - Để chỉnh sửa các dự án xuất hiện ở Timeline kinh nghiệm trang chủ hoặc trang danh sách dự án `/work`, hãy truy cập [src/data/projects.ts](file:///Users/nguyenphucloc/Library/Mobile%20Documents/com~apple~CloudDocs/porfolio/src/data/projects.ts) hoặc cấu hình collections tương ứng trong [src/content/projects/](file:///Users/nguyenphucloc/Library/Mobile%20Documents/com~apple~CloudDocs/porfolio/src/content/projects).

4. **Đo lường Khả năng Tiếp cận (Accessibility & SEO):**
   - Duy trì tiêu chuẩn WCAG 2.2 AA đã cấu hình (các nút điều khiển slideshow có đầy đủ `aria-label`, thẻ `<picture>` có đầy đủ thuộc tính `alt`, cấu trúc heading rành mạch).

# HƯỚNG DẪN DÀNH CHO AI AGENT: XÂY DỰNG LAYOUT MỚI (FOUNDATION KIT)

> **Dành cho Agent tiếp nhận dự án:**  
> Bạn vừa nhận được **Starter Kit / Foundation chuẩn hóa** từ website portfolio của **Phuc Loc Nguyen (loc.digital)**.  
> Toàn bộ logic dữ liệu, kiểu gõ TypeScript, thư viện dependencies, schema Zod, component cốt lõi và nội dung văn bản đều đã được cấu hình sẵn 100%. Nhiệm vụ của bạn là **tập trung sáng tạo bố cục (layout), trải nghiệm người dùng (UX), và phong cách đồ họa (UI/Animation)** mới mà KHÔNG cần phải tự viết lại dữ liệu hay setup lại từ đầu.

---

## 1. CẤU TRÚC THƯ MỤC CỐT LÕI

```text
├── PORTFOLIO_CONTENT_BIBLE.md   # TÀI LIỆU TOÀN VĂN: Toàn bộ 100% nội dung, số liệu, case studies, bio
├── FOUNDATION_GUIDE.md          # File hướng dẫn này
├── SYSTEM_DESIGN.md             # TÀI LIỆU SYSTEM DESIGN: Toàn bộ quy chuẩn UI, typography, macOS window, tokens
├── package.json                 # Đầy đủ Astro 4.16+, React 19, Tailwind, Framer Motion, Phosphor Icons, Sharp
├── astro.config.mjs             # Cấu hình Astro (Tailwind, React, Sitemap, Vercel Image)
├── tailwind.config.mjs          # Cấu hình Tailwind (tắt preflight để không đè CSS tokens)
├── tsconfig.json                # TypeScript config
│
├── src/
│   ├── content/                 # ASTRO CONTENT COLLECTIONS (Dữ liệu đã có sẵn)
│   │   ├── config.ts            # Schema Zod chuẩn cho: projects, photos, gear, writing, pages
│   │   ├── projects/            # 5 Case studies JSON (PlayAh, WorkFlow, POPS, TOMATO, Education)
│   │   ├── gear/setup.json      # Danh mục thiết bị phần cứng, camera, phím cơ, chạy bộ
│   │   ├── photos/              # 17 File JSON nhật ký du lịch đầy đủ đánh giá & review
│   │   └── writing/             # Markdown bài viết blog
│   │
│   ├── lib/                     # CORE LIBRARIES & DATA HELPERS
│   │   ├── cms.ts               # getProjects(), getPhotoLocations(), getGear() -> Gọi là có dữ liệu!
│   │   ├── seo.ts               # Tự động render SEO metadata, Canonical URL, JSON-LD Schema
│   │   ├── utils.ts             # Helper cn() kết hợp clsx và tailwind-merge
│   │   ├── photo-assets.ts      # Xử lý tối ưu ảnh qua Sharp (AVIF/WebP)
│   │   └── writing.ts           # Helper lấy danh sách bài viết blog
│   │
│   ├── data/
│   │   └── instagram-workflowspace.json # Dữ liệu 124 bài post Instagram của WorkFlow Space
│   │
│   ├── components/ui/           # CÁC COMPONENT ĐẶC TRƯNG CÓ SẴN
│   │   ├── BeforeAfterPerformance.tsx # Thanh trượt so sánh Before/After kết quả chiến dịch
│   │   ├── ShowcasePassGate.astro     # Hộp nhập mã khóa bảo mật xem tài liệu nội bộ
│   │   ├── BrandPositioningFeed.astro # Grid hiển thị feed ảnh Instagram 4:5
│   │   ├── BlurFade.astro             # Hiệu ứng làm mờ dần khi xuất hiện
│   │   ├── BlurText.astro             # Hiệu ứng gõ chữ / hiện chữ mượt mà
│   │   └── CursorAvatar.tsx           # Avatar phản xạ mắt theo con trỏ chuột
│   │
│   ├── styles/
│   │   └── global.css           # Toàn bộ CSS variables, màu sắc, typography tokens, keyframes
│   │
│   ├── layouts/
│   │   └── Layout.astro         # Layout bao ngoài chuẩn SEO, ViewTransitions, Favicon động
│   │
│   ├── pages/
│   │   └── index.astro          # TRANG CHỦ MẪU: Đã nạp sẵn dữ liệu, sẵn sàng để bạn dựng layout mới!
│   │

```

---

## 2. CÁCH LẤY DỮ LIỆU ĐỂ RENDER GIAO DIỆN (CỰC KỲ ĐƠN GIẢN)

Agent mới **không cần viết lại hàm truy vấn dữ liệu**, chỉ cần import từ `src/lib/cms`:

```astro
---
import Layout from "../layouts/Layout.astro";
import { getProjects, getPhotoLocations, getGear } from "../lib/cms";
import { getWritingPosts } from "../lib/writing";

// 1. Lấy danh sách Case studies (PlayAh, WorkFlow Space, POPS, TOMATO, Education):
const projects = await getProjects();

// 2. Lấy 17 địa danh nhật ký du lịch:
const photoLocations = await getPhotoLocations();

// 3. Lấy kho thiết bị gear setup:
const gear = await getGear();

// 4. Lấy danh sách bài viết blog:
const posts = await getWritingPosts();
---

<Layout title="Trang của bạn">
  <!-- Dựng giao diện mới tại đây -->
</Layout>
```

---

## 3. CÁC TÍNH NĂNG VÀ NỘI DUNG CHÍNH CẦN XÂY DỰNG

Khi "vibe" một layout mới (ví dụ: **Bento Grid**, **Interactive Dashboard**, **Minimalist Luxury**, **Brutalism**, v.v.), hãy mở file `PORTFOLIO_CONTENT_BIBLE.md` để lấy trọn vẹn:
1. **Hero & Tagline:** *"Design Better. Market Smarter. Scale Faster."* — Kết nối Paid Media + TikTok Shop + AI Funnels.
2. **Kinh nghiệm & Dòng thời gian:** 8 vị trí tại WorkFlow Space, PlayAh!, POPS, TOMATO, Đi Làm Đừng Đi Lầm,...
3. **5 Case Studies:**
   - PlayAh: Doanh thu 1+ tỷ/tháng, tăng trưởng 10x, ROAS > 10.
   - WorkFlow Space: 5.000+ booking, 2.000+ leads, 4M+ impressions.
   - POPS Worldwide: 2.5M MAU (10x), 400k POPS Kids.
   - TOMATO Children's Home: Tăng 3x nhập học, giảm 60% CPL, 40k email contacts.
   - Đại Học Đừng Học Đại: 4M+ thành viên cộng đồng.
4. **6 Gói Dịch Vụ & Bảng Giá:** Retainer hàng tháng ($2,490 – $12,500) hoặc trọn gói dự án.
5. **10 Chứng chỉ Google:** Search, Display, Video, GA4, Measurement, E-commerce,...
6. **Kho Thiết Bị & Xe Cộ:** M4 Max, Leica Q3, Nikon Zf, phím cơ, xe đạp Canyon Gravel.
7. **17 Album Du Lịch:** Đầy đủ câu chuyện trải nghiệm, ẩm thực và đánh giá cá nhân.

---

## 4. LỆNH CHẠY DỰ ÁN

```bash
# 1. Cài đặt dependencies (khuyến nghị pnpm hoặc npm)
pnpm install

# 2. Khởi chạy dev server
pnpm dev

# 3. Build kiểm tra lỗi
pnpm build
```

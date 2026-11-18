# PROMPT V2 — Physical Instax / Polaroid Flip Motion (Astro)

## Bối cảnh
Website ảnh cá nhân của tôi được xây bằng **Astro**. Tôi muốn người xem có thể nhấp trực tiếp lên một tấm ảnh trong gallery để **lật tấm ảnh theo trục Y (3D)** giống một tấm Instax/Polaroid thật. Phía trước hiển thị **ảnh gốc**, phía sau hiển thị **câu chuyện, tên ảnh, thời gian và địa điểm chụp**. Mặt sau mang ngôn ngữ **pixel art / 8-bit retro game**, tinh tế, không biến cả website thành game.

Tôi có sẵn file HTML prototype: `flip-polaroid-physical-motion.html`. **Đọc và dùng nó làm visual/interaction reference**, nhưng tích hợp vào codebase hiện tại theo cấu trúc dự án, component và dữ liệu thật. Không thay thế website bằng demo, không ghi đè các style dùng chung hoặc phá vỡ layout sẵn có.

## Visual direction

- Mặt trước: khung ảnh Instax/Polaroid màu trắng ngà, khoảng trắng phía dưới lớn hơn 3 cạnh còn lại; hình được crop bằng `object-fit: cover` nhưng cần tôn trọng composition/crop của gallery. Có thể đặt tên ảnh nhỏ và mã ảnh ở chân tấm hình.
- Mặt sau: bảng lưu bút retro-game, nền giấy kem `#F6ECD8`, outline mực tím than `#38344F`, hồng phấn `#EF92A2`, xanh sage `#859F83`, vàng pastel `#E5BD75`. Viền vuông kiểu pixel, block shadow 3–4px, họa tiết checkerboard 8-bit, camera icon pixel tạo bằng inline SVG. Không dùng gradient hiện đại, blur/glassmorphism ở mặt sau.
- Typography: `Pixelify Sans` cho heading/label ngắn, `Be Vietnam Pro` cho đoạn truyện tiếng Việt dễ đọc; có font fallback nếu không tải được font. Không để font pixel hiển thị chữ tiếng Việt bị lỗi glyph.
- Nội dung mặt sau: nhãn `MEMORY ARCHIVE`, mã số ảnh, tên ảnh lớn nhất, vùng metadata gồm `DATE`, `TIME`, `PLACE`, `FRAME`, rồi `THE STORY` và paragraph câu chuyện. Chỉ hiển thị thông tin **thật từ CMS / EXIF khi có**; thiếu dữ liệu thì dùng “Chưa cập nhật” hoặc ẩn field, tuyệt đối không tự bịa ngày/giờ/địa điểm.
- Giữ tổng thể rất minimal, editorial, nhiều khoảng thở. Mặt trước cần nhìn như ảnh chụp thật, pixel art chỉ xuất hiện ở mặt sau.

## Interaction spec (bắt buộc)

1. Mặc định là mặt trước. `click/tap` lật sang mặt sau, click lần nữa quay về mặt trước. Flip KHÔNG xảy ra khi hover.
2. Dùng `perspective: 1350px`, `transform-style: preserve-3d`, `backface-visibility: hidden`; mặt trước và sau là 2 physical faces của **cùng một thẻ giấy**. Mặt sau `rotateY(180deg)`; không render 2 card riêng lẻ hoặc swap visibility đột ngột.
3. **Physical motion timeline 980ms**, không được thay bằng `transition: rotateY(180deg) 800ms` đơn thuần. Kết hợp `translate3d`, `rotateZ`, `rotateY` với keyframe offsets: đầu tiên lift nhẹ, giữa xoay nhanh và được nâng cao nhất, cuối hạ xuống và settle. Ở thời điểm 94% cho phép overshoot rất nhỏ 1° (`rotateY(181deg)`), sau đó về đúng 180°. Không nảy mạnh, không spring cartoon.
4. **Dynamic shadow** phải là lớp riêng nằm phía sau tấm ảnh, KHÔNG xoay theo mặt ảnh: khi nhấc lên thì shadow mờ hơn, lan rộng hơn; khi hạ xuống thì bóng co lại. Một subtle travelling highlight/shimmer theo góc lật, không glow quá mức, không glassmorphism trên mặt sau pixel art.
5. Dùng Web Animations API (`element.animate`) cho 3 track có chung timeline: paper transform, shadow transform/opacity và highlight transform/opacity. **Click liên tiếp trong lúc đang lật phải reverse animation từ currentTime hiện tại** (đổi playback direction qua `.reverse()`), không reset về frame 0, không double-trigger. CSS transform transition là fallback nếu không hỗ trợ WAAPI.
6. Hover trên desktop chỉ nâng card khoảng 3px; không tự động flip, không nghiêng theo con trỏ gây chóng mặt. Có `:focus-visible`; `Enter/Space` kích hoạt qua `<button>`, `aria-pressed` cập nhật theo state.
7. Khi flip, tuyệt đối không đổi kích thước thẻ, không layout shift; có `prefers-reduced-motion` tắt animation. Tối ưu GPU để không nháy/giật trên Safari iOS.
8. Mobile: card responsive, vùng bấm đủ lớn, thao tác tap hoạt động, không phụ thuộc hover. Với đoạn story dài, ưu tiên giới hạn nội dung và scroll nội bộ có kiểm soát (hoặc mở modal đọc đầy đủ nếu sản phẩm hiện có hỗ trợ); không để text tràn hoặc bị cắt vô lý.
9. Với nhiều ảnh trong gallery, trạng thái flip của mỗi ảnh phải độc lập. Khi đổi route/filter/pagination, giữ trạng thái hợp lý và tránh duplicate listeners; nếu có Astro View Transitions, khởi tạo theo `astro:page-load` hoặc component lifecycle tương ứng.
10. Nếu gallery hiện có cơ chế click để mở lightbox, hãy thiết kế cơ chế không xung đột. Mặc định ưu tiên click lên tấm Polaroid để flip; cung cấp nút/icon xem ảnh lớn tách biệt nếu cần và không lồng button trong button.

## Kỹ thuật tích hợp

- Tạo component tái sử dụng `PixelFlipPhoto.astro` (hoặc tên nhất quán với repo) với props: `{ id, imageUrl, alt, title, story, capturedAt?, location?, photoNumber? }`.
- Chấp nhận ngày/giờ dưới dạng dữ liệu thực, format theo `vi-VN` và timezone hợp lý. Không lấy thời gian render hiện tại làm thời gian chụp.
- Với dữ liệu từ Notion/Places CMS, map đúng field hiện tại; nếu schema chưa có `story` hay `capturedAt`, chỉ ra những field thiếu và thêm fallback an toàn, không phá schema/API hiện tại.
- Hạn chế dependencies, ưu tiên CSS native + Web Animations API với JS nhẹ. Không thêm GSAP, Framer Motion, thư viện 3D/canvas cho thao tác đơn giản.
- Tối ưu compositor: animate chủ yếu `transform` và `opacity`; chỉ dùng `will-change` lúc đang chạy, bỏ sau khi finished; `prefers-reduced-motion` phải **lật tức thì** không có translate/lift/shadow animation. Tắt WAAPI đúng cách khi hệ điều hành thay đổi setting giữa phiên.
- Cần đảm bảo `-webkit-backface-visibility: hidden`, `translateZ(.2px)` cho faces để không nhấp nháy/iOS Safari; shadow tuyệt đối không làm trang layout shift.
- Nếu animation bị đảo chiều liên tục, paper/shadow/highlight phải giữ cùng thời điểm, tránh face hoặc shadow chạy lệch nhịp.
- Scoped CSS để không tác động tới card/gallery khác; giữ nguyên SEO, image loading, image alt, responsive breakpoint, Astro integration.
- Tách data khỏi UI: nhận props/CMS, không hardcode demo story trong production.

## Acceptance criteria

- [ ] Desktop và mobile: click ảnh => flip sang mặt sau => click lần nữa trở về; 3D đúng hướng.
- [ ] Quan sát motion ở 0ms / 150ms / 500ms / 800ms / 980ms: có lift, twist, dynamic shadow, soft landing, không khựng giữa 90°.
- [ ] Test nhấp liên tiếp ở khoảng 200–400ms: reverse mượt từ cùng góc đang quay, không restart/teleport.
- [ ] Mặt trước giữ ảnh gốc và khung Instax/Polaroid.
- [ ] Mặt sau thể hiện rõ design pixel art, text đọc được ở kích thước điện thoại.
- [ ] Tên ảnh, câu chuyện, ngày/giờ, địa điểm được truyền bằng props từ dữ liệu thật.
- [ ] Không có layout shift, text overflow, ảnh méo, double-trigger hay xung đột lightbox.
- [ ] Tab, Enter, Space, focus ring, reduced motion và `aria-pressed` hoạt động.
- [ ] Test build/typecheck hiện có; không làm ảnh hưởng các trang, component khác.

## Output yêu cầu

1. Triển khai trực tiếp vào gallery/site hiện tại theo Astro component.
2. Liệt kê các file đã thay đổi, cách mapping props từ CMS và fallback dữ liệu thiếu.
3. Chụp/kiểm tra ở mobile 375px và desktop 1440px. Kiểm tra flip xuôi, flip ngược, rapid click, `reduced-motion`, Safari/iOS nếu có môi trường.
4. Không thay đổi visual của mặt trước hoặc phong cách pixel-art mặt sau, trừ chỉnh sửa bắt buộc để motion hoạt động. Không vô tình làm mất xử lý CMS, lightbox và điều hướng ảnh.
5. Không trả lời chỉ bằng kế hoạch: **hãy code và kiểm tra chạy thực tế**.

## Motion reference — trích từ demo v2

Kịch bản `instant-card__rotator` (timeline normalized):

| Offset | Transform mong muốn | Ý nghĩa vật lý |
|---|---|---|
| 0% | Y 0°, Z 0°, Z-depth 0px | Ảnh nằm yên |
| 14% | Y 8°, Z -2.2°, translateY -8px, translateZ 16px | Ngón tay vừa nhấc mép |
| 37% | Y 62°, Z -3°, translateY -17px, translateZ 32px | Giấy bắt đầu quay nhanh |
| 53% | Y 102°, Z -1.5°, translateY -22px, translateZ 42px | Cạnh giấy lướt ngang, shadow rộng nhất |
| 79% | Y 166°, Z 1°, translateY -12px, translateZ 24px | Hạ dần |
| 94% | Y 181°, Z 0.3°, translateY -2px, translateZ 4px | Quán tính rất nhỏ |
| 100% | Y 180°, Z 0°, translate 0 | Nằm ổn định, hiển thị mặt sau |

Tất cả timeline phải dùng easing theo từng pha, không `linear` thô cho toàn bộ hành trình. WAAPI có thể đặt `easing` riêng trên từng keyframe. Timeline shadow và light phải gắn cùng `currentTime`, khi `.reverse()` thì đồng bộ. Cần kiểm tra fallback CSS nếu browser không có WAAPI.

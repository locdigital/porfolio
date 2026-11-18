# THUMBNAIL STYLE — CINEMATIC BLACK & YELLOW

> **Reusable agent specification / prompt**  
> Mục đích: Khi người dùng cung cấp ảnh gốc (hoặc cả thư mục ảnh), tự tạo thumbnail travel/documentary mang phong cách ảnh tham chiếu: ảnh điện ảnh, tương phản rõ, typography đậm, hai thanh tiêu đề **đen / vàng**, nhãn số tập góc trên trái và nhãn thời lượng góc dưới phải.  
> **Ưu tiên:** giữ nguyên câu chuyện, nhân vật, cảnh vật và độ chân thực của ảnh gốc; không biến ảnh tài liệu thành cảnh hư cấu nếu không được yêu cầu.

## 1. Đầu vào và đầu ra

### Input

- `source_image`: đường dẫn một ảnh JPG/PNG/WEBP (bắt buộc).
- `title`: tiêu đề tiếng Việt, ưu tiên 2–6 từ, có thể xuống 2 dòng (bắt buộc nếu cần hiển thị chữ).
- `episode`: số tập / số ảnh, ví dụ `138` (tùy chọn; không cung cấp thì ẩn nhãn).
- `duration`: thời lượng, ví dụ `15:20` (tùy chọn; không cung cấp thì ẩn nhãn, **không tự bịa**).
- `output`: đường dẫn xuất kết quả, ví dụ `output/thumbnail_001.png`.
- `reference_image`: ảnh tham chiếu phong cách, nếu có.
- `mode`: `faithful` (mặc định) hoặc `creative` (chỉ khi người dùng cho phép thay đổi cảnh/ánh sáng mạnh).

### Output

1. Ảnh final **1920 × 1080 px** (16:9), PNG hoặc JPG chất lượng cao.
2. File thiết kế có thể chỉnh sửa (SVG / HTML+CSS / PSD nếu công cụ hỗ trợ) chứa các lớp chữ riêng.
3. Có thể xuất thêm bản **không có chữ** để tái sử dụng.
4. Không thêm logo/watermark khi người dùng không yêu cầu.

## 2. Phong cách thị giác

**Keywords:** cinematic travel documentary, editorial thumbnail, bold typographic hierarchy, high contrast, warm natural golden-hour when appropriate, premium but punchy, readable at mobile size.

**Ảnh gốc và chủ thể**

- Ảnh người phụ nữ vùng cao cầm hoa là ví dụ: nhân vật chiếm trọng tâm khung hình, đường núi và cây xanh kể câu chuyện phía sau.
- Giữ đúng gương mặt, trang phục, tư thế, vật cầm tay, bối cảnh và các chi tiết mang ý nghĩa văn hóa. Không tùy tiện thay phục trang dân tộc, nét mặt hay tạo vật thể mới.
- **Faithful mode:** ưu tiên chỉnh màu/ánh sáng/crop từ ảnh thực; không tự tạo hoàng hôn, núi, sương, đường cong nếu trong ảnh không có. Không làm da nhựa, HDR quá tay, halo quanh người hay bầu trời giả.
- **Creative mode:** được thay đổi mood điện ảnh theo yêu cầu, nhưng cần hiểu rằng ảnh đầu ra là hình minh họa/chỉnh sửa, không còn là ảnh tài liệu nguyên bản.
- Subject separation bằng ánh sáng cục bộ vừa phải; giữ texture tự nhiên, bóng đổ logic.

**Màu sắc**

| Vai trò | Màu | HEX |
|---|---|---|
| Headline banner tối | Đen gần tuyệt đối | `#070707` |
| Headline banner sáng | Vàng hổ phách | `#FFC400` |
| Chữ trên banner tối | Vàng | `#FFC400` |
| Chữ trên banner sáng | Đen | `#070707` |
| Chữ nhãn góc | Trắng | `#FFFFFF` |
| Nền nhãn góc | Đen | `#050505` |

Chỉnh ảnh theo bối cảnh thực tế, không ép ảnh nào cũng thành màu cam hoàng hôn. Gợi ý xử lý: contrast nhẹ–vừa, blacks sâu nhưng không mất chi tiết, highlights kiểm soát, da tự nhiên, màu xanh bớt chói khi cần.

## 3. Layout chuẩn 16:9

Tất cả thông số dưới đây tính theo canvas **1920 × 1080**, được phép scale theo kích thước khác.

### Safe zones

- Safe margin bốn cạnh: **48–72 px**.
- Tiêu đề nằm **vùng dưới bên trái**, không đè lên mắt/mặt hay chi tiết chủ đạo.
- Ưu tiên đặt chủ thể trong khoảng **48–75% chiều ngang** (phần giữa đến phải), giữ khoảng trống bên trái cho chữ. Nếu ảnh gốc không hỗ trợ bố cục này, cho phép dời headline hoặc làm nhỏ chữ thay vì crop hỏng chủ thể.
- Không để nhãn và chữ chạm viền ảnh.

### A. Episode badge — góc trái trên

- Vị trí mặc định: `x=32`, `y=26`.
- Nền đen `#050505`, bo góc 10–14 px.
- Padding: 14–20 px ngang / 6–12 px dọc.
- Text trắng, font sans-serif **ExtraBold/Black**, cỡ ~64 px, line-height 1.
- Badge co giãn theo số chữ số; không cố định độ rộng nếu bị tràn.
- Ẩn nếu `episode` không được nhập.

### B. Headline — góc trái dưới

Ví dụ:

```text
┌─────────────────┐
│   NÉT ĐẸP       │  nền đen / chữ vàng
└─────────────────┘
┌───────────────────────┐
│      VÙNG CAO         │  nền vàng / chữ đen
└───────────────────────┘
```

- Ưu tiên 2 dòng, chữ **UPPERCASE**, sans-serif nặng **800–900**.
- Font gợi ý: `Be Vietnam Pro ExtraBold` hoặc `Montserrat ExtraBold` (phải hỗ trợ tiếng Việt và dấu đầy đủ).
- Font-size tham khảo: **82–112 px** trên canvas 1920 px, tùy số lượng ký tự.
- Line-height: `0.98–1.08`; letter-spacing: `-0.02em` đến `0`.
- Padding mỗi block: **24–38 px ngang**, **12–24 px dọc**.
- Hai block có thể lệch chiều rộng; tạo hiệu ứng *staggered editorial strips*.
- Khoảng cách giữa 2 block: `0–8 px`, ưu tiên sát nhau.
- Block 1: nền đen, chữ vàng. Block 2: nền vàng, chữ đen.
- Giữ headline trong vùng `x≈56–760`, `y≈620–970` **tùy nội dung và bố cục**; tránh che tay, bó hoa, gương mặt.
- Có thể thêm gradient tối rất nhẹ phía dưới ảnh để dễ đọc chữ, nhưng hai banner phải tự đảm bảo độ tương phản.
- Phải giữ **đúng chính tả và dấu tiếng Việt**; không thay đổi câu chữ do model tạo ảnh tự diễn giải.

### C. Duration badge — góc phải dưới

- Vị trí: cách mép phải ~32 px, mép dưới ~30 px.
- Nền đen, bo 10–14 px; chữ trắng đậm, size khoảng 42–52 px.
- Padding 12–18 px ngang, 6–10 px dọc.
- Hiển thị đúng chuỗi `duration`, ví dụ `15:20`.
- Ẩn nếu người dùng không cung cấp thời lượng.

## 4. Typography & xử lý tiếng Việt

- Luôn ưu tiên **render chữ bằng SVG/HTML Canvas/Pillow/Sharp** ở lớp cuối thay vì yêu cầu image model tự vẽ chữ; cách này giúp đảm bảo đúng ký tự tiếng Việt, độ sắc nét, dễ sửa tiêu đề.
- Font fallback: `Be Vietnam Pro`, `Montserrat`, `Arial`, `sans-serif` (kiểm tra hỗ trợ glyph thực tế).
- Không kéo giãn chữ theo trục X/Y. Không để tràn khỏi banner, cắt dấu, xuống dòng từng chữ hay mất dấu.
- Thu nhỏ font theo ngưỡng tối thiểu khoảng 64 px trên canvas 1920; nếu vẫn dài, tách dòng hợp nghĩa hoặc đề xuất tiêu đề ngắn hơn.
- Chỉ in hoa headline; nhãn thời lượng giữ nguyên.

## 5. Workflow cho agent

1. **Inspect:** đọc kích thước, hướng ảnh, xác định người/vật chính, khoảng trống và các chi tiết không được che.
2. **Choose crop:** tạo canvas 16:9 bằng crop thông minh. Nếu ảnh chân dung quá hẹp, mở rộng nền bằng cách lấp vùng mờ/tông màu trung tính hoặc chỉ tạo nền mới khi được phép; không kéo giãn người.
3. **Color grade:** tạo tương phản điện ảnh nhưng giữ nhận diện ảnh. Chỉ thêm ánh sáng vàng khi có ánh sáng tương thích hoặc mode creative được cho phép.
4. **Place subject:** không cắt đỉnh đầu, bàn tay, bó hoa và các vật quan trọng. Hạn chế đặt chữ lên mặt.
5. **Render text overlay:** tạo badge trên trái → 2 headline strips → nhãn thời lượng phải dưới. Tất cả chữ phải là layer rõ nét.
6. **Validate:** kiểm tra không tràn khung, không mất dấu, đọc được ở kích thước xem trước 320×180, không che mắt và không có chi tiết giả ngoài ý muốn.
7. **Export:** lưu `thumbnail.png`, `thumbnail_clean.png` và file layers nếu khả thi.

### Batch processing

Với một thư mục ảnh:

- Mỗi ảnh tạo một file final riêng.
- Đọc metadata từ `manifest.csv` / `manifest.json` nếu có, với các trường: `filename,title,episode,duration,mode`.
- Nếu thiếu `title`: **không tự khẳng định địa danh hay câu chuyện không thể suy ra từ ảnh**. Có thể sinh tiêu đề gợi ý rồi yêu cầu người dùng duyệt, hoặc xuất ảnh chưa có title.
- Nếu thiếu `episode` hay `duration`: ẩn tương ứng.
- Giữ thiết kế nhất quán giữa các thumbnail trong loạt ảnh; chọn bố cục linh hoạt theo từng chủ thể.

## 6. Acceptance criteria / QA checklist

- [ ] Đầu ra đúng tỷ lệ **16:9**, tối thiểu 1280 × 720, ưu tiên 1920 × 1080.
- [ ] Nhân vật chính vẫn nhận diện đúng từ source.
- [ ] Không làm hỏng trang phục/vật thể/bối cảnh quan trọng.
- [ ] Chữ vàng trên đen, chữ đen trên vàng; headline 2 khối đậm.
- [ ] Tiếng Việt đúng 100% dấu, chính tả.
- [ ] Nhãn số tập và thời lượng đúng dữ liệu đầu vào; thiếu thì ẩn.
- [ ] Xem thu nhỏ vẫn đọc được chữ; headline không che mặt.
- [ ] Không watermark hoặc logo tự phát sinh.
- [ ] Có bản final và, nếu hỗ trợ, bản editable.

## 7. Prompt để giao trực tiếp cho image agent

```text
ROLE: Bạn là Senior Visual Designer chuyên thumbnail YouTube travel documentary.

INPUT:
- Source image: {{source_image}}
- Reference style: {{reference_image_optional}}
- Title: {{title}}
- Episode: {{episode_optional}}
- Duration: {{duration_optional}}
- Mode: {{mode | default: faithful}}

TASK:
Tạo thumbnail 1920x1080 phong cách cinematic travel documentary. Dùng ảnh nguồn làm nội dung chính. Ưu tiên trung thực với nhân vật, trang phục, nét mặt, bố cục và bối cảnh ảnh thật. Tăng chiều sâu bằng chỉnh tương phản, ánh sáng và màu sắc vừa phải. Không tự thêm sunset hay cảnh khác trong faithful mode.

LAYOUT:
- Chủ thể nổi bật, ưu tiên phần giữa/phải để chừa negative space bên trái nếu ảnh phù hợp.
- Góc trái trên: episode badge nền đen, chữ trắng cực đậm; chỉ hiển thị nếu có số tập.
- Dưới bên trái: headline IN HOA chia 2 block hơi lệch chiều dài; block 1 nền đen chữ vàng #FFC400, block 2 nền vàng #FFC400 chữ đen. Sans-serif ExtraBold, tương phản tối đa, rõ khi thu nhỏ.
- Góc dưới phải: duration badge nền đen, chữ trắng; chỉ hiển thị khi có dữ liệu.
- Dùng typography overlay thực tế (SVG/HTML/Pillow/Sharp) sau khi tạo/hiệu chỉnh ảnh để đảm bảo chữ tiếng Việt chính xác tuyệt đối.

CONTENT INTEGRITY:
- Giữ chính xác title / episode / duration người dùng nhập.
- Không bịa số tập, thời lượng, địa danh, nhân vật hay chi tiết câu chuyện.
- Không che gương mặt hoặc các vật thể trọng tâm.

OUTPUT:
- thumbnail.png (1920x1080)
- thumbnail_clean.png (nếu khả thi)
- thumbnail.svg hoặc HTML+CSS layers (nếu khả thi)
- Kiểm tra thumbnail ở kích thước 320x180 trước khi hoàn thành.
```

## 8. Example manifest

```csv
filename,title,episode,duration,mode
woman_mountain.jpg,NÉT ĐẸP | VÙNG CAO,138,15:20,faithful
mountain_road.jpg,CON ĐƯỜNG | PHÍA TRƯỚC,,,faithful
```

Dấu `|` trong `title` chỉ ranh giới hai dòng và **không in ra trên ảnh**.

---

**Nguyên tắc quan trọng nhất:** *Giữ câu chuyện của ảnh gốc, tái sử dụng ngôn ngữ thiết kế của thumbnail mẫu.* Ảnh tham chiếu là chuẩn **layout và typography**, không phải yêu cầu áp cùng một cảnh hoàng hôn hoặc bối cảnh hư cấu lên mọi bức ảnh.

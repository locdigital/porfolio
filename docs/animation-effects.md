# Tổng hợp các Hiệu ứng Chuyển động (Animations & Transitions) trên Website

Dưới đây là tài liệu chi tiết về các hiệu ứng chuyển động đang được sử dụng trên website của bạn. Các hiệu ứng này kết hợp hài hòa giữa **CSS Transitions/Animations** và **JavaScript (Intersection Observer / requestAnimationFrame)** để tạo cảm giác mượt mà, cao cấp (premium feel).

---

## 1. Hiệu ứng Load Trang Mượt mà (Page Load Entrance / Refresh)
Khi truy cập trang web, toàn bộ nội dung `body` sẽ hiển thị với hiệu ứng mờ dần và trượt nhẹ từ dưới lên.

### Cách hoạt động:
* **CSS ban đầu (`body`):** Ẩn (`opacity: 0`) và dịch chuyển xuống 16px (`translateY(16px)`).
* **CSS khi sẵn sàng (`body.ready`):** Hiện rõ (`opacity: 1`) và trở về vị trí ban đầu (`translateY(0)`).
* **Kích hoạt:** Một đoạn JS nhỏ lắng nghe sự kiện `DOMContentLoaded` để thêm class `ready` vào `body`.

### Mã nguồn:
```css
/* src/styles/global.css */
body {
  opacity: 0;
  transform: translateY(16px);
  transition: opacity 1.1s var(--ease-out), transform 1.1s var(--ease-out);
}

body.ready {
  opacity: 1;
  transform: translateY(0);
}
```

```javascript
// src/layouts/Layout.astro (phần script)
window.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('ready');
});
```

---

## 2. Hiệu ứng Xuất hiện dạng Co giãn & Làm mờ (Toki Stretched Reveal)
Ban đầu, các thành phần khi tải trang hoặc cuộn trang sẽ sử dụng hiệu ứng này. Hiện tại hiệu ứng này đã được áp dụng thống nhất cho toàn bộ website (bao gồm cả class `.r` thông thường và `.toki-r`).

### Cách hoạt động:
* Sử dụng **Intersection Observer API** để phát hiện khi phần tử bắt đầu đi vào khung hình (viewport).
* Khi phần tử chưa vào khung hình, nó sẽ bị ẩn (`opacity: 0`), kéo giãn nhẹ theo chiều dọc (`scaleY(1.08)`), dịch xuống 24px và làm mờ (`blur(8px)`).
* Khi vào tầm mắt, thêm class `.in` để phần tử trở về kích thước chuẩn (`scaleY(1)`), rõ nét (`blur(0)`) và trượt lên bằng một hàm transition cực kỳ mượt mà (`cubic-bezier(0.4, 0, 0.2, 1)`).
* Hỗ trợ hiệu ứng hiển thị so le (staggered delay) bằng thuộc tính `data-d` từ 1 đến 7.

### Mã nguồn:
```css
/* src/styles/global.css */
.r,
.toki-r {
  opacity: 0;
  transform: translateY(24px) scaleY(1.08);
  filter: blur(8px);
  transition: opacity 1s cubic-bezier(0.4, 0, 0.2, 1),
              transform 1s cubic-bezier(0.4, 0, 0.2, 1),
              filter 1s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform, opacity, filter;
}

.r.in,
.toki-r.in {
  opacity: 1;
  transform: translateY(0) scaleY(1);
  filter: blur(0);
}

/* Delay so le kiểu Toki */
.r[data-d="1"], .toki-r[data-d="1"] { transition-delay: 50ms; }
.r[data-d="2"], .toki-r[data-d="2"] { transition-delay: 125ms; }
.r[data-d="3"], .toki-r[data-d="3"] { transition-delay: 200ms; }
.r[data-d="4"], .toki-r[data-d="4"] { transition-delay: 275ms; }
.r[data-d="5"], .toki-r[data-d="5"] { transition-delay: 350ms; }
.r[data-d="6"], .toki-r[data-d="6"] { transition-delay: 425ms; }
.r[data-d="7"], .toki-r[data-d="7"] { transition-delay: 500ms; }
```

```javascript
// src/layouts/Layout.astro
const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { 
      e.target.classList.add('in'); 
      io.unobserve(e.target); // Chỉ chạy một lần
    }
  });
}, { threshold: 0.07, rootMargin: '0px 0px -36px 0px' });

document.querySelectorAll('.r, .toki-r').forEach(el => io.observe(el));
```

---

## 4. Hiệu ứng Chữ Bay/Bập bềnh ở Hero (Hero Floating Text)
Các từ chính trong dòng tiêu đề Hero (`Performance.`, `Strategy.`, `Scaling revenue`) tự động dao động lên xuống nhẹ nhàng để tạo sự sinh động.

### Cách hoạt động:
* Sử dụng CSS `@keyframes` lặp vô tận (`infinite`) kết hợp hàm thời gian `ease-in-out` để chuyển động trông tự nhiên như đang nổi trên mặt nước.
* Các dòng có thời gian chạy (`animation-duration`) và độ trễ (`animation-delay`) lệch nhau một chút để tránh chuyển động đồng bộ gây nhàm chán.

### Mã nguồn:
```css
/* src/styles/global.css */
.hero-line.floating {
  animation: hfloat 5.2s ease-in-out infinite;
}

.hero-line-2.floating {
  animation-duration: 4.5s;
  animation-delay: .6s;
}

.hero-line-3.floating,
.hero-line-4.floating {
  animation-name: hfloatW;
  animation-duration: 5.7s;
  animation-delay: 1.1s;
}

@keyframes hfloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-7px); }
}

@keyframes hfloatW {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
}
```

---

## 5. Hiệu ứng Làm mờ xung quanh khi Hover (Work List Hover Blur)
Khi di chuột vào một dự án bất kỳ trong danh sách `/work`, dự án đó sẽ nổi bật lên còn tất cả các dự án khác sẽ bị mờ đi và giảm độ hiển thị.

### Cách hoạt động:
* CSS Selector thông minh: Khi hover vào container `.project-list`, ta chọn tất cả các dòng `.project-row` **ngoại trừ** dòng đang được hover (`:not(:hover)`).

### Mã nguồn:
```css
/* src/pages/work/index.astro */
.project-row {
  transition: opacity 0.4s ease, filter 0.4s ease;
}

/* Khi di chuột vào danh sách, những dòng KHÔNG được hover sẽ bị mờ đi */
.project-list:hover .project-row:not(:hover) {
  opacity: 0.35;
  filter: blur(3px);
}
```

---

## 6. Hiệu ứng Zoom & Shadow khi Hover Thẻ Dự án
Hiệu ứng tương tác trực quan cao khi di chuột vào hình ảnh đại diện dự án.

### Cách hoạt động:
* Thẻ hình ảnh (`.project-card-img`) sẽ phóng to nhẹ (`scale(1.02)`) và đổ một bóng đổ lớn mềm mại (`box-shadow`).
* Hình ảnh logo bên trong (`.card-logo`) cũng được phóng to thêm (`scale(1.05)`) để tạo hiệu ứng chiều sâu (parallax nhẹ).
* Lớp phủ tối (`.card-overlay`) hiện ra cùng chữ CTA "View project →" trượt nhẹ từ dưới lên.

### Mã nguồn:
```css
/* src/pages/work/index.astro */
.project-card-img {
  transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.5s ease;
}

.project-card-link:hover .project-card-img {
  transform: scale(1.02);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.12);
}

.card-logo {
  transition: transform 0.5s ease;
}

.project-card-link:hover .card-logo {
  transform: scale(1.05);
}

.card-cta {
  opacity: 0;
  transform: translateY(8px);
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.project-card-link:hover .card-cta {
  opacity: 1;
  transform: translateY(0);
}
```

---

## 7. Hiệu ứng Thư viện Ảnh Tự chạy & Kéo thả chuột (Gallery Infinite Scroll & Drag-to-Scroll)
Thư viện ảnh ở trang chủ có hiệu ứng chạy vô tận (Marquee), đồng thời cho phép người dùng kéo thả chuột để cuộn và tự động tạm dừng khi di chuột qua.

### Cách hoạt động:
* **Tự động chạy:** Sử dụng `requestAnimationFrame` trong JS để liên tục cộng dồn thuộc tính `scrollLeft`. Khi cuộn hết 1 nửa danh sách (ảnh đã được nhân đôi), nó sẽ tự động reset về vị trí cũ mà không bị giật lag.
* **Kéo thả chuột:** Lắng nghe sự kiện `mousedown`, `mousemove`, `mouseup` để cập nhật `scrollLeft` theo chuyển động chuột, kèm theo hiệu ứng trượt quán tính (momentum glide).
* **Tự dừng khi hover:** Lắng nghe sự kiện `mouseenter`/`mouseleave` hoặc `touchstart`/`touchend` để tạm dừng vòng lặp tự chạy.

---

## 8. Hiệu ứng Gõ chữ Hero (Typed.js)
Dòng chữ `with data.`, `with automation.`, `with ads.` được gõ tự động và lặp lại liên tục.

### Cách hoạt động:
* Sử dụng thư viện ngoài **Typed.js** được tích hợp qua CDN.
* Cấu hình tốc độ gõ (`typeSpeed`), tốc độ xóa (`backSpeed`) và thời gian chờ (`backDelay`).

### Mã nguồn:
```html
<!-- src/pages/index.astro -->
<script defer src="https://unpkg.com/typed.js@2.1.0/dist/typed.umd.js"></script>
<script is:inline>
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      new Typed('#typed-text', {
        strings: ['data.', 'automation.', 'ads.'],
        typeSpeed: 55,
        backSpeed: 35,
        backDelay: 2500,
        loop: true,
        cursorChar: '|',
      });
    }, 1100);
  });
</script>
```

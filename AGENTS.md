# Project Notes

- Typography preference: keep article/body copy compact, around `14px` when appropriate.
- Body copy should use Plus Jakarta Sans via `var(--sans)`.
- Headline and heading typography should use Imbue via `var(--serif)`.
- Border-radius preference: strictly enforce concentric nested border-radius rule: `inner radius = max(0px, calc(outer radius - inset))`. Never assign identical radii to outer and inner surfaces when separated by padding or an inset.


## Workflow & Browser Verification Policy

- **TẮT HOÀN TOÀN BƯỚC TỰ ĐỘNG MỞ BROWSER:** Không tự ý gọi browser agent, browser subagent, Playwright, Puppeteer hoặc bất kỳ công cụ điều khiển trình duyệt nào để preview, chụp screenshot hay kiểm tra UI.
- **Chỉ mở browser khi người dùng yêu cầu rõ ràng:** Chỉ khởi chạy hoặc tương tác với browser khi nhận được yêu cầu cụ thể từ người dùng.
- **Quy trình kiểm tra code qua Terminal:** Sau khi sửa code, chỉ kiểm tra bằng các lệnh terminal trong project: `pnpm check` (typecheck), `pnpm build`, lint hoặc các test có sẵn trong project. Tuyệt đối không tự ý thêm bước kiểm tra qua browser.
- **Không chờ hoặc retry browser:** Không chờ browser khởi động hoặc thử lại khi gặp lỗi browser. Nếu có tiến trình browser đang chạy ngầm hoặc bị kẹt, hãy dừng ngay lập tức và tiếp tục luồng công việc chính.
- **Hướng dẫn người dùng tự kiểm tra:** Nếu cần xác nhận giao diện bằng mắt, cung cấp URL hoặc hướng dẫn ngắn gọn (ví dụ: `http://localhost:4321/...`) để người dùng tự kiểm tra trực tiếp.
- **Tính trung thực:** Tuyệt đối không báo cáo là đã kiểm tra trực quan khi chưa thực hiện.


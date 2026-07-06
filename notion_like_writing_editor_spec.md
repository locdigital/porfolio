# SPEC: Notion-like Writing Editor cho website

## 1. Mục tiêu

Build một trình soạn thảo văn bản kiểu Notion cho phần `Writing` trên website.

Editor cần giúp người dùng:

- Viết bài blog trực tiếp trên website.
- Soạn thảo dạng block: heading, paragraph, quote, image, list, divider, code, table.
- Dùng slash command `/` để thêm block nhanh.
- Kéo thả để sắp xếp block.
- Tự động lưu bản nháp.
- Có panel SEO để tối ưu bài viết.
- Preview bài trước khi publish.
- Lưu nội dung ở dạng JSON block, HTML và Markdown.
- Có thể mở rộng thành CMS mini sau này.

Website hiện tại ưu tiên stack:

- Astro cho frontend chính.
- React island cho editor.
- TypeScript.
- Tailwind CSS.
- Database có thể dùng Supabase, PostgreSQL, SQLite hoặc backend API riêng.

---

## 2. Hướng kỹ thuật đề xuất

### Option A — Khuyến nghị cho MVP

Dùng **BlockNote** để build editor giống Notion nhanh hơn.

Lý do:

- Có sẵn block-based editor.
- Có slash menu.
- Có formatting toolbar.
- Có drag handle.
- Có React API.
- Dễ đưa vào Astro bằng React component island.

### Option B — Khi cần custom sâu

Dùng **Tiptap** nếu muốn kiểm soát sâu UI, schema, extension, Markdown, collaboration hoặc AI writing assistant.

Lưu ý:

- Tiptap mạnh nhưng phải tự build nhiều phần UI hơn.
- Slash command có thể cần custom extension.
- Markdown export/import cần kiểm tra kỹ trước khi đưa production.

### Chọn hướng triển khai

Trong task này, hãy ưu tiên **BlockNote + React + Astro** để ra MVP nhanh.

---

## 3. Yêu cầu tính năng MVP

### 3.1 Trang quản lý bài viết

Tạo route:

```txt
/writing
```

Hiển thị danh sách bài viết gồm:

- Title
- Slug
- Status: draft / published / archived
- Updated time
- Published time
- Main keyword
- Button Edit
- Button Preview
- Button Delete
- Button Create New Post

### 3.2 Trang tạo bài viết mới

Tạo route:

```txt
/writing/new
```

Gồm:

- Input title lớn ở đầu trang.
- Input slug.
- Editor chính.
- Sidebar SEO.
- Button Save Draft.
- Button Preview.
- Button Publish.

### 3.3 Trang chỉnh sửa bài viết

Tạo route:

```txt
/writing/[id]/edit
```

Yêu cầu:

- Load bài viết theo ID.
- Hiển thị nội dung cũ trong editor.
- Autosave khi người dùng chỉnh sửa.
- Cho phép update status.
- Có version history cơ bản.

### 3.4 Trang preview

Tạo route:

```txt
/writing/[id]/preview
```

Yêu cầu:

- Render bài viết giống giao diện blog thật.
- Không index preview page.
- Có nút quay lại edit.
- Có nút publish nếu bài đang draft.

---

## 4. Tính năng editor kiểu Notion

Editor cần hỗ trợ các block sau:

### Text blocks

- Paragraph
- Heading 1
- Heading 2
- Heading 3
- Quote
- Callout
- Divider
- Bullet list
- Numbered list
- Task list
- Toggle block nếu thư viện hỗ trợ hoặc có thể thêm sau

### Rich content blocks

- Image
- Video embed
- Link preview
- Code block
- Table
- Embed iframe

### Inline formatting

- Bold
- Italic
- Underline
- Strike
- Inline code
- Link
- Text color nếu dễ làm
- Highlight nếu dễ làm

### Slash command

Khi người dùng gõ `/`, hiện menu gồm:

```txt
Text
Heading 1
Heading 2
Heading 3
Bullet List
Numbered List
Task List
Quote
Callout
Divider
Image
Code Block
Table
Embed
```

Yêu cầu UX:

- Có search trong slash menu.
- Dùng phím lên/xuống để chọn.
- Enter để insert block.
- Esc để đóng menu.
- Click ngoài để đóng menu.

### Drag & drop block

Yêu cầu:

- Mỗi block có drag handle.
- Người dùng có thể kéo block lên/xuống.
- Sau khi kéo phải autosave lại nội dung.

---

## 5. SEO panel

Tạo sidebar bên phải tên `SEO Settings`.

Các field:

```txt
SEO Title
Meta Description
Focus Keyword
Slug
Canonical URL
OG Title
OG Description
OG Image
Category
Tags
Author
Status
```

### Realtime SEO checklist

Hiển thị checklist đơn giản:

- SEO title có độ dài từ 45–60 ký tự.
- Meta description có độ dài từ 120–160 ký tự.
- Slug không có dấu tiếng Việt, không có khoảng trắng.
- Có focus keyword.
- Focus keyword xuất hiện trong title.
- Focus keyword xuất hiện trong meta description.
- Có ít nhất 1 H2.
- Có ảnh đại diện.
- Bài viết dài tối thiểu 600 từ.
- Có internal link nếu phát hiện được link nội bộ.
- Có external link nếu phát hiện được link ngoài.

Hiển thị trạng thái:

```txt
Good
Needs improvement
Missing
```

Không cần làm chuẩn Rank Math 100%, chỉ cần checklist cơ bản để hỗ trợ người viết.

---

## 6. Top bar editor

Top bar gồm:

- Back to Writing
- Save status: Saved / Saving... / Unsaved changes / Error
- Word count
- Reading time
- Preview
- Save Draft
- Publish / Update

UX:

- Khi đang autosave hiện `Saving...`
- Khi lưu xong hiện `Saved`
- Nếu lỗi hiện `Could not save. Retry`
- Không reload page khi save.

---

## 7. Data model

Tạo bảng/database collection `posts`.

Schema đề xuất:

```ts
type PostStatus = "draft" | "published" | "archived";

type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  contentJson: unknown;
  contentHtml: string;
  contentMarkdown: string;
  coverImage?: string;
  seoTitle?: string;
  seoDescription?: string;
  focusKeyword?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  category?: string;
  tags: string[];
  author?: string;
  status: PostStatus;
  wordCount: number;
  readingTime: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
};
```

Tạo thêm bảng `post_versions` nếu làm version history:

```ts
type PostVersion = {
  id: string;
  postId: string;
  contentJson: unknown;
  contentHtml: string;
  contentMarkdown: string;
  title: string;
  createdAt: string;
};
```

---

## 8. API cần có

Tạo API routes:

```txt
GET    /api/posts
POST   /api/posts
GET    /api/posts/:id
PATCH  /api/posts/:id
DELETE /api/posts/:id
POST   /api/posts/:id/publish
POST   /api/posts/:id/unpublish
GET    /api/posts/:id/versions
POST   /api/uploads/image
```

### POST /api/posts

Request:

```json
{
  "title": "Untitled",
  "slug": "untitled",
  "status": "draft"
}
```

Response:

```json
{
  "id": "post_id",
  "title": "Untitled",
  "slug": "untitled",
  "status": "draft"
}
```

### PATCH /api/posts/:id

Request có thể update từng phần:

```json
{
  "title": "Tên bài viết",
  "slug": "ten-bai-viet",
  "contentJson": {},
  "contentHtml": "<h1>...</h1>",
  "contentMarkdown": "# ...",
  "seoTitle": "...",
  "seoDescription": "...",
  "focusKeyword": "...",
  "status": "draft"
}
```

### POST /api/uploads/image

Yêu cầu:

- Upload ảnh từ editor.
- Trả về URL ảnh.
- Validate file type.
- Giới hạn dung lượng.
- Cho phép jpg, jpeg, png, webp.

Response:

```json
{
  "url": "https://..."
}
```

---

## 9. Component structure

Tạo cấu trúc file như sau:

```txt
src/
  pages/
    writing/
      index.astro
      new.astro
      [id]/
        edit.astro
        preview.astro
  components/
    writing/
      WritingLayout.astro
      WritingDashboard.tsx
      WritingEditor.tsx
      EditorTopBar.tsx
      SeoSidebar.tsx
      PostSettingsPanel.tsx
      PublishDialog.tsx
      VersionHistory.tsx
      ImageUploadButton.tsx
  lib/
    writing/
      editor.ts
      posts.ts
      seo.ts
      markdown.ts
      slug.ts
      reading-time.ts
      autosave.ts
  styles/
    writing-editor.css
```

Nếu project đang dùng App Router hoặc framework khác, tự map lại cấu trúc tương ứng.

---

## 10. UI/UX style

Phong cách giao diện:

- Sạch, tối giản, giống Notion.
- Nền trắng hoặc neutral.
- Editor rộng, thoáng.
- Sidebar cố định bên phải.
- Không viền quá nặng.
- Focus vào nội dung viết.
- Responsive tốt.

Layout đề xuất:

```txt
+------------------------------------------------------------+
| Back | Saved | Word count | Preview | Save Draft | Publish |
+-------------------------------+----------------------------+
|                               |                            |
|        Writing Editor          |        SEO Sidebar          |
|                               |                            |
+-------------------------------+----------------------------+
```

Mobile:

- Sidebar SEO chuyển thành drawer hoặc tab.
- Editor full width.
- Top bar sticky.

---

## 11. Autosave

Yêu cầu:

- Autosave sau 1.2 giây khi người dùng ngừng gõ.
- Dùng debounce.
- Không gọi API liên tục từng ký tự.
- Nếu mất mạng, lưu bản tạm vào localStorage.
- Khi quay lại trang, nếu có local draft mới hơn server thì hỏi người dùng restore.

Logic:

```txt
User edits content
→ set unsaved changes
→ wait 1200ms
→ serialize editor content
→ PATCH /api/posts/:id
→ update save status
→ clear local backup
```

Local backup key:

```txt
writing-editor-draft-{postId}
```

---

## 12. Export content

Mỗi lần save cần lưu 3 dạng:

```txt
contentJson
contentHtml
contentMarkdown
```

Trong đó:

- `contentJson`: dùng để mở lại editor.
- `contentHtml`: dùng để render bài blog nhanh.
- `contentMarkdown`: dùng để export, backup, hoặc build static blog.

Nếu thư viện editor không hỗ trợ Markdown tốt ngay lập tức, hãy ưu tiên lưu JSON + HTML trước, sau đó thêm Markdown export ở phase 2.

---

## 13. Image upload

Yêu cầu:

- Người dùng có thể paste ảnh vào editor.
- Người dùng có thể drag ảnh vào editor.
- Người dùng có thể upload ảnh bằng slash command `/image`.
- Sau khi upload, ảnh hiện trong editor.
- Có thể thêm alt text cho ảnh.
- Alt text nên dùng cho SEO.

Validate:

```txt
Max size: 5MB
Allowed: image/jpeg, image/png, image/webp
```

---

## 14. Publish flow

Khi người dùng bấm `Publish`:

1. Validate title.
2. Validate slug.
3. Validate content không rỗng.
4. Check slug unique.
5. Hiện dialog confirm.
6. Nếu OK, update status thành `published`.
7. Set `publishedAt`.
8. Redirect sang preview hoặc bài public.

Nếu bài đã published thì nút đổi thành `Update`.

---

## 15. Public blog route

Tạo route public:

```txt
/blog/[slug]
```

Yêu cầu:

- Render bài viết published.
- Dùng `contentHtml` hoặc render từ JSON.
- Có meta title.
- Có meta description.
- Có canonical URL.
- Có OG image.
- Có structured data Article nếu dễ làm.
- Không render draft.

---

## 16. Security

Yêu cầu:

- Sanitize HTML trước khi render public.
- Không cho script lạ chạy trong content.
- Validate upload image.
- Validate slug.
- API write cần auth nếu website có login.
- Không để ai cũng publish được nếu chưa đăng nhập.

Nếu chưa có auth, tạm thời có thể bảo vệ route bằng basic password hoặc environment variable trong dev.

---

## 17. Performance

Yêu cầu:

- Editor chỉ load ở client.
- Không import editor vào toàn bộ website.
- Dùng dynamic import nếu cần.
- Tránh làm bundle toàn site nặng.
- Image trong bài viết cần lazy load.
- Public blog page không nên load editor library.

---

## 18. Accessibility

Yêu cầu:

- Có keyboard shortcut cơ bản.
- Button có aria-label.
- Slash menu dùng được bằng keyboard.
- Focus visible rõ ràng.
- Input có label.
- Không dùng màu quá mờ cho text chính.

---

## 19. Keyboard shortcuts

Hỗ trợ:

```txt
Cmd/Ctrl + B = Bold
Cmd/Ctrl + I = Italic
Cmd/Ctrl + K = Insert link
Cmd/Ctrl + S = Save
Cmd/Ctrl + Z = Undo
Cmd/Ctrl + Shift + Z = Redo
/ = Slash command
```

---

## 20. Acceptance criteria

Task được xem là hoàn thành khi:

- Truy cập được `/writing`.
- Tạo được bài viết mới.
- Mở được editor kiểu block.
- Gõ `/` hiện menu thêm block.
- Thêm được heading, paragraph, list, quote, image.
- Kéo thả block được nếu thư viện hỗ trợ sẵn.
- Autosave hoạt động.
- Refresh trang không mất nội dung.
- SEO sidebar hoạt động.
- Preview được bài viết.
- Publish được bài viết.
- Bài published hiển thị ở `/blog/[slug]`.
- Nội dung lưu được tối thiểu ở JSON và HTML.
- Không load editor library ở trang public blog.

---

## 21. Phase 1 — MVP

Làm các phần sau trước:

- `/writing`
- `/writing/new`
- `/writing/[id]/edit`
- `/writing/[id]/preview`
- Block editor bằng BlockNote
- Autosave
- Save draft
- Publish
- SEO sidebar basic
- Public route `/blog/[slug]`

Chưa cần:

- Collaboration realtime
- AI writing assistant
- Comment trong document
- Version history nâng cao
- Advanced permission
- Template library

---

## 22. Phase 2 — Nâng cấp

Sau MVP, thêm:

- Version history đầy đủ.
- Template bài viết.
- AI rewrite/expand/summarize.
- Internal link suggestion.
- Rank Math style SEO scoring.
- Export Markdown file.
- Import Markdown.
- Collaboration realtime.
- Comment từng block.
- Table of contents tự động.
- Media library.
- Schedule publish.

---

## 23. Design details

Dùng Tailwind CSS.

Style gợi ý:

```txt
Editor container:
max-width: 760px
padding: 48px 24px
font-size: 17px
line-height: 1.75

Title input:
font-size: 42px
font-weight: 700
border: none
outline: none

Sidebar:
width: 340px
border-left
background: white
position: sticky
top: 0
height: 100vh
overflow-y: auto

Top bar:
height: 56px
border-bottom
background: rgba(255,255,255,0.85)
backdrop-blur
position: sticky
top: 0
z-index: 50
```

---

## 24. Prompt thực thi cho Codex/Antigravity

Hãy build một Notion-like writing editor cho website theo spec này.

Ưu tiên:

1. Dùng Astro + React island.
2. Dùng TypeScript.
3. Dùng Tailwind CSS.
4. Dùng BlockNote cho editor MVP.
5. Tạo route `/writing`, `/writing/new`, `/writing/[id]/edit`, `/writing/[id]/preview`, `/blog/[slug]`.
6. Tạo API CRUD cho posts.
7. Tạo autosave debounce 1200ms.
8. Lưu contentJson + contentHtml, nếu làm được thì thêm contentMarkdown.
9. Tạo SEO sidebar với checklist realtime.
10. Tạo publish flow.
11. Đảm bảo editor không load ở public blog page.
12. Code phải rõ ràng, chia component sạch, dễ mở rộng.

Trước khi code, hãy kiểm tra cấu trúc project hiện tại rồi đề xuất file cần tạo/sửa. Sau đó tiến hành implement từng bước. Khi xong, cung cấp hướng dẫn cài package, chạy local, test flow tạo bài, edit, preview, publish.

---

## 25. Package gợi ý

Nếu dùng BlockNote:

```bash
npm install @blocknote/core @blocknote/react @blocknote/mantine
```

Nếu project Astro chưa bật React:

```bash
npx astro add react
```

Nếu cần sanitize HTML:

```bash
npm install isomorphic-dompurify
```

Nếu cần tạo slug:

```bash
npm install slugify
```

Nếu cần debounce:

```bash
npm install use-debounce
```

---

## 26. Ghi chú cho developer

- Không hard-code dữ liệu trong component editor.
- Không để editor phụ thuộc vào route cụ thể.
- Tách logic save vào hook riêng.
- Tách SEO check vào file riêng.
- Có loading state, empty state và error state.
- Code phải chạy được trước, đẹp sau.
- MVP nên đơn giản nhưng kiến trúc phải sạch để nâng cấp thành CMS sau này.

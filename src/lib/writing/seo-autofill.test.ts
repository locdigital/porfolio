import { describe, expect, it } from "vitest";
import { applySeoAutofill, suggestSeoAutofill } from "./seo-autofill";
import { computeSeoChecklist, computeSeoScore } from "./seo";
import type { Post } from "./posts";

const basePost: Partial<Post> = {
  title: "Những Khoảng Tối Cuộc Đời",
  slug: "",
  contentHtml: `
    <h2>Sau biến cố</h2>
    <p>Sau Covid, một tai nạn, mất mát gia đình và khoản nợ lớn đã buộc tôi học cách tự xây lại đời mình từ con số âm. Đây là câu chuyện về cách tôi đi qua những ngày tối nhất, giữ lại lòng tin, làm việc đều đặn và học cách đứng dậy khi mọi thứ tưởng như đã kết thúc.</p>
    <p>Xem thêm <a href="/about">hành trình cá nhân</a> và nguồn cảm hứng từ <a href="https://example.com">một bài viết liên quan</a>.</p>
  `,
  wordCount: 680,
};

describe("suggestSeoAutofill", () => {
  it("suggests bounded fields that improve the current SEO score", () => {
    const preview = suggestSeoAutofill(basePost);
    const updates = applySeoAutofill(basePost, preview.suggestions);
    const improvedScore = computeSeoScore(computeSeoChecklist({ ...basePost, ...updates }));

    expect(preview.suggestions.seoTitle?.length).toBeLessThanOrEqual(60);
    expect(preview.suggestions.seoDescription?.length).toBeLessThanOrEqual(160);
    expect(preview.suggestions.focusKeyword).toBe(basePost.title);
    expect(preview.suggestions.slug).toBe("nhung-khoang-toi-cuoc-doi");
    expect(improvedScore).toBeGreaterThan(computeSeoScore(computeSeoChecklist(basePost)));
  });

  it("does not overwrite user-filled fields unless overwrite is enabled", () => {
    const post: Partial<Post> = {
      ...basePost,
      seoTitle: "Custom SEO Title",
      seoDescription: "Custom description",
    };
    const preview = suggestSeoAutofill(post);

    expect(applySeoAutofill(post, preview.suggestions)).not.toHaveProperty("seoTitle");
    expect(applySeoAutofill(post, preview.suggestions)).not.toHaveProperty("seoDescription");
    expect(applySeoAutofill(post, preview.suggestions, { overwrite: true })).toHaveProperty("seoTitle");
    expect(applySeoAutofill(post, preview.suggestions, { overwrite: true })).toHaveProperty("seoDescription");
  });

  it("strips markdown heading markers before building SEO fields", () => {
    const preview = suggestSeoAutofill({
      title: "Những Khoảng Tối Cuộc Đời",
      contentMarkdown:
        "## Khi mọi thứ tưởng như đang bắt đầu\n\nCó một giai đoạn trong đời, tôi từng nghĩ mọi thứ đang bắt đầu đi đúng hướng.",
    });

    expect(preview.suggestions.seoTitle).not.toContain("##");
    expect(preview.suggestions.seoDescription).not.toContain("##");
  });
});

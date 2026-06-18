(function () {
  function toArray(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value.toJS === "function") return value.toJS();
    if (typeof value.toArray === "function") return value.toArray();
    return [];
  }

  function get(entry, key, fallback) {
    const value = entry && entry.getIn ? entry.getIn(["data", key]) : undefined;
    return value === undefined || value === null || value === "" ? fallback : value;
  }

  function textToParagraphs(text) {
    return String(text || "")
      .split(/\n{2,}/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function formatDate(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  function waitForCMS() {
    const elementFactory = window.h || (window.React && window.React.createElement);

    if (!window.CMS || !elementFactory) {
      window.setTimeout(waitForCMS, 50);
      return;
    }

    const h = elementFactory;

    window.CMS.registerPreviewStyle("/admin/preview.css");

    window.CMS.registerPreviewTemplate("projects", function ProjectPreview(props) {
      const entry = props.entry;
      const title = get(entry, "title", "Project title");
      const number = get(entry, "number", "00");
      const client = get(entry, "client", "Client");
      const year = get(entry, "year", "Year");
      const role = get(entry, "role", "Role");
      const summary = get(entry, "summary", "Short project summary.");
      const description = get(entry, "description", "");
      const coverImage = get(entry, "coverImage", "");
      const link = get(entry, "link", "");
      const linkLabel = get(entry, "linkLabel", "Visit site");
      const tools = toArray(entry.getIn(["data", "tools"]));
      const skills = toArray(entry.getIn(["data", "skills"]));
      const tags = tools.concat(skills).filter(Boolean);

      return h(
        "main",
        { className: "cms-preview" },
        h(
          "div",
          { className: "cms-preview-container" },
          h("span", { className: "cms-preview-back" }, "<- All work"),
          h(
            "header",
            { className: "cms-preview-detail-header" },
            h(
              "div",
              { className: "cms-preview-detail-top" },
              h("span", null, number),
              h("span", null, year),
            ),
            h("h1", { className: "cms-preview-detail-title" }, title),
            h(
              "div",
              { className: "cms-preview-meta" },
              h(
                "div",
                { className: "cms-preview-meta-item" },
                h("span", { className: "cms-preview-label" }, "Client"),
                h("span", { className: "cms-preview-value" }, client),
              ),
              h(
                "div",
                { className: "cms-preview-meta-item" },
                h("span", { className: "cms-preview-label" }, "Role"),
                h("span", { className: "cms-preview-value" }, role),
              ),
              h(
                "div",
                { className: "cms-preview-meta-item" },
                h("span", { className: "cms-preview-label" }, "Year"),
                h("span", { className: "cms-preview-value" }, year),
              ),
            ),
          ),
          h(
            "div",
            { className: "cms-preview-hero" },
            h(
              "div",
              { className: "cms-preview-hero-img" },
              coverImage
                ? h("img", { src: coverImage, alt: client })
                : h("span", { className: "cms-preview-label" }, "Cover image"),
            ),
          ),
          h(
            "div",
            { className: "cms-preview-content" },
            h(
              "div",
              null,
              h("p", { className: "cms-preview-summary" }, summary),
              textToParagraphs(description).map(function (paragraph) {
                return h("p", { className: "cms-preview-para" }, paragraph);
              }),
              link ? h("a", { className: "cms-preview-link", href: link }, linkLabel) : null,
            ),
            h(
              "aside",
              { className: "cms-preview-sidebar" },
              h(
                "div",
                { className: "cms-preview-sidebar-block" },
                h("span", { className: "cms-preview-label" }, "Tools / Skills"),
                h(
                  "ul",
                  { className: "cms-preview-tags" },
                  tags.map(function (tag) {
                    return h("li", { className: "cms-preview-tag" }, tag);
                  }),
                ),
              ),
              h(
                "div",
                { className: "cms-preview-sidebar-block" },
                h("span", { className: "cms-preview-label" }, "Client"),
                h("span", { className: "cms-preview-value" }, client),
              ),
              h(
                "div",
                { className: "cms-preview-sidebar-block" },
                h("span", { className: "cms-preview-label" }, "Year"),
                h("span", { className: "cms-preview-value" }, year),
              ),
              link
                ? h(
                    "div",
                    { className: "cms-preview-sidebar-block" },
                    h("span", { className: "cms-preview-label" }, "Live"),
                    h("a", { className: "cms-preview-link", href: link }, linkLabel),
                  )
                : null,
            ),
          ),
        ),
      );
    });

    window.CMS.registerPreviewTemplate("writing", function WritingPreview(props) {
      const entry = props.entry;
      const title = get(entry, "headline", get(entry, "title", "Writing headline"));
      const date = formatDate(get(entry, "publishedAt", ""));
      const coverImage = get(entry, "coverImage", "");
      const tags = toArray(entry.getIn(["data", "tags"]));

      return h(
        "article",
        { className: "cms-writing" },
        h("span", { className: "cms-writing-back" }, "<- Writing"),
        h(
          "header",
          null,
          h("h1", { className: "cms-writing-title" }, title),
          h(
            "div",
            { className: "cms-writing-meta" },
            date ? h("time", null, date) : null,
            tags.map(function (tag) {
              return h("span", null, "#" + String(tag).toLowerCase().replace(/\s+/g, "-"));
            }),
          ),
        ),
        coverImage
          ? h("div", { className: "cms-writing-cover" }, h("img", { src: coverImage, alt: title }))
          : null,
        h("div", { className: "cms-prose" }, props.widgetFor("body")),
      );
    });

    window.CMS.registerPreviewTemplate("pages", function PagePreview(props) {
      const entry = props.entry;
      const title = get(entry, "headline", get(entry, "title", "Page title"));
      const subtitle = get(entry, "subheadline", get(entry, "description", ""));

      return h(
        "main",
        { className: "cms-page" },
        h("h1", { className: "cms-page-title" }, title),
        subtitle ? h("p", { className: "cms-page-subtitle" }, subtitle) : null,
        h("div", { className: "cms-prose" }, props.widgetFor("body")),
      );
    });

    window.CMS.registerPreviewTemplate("photos", function PhotosPreview(props) {
      const entry = props.entry;
      const location = get(entry, "location", "Photo location");
      const headline = get(entry, "headline", "Location headline");
      const subheadline = get(entry, "subheadline", "");
      const description = get(entry, "description", "");
      const images = toArray(entry.getIn(["data", "images"]));

      return h(
        "main",
        { className: "cms-photo" },
        h(
          "header",
          { className: "cms-photo-header" },
          h("span", { className: "cms-preview-label" }, location),
          h("h1", { className: "cms-photo-title" }, headline),
          subheadline ? h("p", { className: "cms-photo-subtitle" }, subheadline) : null,
          description ? h("p", { className: "cms-photo-description" }, description) : null,
        ),
        h(
          "div",
          { className: "cms-photo-grid" },
          images.length
            ? images.map(function (image, index) {
                return h(
                  "figure",
                  { className: "cms-photo-card" },
                  image.src
                    ? h("img", { src: image.src, alt: image.alt || location })
                    : h("span", { className: "cms-preview-label" }, "Photo " + (index + 1)),
                  h("figcaption", null, image.alt || "Photo " + (index + 1)),
                );
              })
            : h("div", { className: "cms-photo-empty" }, "Add photos to preview this collection."),
        ),
      );
    });

    window.CMS.registerPreviewTemplate("gear", function GearPreview(props) {
      const entry = props.entry;
      const headline = get(entry, "headline", "Gear headline");
      const description = get(entry, "description", "");
      const sections = toArray(entry.getIn(["data", "sections"]));

      return h(
        "main",
        { className: "cms-gear" },
        h(
          "header",
          { className: "cms-gear-header" },
          h("span", { className: "cms-preview-label" }, get(entry, "title", "Gear")),
          h("h1", { className: "cms-gear-title" }, headline),
          description ? h("p", { className: "cms-gear-description" }, description) : null,
        ),
        h(
          "div",
          { className: "cms-gear-sections" },
          sections.length
            ? sections.map(function (section) {
                const items = Array.isArray(section.items) ? section.items : [];
                return h(
                  "section",
                  { className: "cms-gear-section" },
                  h(
                    "div",
                    { className: "cms-gear-section-head" },
                    h("h2", null, section.title || "Section"),
                    section.description ? h("p", null, section.description) : null,
                  ),
                  h(
                    "div",
                    { className: "cms-gear-items" },
                    items.map(function (item) {
                      return h(
                        "article",
                        { className: "cms-gear-item" },
                        item.image ? h("img", { src: item.image, alt: item.name || "" }) : null,
                        h("span", { className: "cms-gear-tag" }, item.tag || "Gear"),
                        h("h3", null, item.name || "Item name"),
                        h("p", { className: "cms-gear-item-headline" }, item.headline || ""),
                        item.description ? h("p", null, item.description) : null,
                      );
                    }),
                  ),
                );
              })
            : h("div", { className: "cms-photo-empty" }, "Add gear sections to preview this page."),
        ),
      );
    });
  }

  waitForCMS();
})();

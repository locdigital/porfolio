(function () {
  const collections = [
    {
      id: "pages",
      label: "Pages",
      eyebrow: "Page",
      href: "#/collections/pages",
      count: "1",
      detail: "standalone route",
      copy: "Create and edit pages such as /now or small campaign pages.",
      icon:
        '<rect x="3" y="3" width="18" height="18" rx="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line>',
    },
    {
      id: "writing",
      label: "Writing",
      eyebrow: "Post",
      href: "#/collections/writing",
      count: "1",
      detail: "published note",
      copy: "Draft essays, SEO notes, marketing updates, and blog posts.",
      icon:
        '<path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"></path>',
    },
    {
      id: "projects",
      label: "Projects",
      eyebrow: "Work",
      href: "#/collections/projects",
      count: "5",
      detail: "case studies",
      copy: "Update selected work, logos, project metadata, and case-study copy.",
      icon:
        '<rect x="2" y="7" width="20" height="14" rx="2"></rect><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"></path>',
    },
    {
      id: "photos",
      label: "Photos",
      eyebrow: "Photo",
      href: "#/collections/photos",
      count: "4",
      detail: "locations",
      copy: "Manage travel photo collections, captions, dimensions, and stories.",
      icon:
        '<rect x="3" y="3" width="18" height="18" rx="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline>',
    },
    {
      id: "gear",
      label: "Gear",
      eyebrow: "Stack",
      href: "#/collections/gear/entries/setup",
      count: "1",
      detail: "setup file",
      copy: "Keep the gear page current with products, sections, images, and links.",
      icon:
        '<circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 .6 1.65 1.65 0 0 0-.35 1V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1.09-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-.6-1 1.65 1.65 0 0 0-1-.35H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1.09 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6c.38-.16.7-.37 1-.6.3-.24.35-.62.35-1V3a2 2 0 1 1 4 0v.09c0 .38.05.76.35 1 .3.23.62.44 1 .6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.16.38.37.7.6 1 .24.3.62.35 1 .35H21a2 2 0 1 1 0 4h-.09c-.38 0-.76.05-1 .35-.23.3-.44.62-.51 1.3z"></path>',
    },
  ];

  const overviewIcon =
    '<rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect>';
  const mediaIcon =
    '<rect x="3" y="3" width="18" height="18" rx="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline>';

  function svg(paths) {
    return `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
  }

  function navItem(item) {
    return `<a href="${item.href}" class="vc-sidebar-item" data-tab-id="${item.id}" title="${item.label}">${svg(item.icon)}</a>`;
  }

  function tab(item) {
    return `<a href="${item.href}" class="vc-tab" data-tab-id="${item.id}">${item.label}</a>`;
  }

  function kpi(item) {
    return `
      <button class="vc-kpi-card" type="button" onclick="window.location.hash='${item.href.slice(1)}'">
        <span class="vc-kpi-label">${item.label}</span>
        <span class="vc-kpi-value-wrap">
          <span class="vc-kpi-value">${item.count}</span>
          <span class="vc-kpi-trend success">ready</span>
        </span>
        <span class="vc-kpi-sub">${item.detail}</span>
      </button>
    `;
  }

  function collectionCard(item) {
    return `
      <a href="${item.href}" class="vc-collection-card">
        <div>
          <div class="vc-col-header">
            <span class="vc-col-badge ${item.id}">${item.eyebrow}</span>
            <strong>${item.label}</strong>
          </div>
          <p>${item.copy}</p>
        </div>
        <div class="vc-col-footer">
          <span>Open collection</span>
        </div>
      </a>
    `;
  }

  function isDashboardRoute() {
    const hash = window.location.hash;
    return !hash || hash === "#" || hash === "#/" || hash.includes("overview");
  }

  function goToHash(hash) {
    window.location.hash = hash.replace(/^#/, "");
  }

  function createConsole() {
    if (document.getElementById("loc-director-console")) return;

    const shell = document.createElement("section");
    shell.id = "loc-director-console-container";
    shell.setAttribute("aria-label", "CMS App Shell");
    shell.innerHTML = `
      <aside class="vc-sidebar">
        <a class="vc-logo-wrap" href="#/overview" aria-label="Overview">
          <div class="vc-logo-gradient" aria-hidden="true"></div>
        </a>
        <nav class="vc-sidebar-nav">
          <a href="#/overview" class="vc-sidebar-item" data-tab-id="overview" title="Overview">${svg(overviewIcon)}</a>
          ${collections.map(navItem).join("")}
          <a href="#/media" class="vc-sidebar-item" data-tab-id="media" title="Media">${svg(mediaIcon)}</a>
        </nav>
        <button class="vc-sidebar-add" title="New post" type="button" data-action="new-post">
          <span>+</span>
        </button>
      </aside>

      <header class="vc-header">
        <div class="vc-header-left">
          <div class="vc-tabs">
            <a href="#/overview" class="vc-tab" data-tab-id="overview">Overview</a>
            ${collections.map(tab).join("")}
            <a href="#/media" class="vc-tab" data-tab-id="media">Media</a>
            <a href="/" target="_blank" rel="noreferrer" class="vc-tab">Live Site</a>
          </div>
        </div>
        <div class="vc-header-right">
          <div class="vc-search-bar" aria-hidden="true">
            ${svg('<circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>').replace('width="20" height="20"', 'width="14" height="14" class="vc-search-icon"')}
            <input type="text" placeholder="Quick jump" readonly />
            <kbd class="vc-kbd">CMD K</kbd>
          </div>
          <button class="vc-btn-import" type="button" data-action="new-post">New Post</button>
          <a class="vc-bell-icon" href="/admin/config.yml" target="_blank" rel="noreferrer" title="CMS config">
            ${svg('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><path d="M14 2v6h6"></path><path d="M16 13H8"></path><path d="M16 17H8"></path>')}
          </a>
          <div class="vc-avatar">LD</div>
        </div>
      </header>

      <div id="loc-director-console" class="vc-dashboard-grid">
        <div class="vc-main-content">
          <div class="vc-page-header">
            <div>
              <p class="vc-page-kicker">Loc Digital CMS</p>
              <h2>Overview</h2>
            </div>
            <div class="vc-page-actions">
              <a class="vc-btn-subtle" href="/admin/config.yml" target="_blank" rel="noreferrer">Config</a>
              <button class="vc-btn-subtle" type="button" onclick="window.location.reload()">Refresh</button>
            </div>
          </div>

          <div class="vc-kpi-grid">
            ${collections.slice(0, 4).map(kpi).join("")}
          </div>

          <div class="vc-collection-header">
            <h3>Content Studio Collections</h3>
          </div>
          <div class="vc-collections-grid">
            ${collections.map(collectionCard).join("")}
            <a href="#/media" class="vc-collection-card">
              <div>
                <div class="vc-col-header">
                  <span class="vc-col-badge media">Media</span>
                  <strong>Media Library</strong>
                </div>
                <p>Upload images for pages, posts, projects, photos, and gear entries.</p>
              </div>
              <div class="vc-col-footer">
                <span>Open media</span>
              </div>
            </a>
          </div>
        </div>

        <aside class="vc-right-panel">
          <div class="vc-promo-card">
            <span class="vc-panel-label">Fast action</span>
            <h4>Start a writing draft</h4>
            <p>Create a new markdown post with preview, tags, dates, and cover media.</p>
            <button class="vc-btn-primary" type="button" data-action="new-post">
              ${svg('<line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>').replace('width="20" height="20"', 'width="12" height="12"')}
              New writing entry
            </button>
          </div>

          <div class="vc-checklist">
            <div class="vc-check-item done">
              <span class="vc-check-indicator">OK</span>
              <div class="vc-check-content">
                <strong>Collections</strong>
                <p>Pages, Writing, Projects, Photos, Gear</p>
              </div>
              <span class="vc-check-status text-green">Ready</span>
            </div>
            <div class="vc-check-item done">
              <span class="vc-check-indicator">OK</span>
              <div class="vc-check-content">
                <strong>Preview templates</strong>
                <p>Markdown and JSON entries</p>
              </div>
              <span class="vc-check-status text-green">Ready</span>
            </div>
            <div class="vc-check-item">
              <span class="vc-check-indicator"></span>
              <div class="vc-check-content">
                <strong>Photos</strong>
                <p>Location galleries and image metadata</p>
              </div>
              <button class="vc-check-btn" type="button" onclick="window.location.hash='#/collections/photos'">Open</button>
            </div>
            <div class="vc-check-item">
              <span class="vc-check-indicator"></span>
              <div class="vc-check-content">
                <strong>Gear</strong>
                <p>Editable setup stack</p>
              </div>
              <button class="vc-check-btn" type="button" onclick="window.location.hash='#/collections/gear/entries/setup'">Open</button>
            </div>
          </div>

          <div class="vc-progress-section">
            <div class="vc-progress-label">
              <span>Editable collections</span>
              <strong>5 / 5</strong>
            </div>
            <div class="vc-progress-bar-wrap">
              <div class="vc-progress-bar" style="width: 100%; background: #0070f3;"></div>
            </div>

            <div class="vc-progress-label">
              <span>Local backend</span>
              <strong>enabled</strong>
            </div>
            <div class="vc-progress-bar-wrap">
              <div class="vc-progress-bar" style="width: 100%; background: #10b981;"></div>
            </div>

            <div class="vc-progress-footer">
              <span>Decap CMS v3.8</span>
              <a class="vc-btn-upgrade" href="https://decapcms.org" target="_blank" rel="noreferrer">Docs</a>
            </div>
          </div>
        </aside>
      </div>
    `;

    shell.addEventListener("click", function (event) {
      const trigger = event.target.closest("[data-action='new-post']");
      if (trigger) goToHash("#/collections/writing/new");
    });

    document.body.prepend(shell);
  }

  function syncConsoleVisibility() {
    createConsole();

    const hash = window.location.hash;
    const isDashboard = isDashboardRoute();
    document.body.classList.toggle("loc-console-visible", isDashboard);
    document.body.classList.toggle("loc-editor-visible", hash.includes("/new") || hash.includes("/entries/"));

    document.querySelectorAll(".vc-tab, .vc-sidebar-item").forEach(function (item) {
      item.classList.remove("active");
    });

    let active = "overview";
    if (!isDashboard) {
      const match = collections.find(function (item) {
        return hash.includes(item.id);
      });
      active = match ? match.id : hash.includes("media") ? "media" : "overview";
    }

    document.querySelectorAll(`[data-tab-id="${active}"]`).forEach(function (item) {
      item.classList.add("active");
    });
  }

  if (!window.location.hash || window.location.hash === "#" || window.location.hash === "#/") {
    window.location.hash = "#/overview";
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", syncConsoleVisibility);
  } else {
    syncConsoleVisibility();
  }

  window.addEventListener("hashchange", syncConsoleVisibility);
})();

(function () {
  const cards = [
    {
      label: "Pages",
      value: "Manage pages",
      tone: "green",
      href: "#/collections/pages",
      action: "Open",
    },
    {
      label: "Writing",
      value: "Posts and notes",
      tone: "purple",
      href: "#/collections/writing",
      action: "Open",
    },
    {
      label: "Work",
      value: "Projects",
      tone: "orange",
      href: "#/collections/projects",
      action: "Open",
    },
    {
      label: "Media",
      value: "Uploads",
      tone: "blue",
      href: "#/media",
      action: "Open",
    },
  ];

  const quickLinks = [
    ["New page", "#/collections/pages/new"],
    ["New post", "#/collections/writing/new"],
    ["New project", "#/collections/projects/new"],
    ["Live site", "/"],
  ];

  function isDashboardRoute() {
    const hash = window.location.hash;
    return !hash || hash === "#" || hash === "#/";
  }

  function createConsole() {
    if (document.getElementById("loc-director-console")) return;

    const shell = document.createElement("section");
    shell.id = "loc-director-console";
    shell.setAttribute("aria-label", "CMS command center");
    shell.innerHTML = `
      <div class="loc-console-head">
        <div>
          <span class="loc-console-eyebrow">System overview</span>
          <h1>Content command center</h1>
        </div>
        <div class="loc-console-actions">
          ${quickLinks
            .map(([label, href]) => `<a href="${href}" ${href === "/" ? 'target="_blank" rel="noopener noreferrer"' : ""}>${label}</a>`)
            .join("")}
        </div>
      </div>
      <div class="loc-console-grid">
        ${cards
          .map(
            (card) => `
              <a class="loc-console-card is-${card.tone}" href="${card.href}">
                <span class="loc-card-icon" aria-hidden="true"></span>
                <span>
                  <strong>${card.label}</strong>
                  <em>${card.value}</em>
                </span>
                <small>${card.action}</small>
              </a>
            `,
          )
          .join("")}
      </div>
    `;

    document.body.prepend(shell);
  }

  function syncConsoleVisibility() {
    createConsole();
    document.body.classList.toggle("loc-console-visible", isDashboardRoute());
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", syncConsoleVisibility);
  } else {
    syncConsoleVisibility();
  }

  window.addEventListener("hashchange", syncConsoleVisibility);
})();

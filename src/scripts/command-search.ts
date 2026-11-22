import { onPageLoad } from "./page-lifecycle";

type SearchItem = { title: string; description: string; href: string; group: string; keywords?: string };

const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase().trim();
const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] ?? character);

function scoreItem(item: SearchItem, query: string) {
  const title = normalize(item.title);
  const description = normalize(item.description);
  const group = normalize(item.group);
  const keywords = normalize(item.keywords ?? "");
  const terms = query.split(/\s+/).filter(Boolean);
  if (!terms.every((term) => `${title} ${description} ${group} ${keywords}`.includes(term))) return -1;
  let score = 0;
  if (title === query) score += 120;
  if (title.startsWith(query)) score += 80;
  if (title.includes(query)) score += 50;
  if (keywords.includes(query)) score += 20;
  if (description.includes(query)) score += 10;
  score += terms.reduce((total, term) => total + (title.includes(term) ? 14 : 0), 0);
  return score;
}

onPageLoad((signal) => {
  const root = document.getElementById("command-search");
  const input = document.getElementById("command-search-input") as HTMLInputElement | null;
  const results = document.getElementById("command-search-results");
  const dataNode = document.getElementById("command-search-data");
  const triggers = Array.from(document.querySelectorAll<HTMLElement>("[data-command-search-open]"));
  if (!root || !input || !results || !dataNode) return;

  let items: SearchItem[] = [];
  try { items = JSON.parse(dataNode.textContent ?? "[]") as SearchItem[]; } catch { return; }

  let activeIndex = 0;
  let visibleItems: SearchItem[] = [];
  let previousFocus: HTMLElement | null = null;
  const previousBodyOverflow = document.body.style.overflow;

  const setActive = (index: number, scroll = true) => {
    const options = Array.from(results.querySelectorAll<HTMLAnchorElement>("[role='option']"));
    if (!options.length) { activeIndex = 0; input.removeAttribute("aria-activedescendant"); return; }
    activeIndex = (index + options.length) % options.length;
    options.forEach((option, optionIndex) => {
      const active = optionIndex === activeIndex;
      option.classList.toggle("is-active", active);
      option.setAttribute("aria-selected", String(active));
    });
    input.setAttribute("aria-activedescendant", options[activeIndex].id);
    if (scroll) options[activeIndex].scrollIntoView({ block: "nearest" });
  };

  const render = () => {
    const query = normalize(input.value);
    const matches = items.map((item, order) => ({ item, order, score: query ? scoreItem(item, query) : (item.group === "Pages" ? 1 : -1) }))
      .filter(({ score }) => score >= 0).sort((a, b) => b.score - a.score || a.order - b.order).slice(0, query ? 12 : 8);
    visibleItems = matches.map(({ item }) => item);
    if (!visibleItems.length) {
      results.innerHTML = `<div class="command-search-empty"><strong>No results found</strong><span>Try another title, topic, or place.</span></div>`;
      input.removeAttribute("aria-activedescendant");
      return;
    }
    results.innerHTML = visibleItems.map((item, index) => `
      <a id="command-search-option-${index}" class="command-search-result" href="${escapeHtml(item.href)}" role="option" aria-selected="false" data-astro-prefetch="load">
        <span class="command-search-result-mark" aria-hidden="true"></span><span class="command-search-result-copy"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.description)}</span></span><span class="command-search-result-group">${escapeHtml(item.group)}</span>
      </a>`).join("");
    setActive(Math.min(activeIndex, visibleItems.length - 1), false);
  };

  const open = () => {
    if (!root.hidden) return;
    previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    root.hidden = false; document.body.style.overflow = "hidden"; input.value = ""; activeIndex = 0; render();
    requestAnimationFrame(() => { root.classList.add("is-open"); input.focus(); });
  };
  const close = (restoreFocus = true) => {
    if (root.hidden) return;
    root.classList.remove("is-open"); document.body.style.overflow = previousBodyOverflow; root.hidden = true;
    if (restoreFocus) previousFocus?.focus();
  };

  triggers.forEach((trigger) => trigger.addEventListener("click", open, { signal }));
  root.querySelectorAll<HTMLElement>("[data-command-search-close]").forEach((button) => button.addEventListener("click", () => close(), { signal }));
  input.addEventListener("input", () => { activeIndex = 0; render(); }, { signal });
  results.addEventListener("mousemove", (event) => {
    const option = (event.target as Element).closest<HTMLElement>("[role='option']");
    if (!option) return;
    setActive(Array.from(results.querySelectorAll("[role='option']")).indexOf(option), false);
  }, { signal });
  results.addEventListener("click", () => close(false), { signal });

  window.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLocaleLowerCase() === "k") { event.preventDefault(); root.hidden ? open() : close(); return; }
    if (root.hidden) return;
    if (event.key === "Escape") { event.preventDefault(); close(); }
    else if (event.key === "ArrowDown") { event.preventDefault(); setActive(activeIndex + 1); }
    else if (event.key === "ArrowUp") { event.preventDefault(); setActive(activeIndex - 1); }
    else if (event.key === "Enter" && visibleItems[activeIndex]) { event.preventDefault(); close(false); window.location.href = visibleItems[activeIndex].href; }
    else if (event.key === "Tab") { event.preventDefault(); input.focus(); }
  }, { signal });

  const isApple = /Mac|iPhone|iPad|iPod/.test(navigator.platform);
  document.querySelectorAll<HTMLElement>("[data-command-key]").forEach((key) => { key.textContent = isApple ? "⌘ K" : "Ctrl K"; });
  return () => close(false);
});

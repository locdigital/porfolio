import { onPageLoad } from "./page-lifecycle";

async function hydratePreviewImage(img: HTMLImageElement): Promise<void> {
  const previewSrc = img.dataset.src;
  if (previewSrc && (img.getAttribute("src") !== previewSrc || (img.complete && !img.naturalWidth))) {
    img.loading = "eager";
    img.src = previewSrc;
  }
  await img.decode().catch(() => {});
}

onPageLoad((signal) => {
  try {
    localStorage.removeItem("photos_view_preference");
    sessionStorage.removeItem("photos_view_override");
  } catch {
    // Ignore storage access errors in private browsing modes.
  }

  document.querySelectorAll<HTMLElement>(".folder-wrapper[data-folder-preview]").forEach((wrapper) => {
    const images = Array.from(wrapper.querySelectorAll<HTMLImageElement>(".folder-card img[data-src]"));
    let loading: Promise<void> | undefined;
    const showPreview = () => {
      loading ??= Promise.all(images.map(hydratePreviewImage)).then(() => {
        if (signal.aborted) return;
        if (images.every((img) => img.complete && img.naturalWidth > 0)) {
          wrapper.dataset.previewReady = "true";
        } else {
          loading = undefined;
        }
      });
    };

    wrapper.addEventListener("pointerenter", (event) => {
      if (event.pointerType !== "touch" && window.matchMedia("(min-width: 769px)").matches) showPreview();
    }, { signal });
    wrapper.addEventListener("focusin", () => {
      if (wrapper.matches(":focus-visible")) showPreview();
    }, { signal });

    // A visitor can focus a folder while Astro is finishing a page navigation.
    if (wrapper.matches(":focus-visible")) showPreview();
  });
});


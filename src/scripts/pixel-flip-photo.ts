import { onPageLoad } from "./page-lifecycle";
import { pickShuffledTitleColors } from "../lib/photo-title-colors";

export const FLIP_DURATION = 980;
const offsets = [0, .14, .37, .53, .79, .94, 1];
const easing = ["cubic-bezier(.32,0,.65,1)", "cubic-bezier(.35,0,.65,1)", "cubic-bezier(.3,0,.6,1)", "cubic-bezier(.2,0,.35,1)", "cubic-bezier(.2,0,.4,1)", "ease-out", "linear"];

const paperFrames: Keyframe[] = [
  [0, 0, 0, 0], [-8, 16, -2.2, 8], [-17, 32, -3, 62],
  [-22, 42, -1.5, 102], [-12, 24, 1, 166], [-2, 4, .3, 181], [0, 0, 0, 180],
].map(([y, depth, twist, turn], index) => ({
  offset: offsets[index], easing: easing[index],
  transform: `translate3d(0, ${y}px, ${depth}px) rotateZ(${twist}deg) rotateY(${turn}deg)`,
}));
const shadowFrames: Keyframe[] = [
  [5, .98, .98, .17], [10, 1.01, 1, .14], [17, 1.05, 1.02, .10],
  [22, 1.08, 1.04, .07], [13, 1.04, 1.01, .11], [6, .99, .98, .16], [5, .98, .98, .17],
].map(([y, xScale, yScale, opacity], index) => ({
  offset: offsets[index], easing: easing[index], opacity,
  transform: `translate3d(0, ${y}px, -1px) scale(${xScale}, ${yScale})`,
}));
const lightFrames: Keyframe[] = [
  [-100, 0], [-65, .025], [-20, .07], [10, .09], [60, .035], [95, 0], [100, 0],
].map(([x, opacity], index) => ({
  offset: offsets[index], easing: easing[index], opacity,
  transform: `translate3d(${x}%, 0, 0)`,
}));

function setupPhoto(root: HTMLElement, reduced: MediaQueryList, signal: AbortSignal) {
  const control = root.querySelector<HTMLButtonElement>("[data-flip-control]")!;
  const paper = root.querySelector<HTMLElement>("[data-flip-paper]")!;
  const shadow = root.querySelector<HTMLElement>("[data-flip-shadow]")!;
  const light = root.querySelector<HTMLElement>("[data-flip-light]")!;
  const front = root.querySelector<HTMLElement>("[data-flip-front]")!;
  const back = root.querySelector<HTMLElement>("[data-flip-back]")!;
  const story = root.querySelector<HTMLElement>("[data-flip-scroll]")!;
  const layers = [paper, shadow, light];
  let flipped = root.dataset.flipped === "true";
  let tracks: Animation[] = [];
  let fallbackTimer = 0;
  let pointerStart: { x: number; y: number; scroll: number } | undefined;
  let dragged = false;

  const syncScrollable = () => {
    root.dataset.scrollable = flipped
      ? String(story.scrollHeight > story.clientHeight + 2)
      : "false";
  };

  const updateState = () => {
    root.dataset.flipped = String(flipped);
    control.setAttribute("aria-pressed", String(flipped));
    control.setAttribute("aria-label", `${flipped ? "Show front" : "Flip photo"}: ${control.dataset.title}`);
    control.setAttribute("aria-describedby", control.dataset.description!);
    front.setAttribute("aria-hidden", String(flipped));
    back.setAttribute("aria-hidden", String(!flipped));
    syncScrollable();
  };
  const settle = () => {
    updateState();
    tracks.forEach((track) => { track.onfinish = null; track.cancel(); });
    tracks = [];
    window.clearTimeout(fallbackTimer);
    delete root.dataset.animating;
    layers.forEach((layer) => layer.style.removeProperty("will-change"));
  };
  const useFallback = () => {
    root.dataset.fallback = "";
    root.dataset.animating = "";
    paper.style.willChange = "transform";
    window.clearTimeout(fallbackTimer);
    fallbackTimer = window.setTimeout(settle, FLIP_DURATION);
  };

  // Native button clicks cover mouse, touch, Enter and Space without duplicate handlers.
  control.addEventListener("click", (event) => {
    if (event.detail && (dragged || (pointerStart && Math.abs(story.scrollTop - pointerStart.scroll) > 4))) {
      dragged = false;
      pointerStart = undefined;
      return;
    }
    if (window.getSelection()?.toString() && event.target instanceof Node && story.contains(event.target)) return;
    flipped = !flipped;

    if (reduced.matches) { settle(); return; }
    if (typeof paper.animate !== "function") {
      // Establish the old transform before changing the target on the first fallback flip.
      root.dataset.fallback = "";
      void paper.offsetWidth;
      updateState();
      useFallback();
      return;
    }

    updateState();
    root.dataset.animating = "";
    layers.forEach((layer, i) => { layer.style.willChange = i ? "transform, opacity" : "transform"; });
    const now = document.timeline.currentTime as number;
    if (tracks.length) {
      const at = Number(tracks[0].currentTime ?? (flipped ? 0 : FLIP_DURATION));
      // All tracks reverse from the same sampled playhead, including pending animations.
      tracks.forEach((track) => {
        track.reverse();
        track.currentTime = at;
        track.startTime = now - at / (flipped ? 1 : -1);
      });
    } else {
      const direction = flipped ? 1 : -1;
      const at = flipped ? 0 : FLIP_DURATION;
      tracks = layers.map((layer, i) => {
        const track = layer.animate([paperFrames, shadowFrames, lightFrames][i], { duration: FLIP_DURATION, fill: "both" });
        track.pause();
        track.currentTime = at;
        track.playbackRate = direction;
        track.play();
        track.startTime = now - at / direction;
        return track;
      });
      tracks[0].onfinish = () => {
        if (tracks[0]?.playState === "finished") settle();
      };
    }
  }, { signal });

  control.addEventListener("pointerdown", (event) => {
    pointerStart = { x: event.clientX, y: event.clientY, scroll: story.scrollTop };
    dragged = false;
  }, { signal });
  control.addEventListener("pointermove", (event) => {
    if (pointerStart && event.buttons && Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) > 6) dragged = true;
  }, { signal });
  if (typeof ResizeObserver !== "undefined") {
    const observer = new ResizeObserver(() => {
      if (flipped) syncScrollable();
    });
    observer.observe(root);
    signal.addEventListener("abort", () => observer.disconnect(), { once: true });
  }
  control.addEventListener("pointercancel", () => { dragged = true; }, { signal });
  // The story remains within the single button. Arrow keys scroll it without extra tab stops.
  control.addEventListener("keydown", (event) => {
    if (!flipped) return;
    const distances: Record<string, number> = { ArrowDown: 40, ArrowUp: -40, PageDown: story.clientHeight, PageUp: -story.clientHeight };
    if (event.key in distances) {
      event.preventDefault();
      story.scrollTop += distances[event.key];
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      story.scrollTop = event.key === "Home" ? 0 : story.scrollHeight;
    }
  }, { signal });
  reduced.addEventListener("change", () => {
    if (reduced.matches) {
      delete root.dataset.fallback;
      settle();
    }
  }, { signal });
  updateState();
  return settle;
}

onPageLoad((signal) => {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const roots = Array.from(document.querySelectorAll<HTMLElement>("[data-pixel-photo]"));
  const titleColors = pickShuffledTitleColors(roots.length);
  const cleanups = roots.map((root, index) => {
    const titleEl = root.querySelector<HTMLElement>("[data-flip-title]");
    if (titleEl) titleEl.style.setProperty("--title-color", titleColors[index]);
    return setupPhoto(root, reduced, signal);
  });
  return () => cleanups.forEach((cleanup) => cleanup());
});

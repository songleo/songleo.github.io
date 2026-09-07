let cleanup: (() => void) | undefined;

function setupScrollProgress(): void {
  cleanup?.();

  const container = document.querySelector<HTMLElement>("#btt-btn-container");
  const button = document.querySelector<HTMLButtonElement>(
    "[data-button='back-to-top']"
  );
  const indicator = document.querySelector<HTMLElement>("#progress-indicator");
  const bar = document.querySelector<HTMLElement>("#myBar");
  if (!container || !button || !indicator || !bar) return;

  const controller = new AbortController();
  let frame = 0;

  function update(): void {
    frame = 0;
    const root = document.documentElement;
    const total = root.scrollHeight - root.clientHeight;
    const progress =
      total > 0 ? Math.min(1, Math.max(0, root.scrollTop / total)) : 0;
    const percent = progress * 100;

    bar!.style.width = `${percent}%`;
    indicator!.style.setProperty(
      "background-image",
      `conic-gradient(var(--accent), var(--accent) ${percent}%, transparent ${percent}%)`
    );

    const visible = progress > 0.3;
    container!.classList.toggle("opacity-100", visible);
    container!.classList.toggle("translate-y-0", visible);
    container!.classList.toggle("opacity-0", !visible);
    container!.classList.toggle("translate-y-14", !visible);
    container!.style.visibility = visible ? "visible" : "hidden";
  }

  function scheduleUpdate(): void {
    if (!frame) frame = requestAnimationFrame(update);
  }

  const options = { passive: true, signal: controller.signal };
  document.addEventListener("scroll", scheduleUpdate, options);
  window.addEventListener("resize", scheduleUpdate, options);
  button.addEventListener(
    "click",
    () => window.scrollTo({ top: 0, left: 0, behavior: "instant" }),
    { signal: controller.signal }
  );

  cleanup = () => {
    controller.abort();
    cancelAnimationFrame(frame);
    cleanup = undefined;
  };
  update();
}

document.addEventListener("astro:page-load", setupScrollProgress);
document.addEventListener("astro:before-swap", () => cleanup?.());

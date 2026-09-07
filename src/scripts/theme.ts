const THEME_KEY = "theme";
const LIGHT = "light";
const DARK = "dark";

function getPreferredTheme(): string {
  try {
    return localStorage.getItem(THEME_KEY) === LIGHT ? LIGHT : DARK;
  } catch {
    return DARK;
  }
}

// Reuse the value already set by the inline FOUC-prevention script if available.
let themeValue: string =
  (window as unknown as { __theme?: { value: string } }).__theme?.value ??
  getPreferredTheme();

function persist(): void {
  reflect();
  try {
    localStorage.setItem(THEME_KEY, themeValue);
  } catch {
    // Keep the theme usable for this session when storage is unavailable.
  }
}

function reflect(): void {
  const root = document.firstElementChild;
  root?.setAttribute("data-theme", themeValue);
  root?.classList.toggle("dark", themeValue === DARK);
  document
    .querySelector("#theme-btn")
    ?.setAttribute("aria-pressed", String(themeValue === DARK));

  // Fill <meta name="theme-color"> with the computed background colour so
  // Android's browser chrome matches the page background.
  const bg = window.getComputedStyle(document.body).backgroundColor;
  document
    .querySelector("meta[name='theme-color']")
    ?.setAttribute("content", bg);
}

function setup(): void {
  reflect();
  document.querySelector("#theme-btn")?.addEventListener("click", () => {
    themeValue = themeValue === LIGHT ? DARK : LIGHT;
    persist();
  });
}

setup();

// Re-run after View Transitions navigation.
document.addEventListener("astro:after-swap", setup);

// Carry the theme-color value across View Transitions to prevent the
// Android navigation bar from flashing during page transitions.
document.addEventListener("astro:before-swap", event => {
  const color = document
    .querySelector("meta[name='theme-color']")
    ?.getAttribute("content");
  if (color) {
    (event as { newDocument: Document }).newDocument
      .querySelector("meta[name='theme-color']")
      ?.setAttribute("content", color);
  }
});

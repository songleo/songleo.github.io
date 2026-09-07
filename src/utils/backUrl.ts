const BACK_URL_KEY = "backUrl";
let memoryBackUrl: string | null = null;

function normalizeBackUrl(value: string | null): string | null {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value, window.location.href);
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.origin !== window.location.origin ||
      url.username ||
      url.password
    ) {
      return null;
    }
    // Keep an absolute same-origin URL: paths starting with // must not become
    // protocol-relative links when assigned to an anchor.
    return url.href;
  } catch {
    return null;
  }
}

export function rememberBackUrl(value: string): void {
  const url = normalizeBackUrl(value);
  if (!url) return;
  memoryBackUrl = url;
  try {
    sessionStorage.setItem(BACK_URL_KEY, url);
  } catch {
    // Client-side navigation can retain the last list even without storage.
  }
}

export function readBackUrl(): string | null {
  if (memoryBackUrl) return memoryBackUrl;
  try {
    return normalizeBackUrl(sessionStorage.getItem(BACK_URL_KEY));
  } catch {
    return null;
  }
}

"""Check rendered HTML using only the Python standard library; no network I/O."""

import argparse
import collections
import json
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urljoin, urlsplit

ROOT = Path(__file__).resolve().parents[1]
SITE = "https://reborncodinglife.com/"
HOSTS = {"reborncodinglife.com", "www.reborncodinglife.com", "songleo.github.io"}
ASCII_WHITESPACE = " \t\n\r\f"


def srcset_urls(value):
    """Extract candidates without splitting commas inside URLs (including data:).

    Follow the HTML srcset URL/descriptor tokenization rules. Descriptor validity
    and browser source selection are outside this resource-existence check.
    https://html.spec.whatwg.org/multipage/images.html#parsing-a-srcset-attribute
    """
    position = 0
    while position < len(value):
        while position < len(value) and value[position] in ASCII_WHITESPACE + ",":
            position += 1
        start = position
        while position < len(value) and value[position] not in ASCII_WHITESPACE:
            position += 1
        url = value[start:position]
        if not url:
            return
        yield url.rstrip(",")
        if url.endswith(","):
            continue
        # Consume descriptors until the next comma outside parentheses.
        in_parens = False
        while position < len(value):
            char = value[position]
            position += 1
            if char == ")":
                in_parens = False
            elif char == "(" and not in_parens:
                in_parens = True
            elif char == "," and not in_parens:
                break


class Page(HTMLParser):
    def __init__(self, html):
        super().__init__(convert_charrefs=True)
        self.elements = []
        self.ids = set()
        self.title = ""
        self.in_title = False
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        self.elements.append((tag, attrs))
        if attrs.get("id"):
            self.ids.add(attrs["id"])
        if tag == "a" and attrs.get("name"):
            self.ids.add(attrs["name"])
        if tag == "title":
            self.in_title = True

    def handle_endtag(self, tag):
        if tag == "title":
            self.in_title = False

    def handle_data(self, data):
        if self.in_title:
            self.title += data


def check(dist, exceptions):
    # POSIX relative strings enforce Linux filename case even when run on Windows.
    files = {p.relative_to(dist).as_posix() for p in dist.rglob("*") if p.is_file()}
    pages = {f: Page((dist / f).read_text(encoding="utf-8")) for f in sorted(files) if f.endswith(".html")}
    if "index.html" not in pages:
        raise ValueError("No built homepage. Run pnpm build before check:content.")
    findings = set()
    titles = collections.defaultdict(list)
    for file, page in pages.items():
        route = "/" + file.removesuffix("index.html")
        og_types = [attrs.get("content", "") for tag, attrs in page.elements
                    if tag == "meta" and attrs.get("property") == "og:type"]
        if len(og_types) > 1:
            findings.add(("duplicate-og-type", file, ", ".join(og_types)))
        if any(tag == "meta" and attrs.get("property") == "og:type" and attrs.get("content") == "article" for tag, attrs in page.elements):
            titles[" ".join(page.title.split()).casefold()].append(file)
        for tag, attrs in page.elements:
            if tag == "a" and attrs.get("target", "").lower() == "_blank":
                if not {"noopener", "noreferrer"} <= set(attrs.get("rel", "").lower().split()):
                    findings.add(("unsafe-blank", file, attrs.get("href", "")))
            if tag == "img" and not attrs.get("alt", "").strip():
                # Empty alt is legitimate only for explicitly decorative images.
                if attrs.get("role") not in {"presentation", "none"} and attrs.get("aria-hidden") != "true":
                    findings.add(("missing-alt", file, attrs.get("src", "")))
            refs = []
            if tag in {"a", "link"} and attrs.get("href"):
                refs.append((attrs["href"], tag != "a"))
            if tag in {"img", "script", "iframe", "source", "audio", "video", "embed", "input"} and attrs.get("src"):
                refs.append((attrs["src"], True))
            if tag == "video" and attrs.get("poster"):
                refs.append((attrs["poster"], True))
            if tag == "object" and attrs.get("data"):
                refs.append((attrs["data"], True))
            for attribute in ("srcset", "imagesrcset"):
                if attrs.get(attribute):
                    refs.extend((url, True) for url in srcset_urls(attrs[attribute]))
            for value, resource in refs:
                try:
                    parsed = urlsplit(urljoin(SITE.rstrip("/") + route, value))
                    # urlsplit defers validation of malformed ports until access.
                    parsed.port
                except ValueError:
                    findings.add(("invalid-url", file, value))
                    continue
                if parsed.scheme not in {"http", "https"}:
                    continue
                if parsed.scheme == "http":
                    kind = "http-resource" if resource else "http-link"
                    findings.add((kind, file, value))
                if parsed.hostname not in HOSTS:
                    continue
                path = unquote(parsed.path).lstrip("/")
                candidates = [path, path.rstrip("/") + "/index.html"] if path else ["index.html"]
                target = next((candidate for candidate in candidates if candidate in files), None)
                if target is None:
                    findings.add(("broken-local", file, value))
                elif parsed.fragment and target in pages and unquote(parsed.fragment) not in pages[target].ids:
                    findings.add(("broken-fragment", file, value))
    for title, owners in titles.items():
        if len(owners) > 1:
            for file in owners:
                findings.add(("duplicate-title", file, title))
    allowed = {(e["kind"], e["file"], e["value"]): e["reason"] for e in exceptions}
    if len(allowed) != len(exceptions):
        raise ValueError("Duplicate exception entries are not allowed.")
    if any(kind != "http-link" for kind, _, _ in allowed):
        raise ValueError("Only documented HTTP navigation links may be excepted.")
    if any(not reason.strip() for reason in allowed.values()):
        raise ValueError("Every exception requires a reason.")
    unexpected = sorted(findings - allowed.keys())
    stale = sorted(allowed.keys() - findings)
    return pages, findings, unexpected, stale


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dist", type=Path, default=ROOT / "dist")
    parser.add_argument("--exceptions", type=Path, default=ROOT / "scripts/content-exceptions.json")
    args = parser.parse_args()
    try:
        exceptions = json.loads(args.exceptions.read_text(encoding="utf-8"))
        pages, findings, unexpected, stale = check(args.dist, exceptions)
    except (ValueError, OSError) as error:
        print(f"ERROR: {error}")
        return 1
    for kind, file, value in unexpected:
        print(f"ERROR {kind}: {file}: {value}")
    for kind, file, value in stale:
        print(f"STALE exception: {kind}: {file}: {value}")
    print(f"Checked {len(pages)} HTML pages; {len(unexpected)} new issues; "
          f"{len(findings) - len(unexpected)} documented exceptions; {len(stale)} stale exceptions.")
    return int(bool(unexpected or stale))


if __name__ == "__main__":
    raise SystemExit(main())

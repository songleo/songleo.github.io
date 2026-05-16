# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Jekyll-based GitHub Pages personal blog (LEo的网络日志) at [reborncodinglife.com](http://reborncodinglife.com), built on the Scribble theme. ~305 blog posts dating back to 2016.

## Commands

```bash
# Install dependencies
bundle install

# Build the site (output in _site/)
bundle exec jekyll build

# Dev server with live reload
bundle exec jekyll server

# Full dev mode: Jekyll + SCSS watch + CoffeeScript watch (see Rakefile)
bundle exec rake
```

No test suite exists for this project.

## Architecture

**Templates (Jekyll Liquid):**
- `_layouts/` — Three layouts: `index.html` (homepage with post list), `page.html` (static pages like /about), `post.html` (individual blog posts with Disqus, prev/next links)
- `_includes/` — Reusable fragments: `head.html` (CSS, JS, OG metadata), `header.html`, `footer.html` (RSS link), `links.html` (nav from `_config.yml`), `pages.html` (prev/next post navigation), `disqus.html`, `ga.html` (legacy GA, unused), `signoff.html`
- `index.html` (root) — Iterates `site.posts`, renders post list with pretty dates

**Frontend assets:**
- SCSS sources in `_assets/` (uses Bourbon mixin library, compiled to `stylesheets/`)
- CoffeeScript in `_assets/` (compiled to `javascripts/basics.js`)
- `javascripts/pd.js` — Pretty-date rendering ("Today", "Yesterday", "3 days ago")
- `javascripts/ruby-cm.js` — CodeMirror-based syntax highlighting
- Arrow key navigation in `pd.js`: left/right arrows navigate between posts via `.paging` links

**Content:**
- All blog posts are in `_posts/` with filenames matching `YYYY-MM-DD-slug.md`
- Post frontmatter: `layout: post`, `title`, `date`, and optionally `disqus: y`, `share: y`
- `about.md` — Static about page (layout: page)
- `feed.xml` — RSS feed (last 10 posts)
- `CNAME` — Custom domain: `reborncodinglife.com`

**Configuration (`_config.yml`):**
- `highlighter: rouge`, `markdown: kramdown`, `permalink: pretty`
- Nav links defined under `links:` (about, blog, github)
- `url: http://reborncodinglife.com`
- Note: `highlighter` is misspelled as `highlighter` — Jekyll silently tolerates this but if Rouge highlighting stops working, check spelling.

**`src/https/`** — Go TLS client/server examples with test certificates (allowlisted in `.gitleaks.toml` since these are example keys, not real secrets).

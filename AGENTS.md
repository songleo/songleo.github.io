# Repository Guidelines

## Project Overview and Sources of Truth

This is the Astro 7/AstroPaper 6.1 source for `https://reborncodinglife.com/`.
The production site is built from `main` by `.github/workflows/deploy.yml` and
deployed with GitHub Pages Actions.

- Active posts live in `src/content/posts/`; edit these files for site content.
- `_posts/` is the retained Jekyll source archive. Do not edit it for normal
  publishing and do not treat it as the active content collection.
- `scripts/migrate_jekyll_posts.py` is a one-time migration utility, not a normal
  authoring command. Running it over active posts can overwrite manually curated
  front matter such as tags.
- The pre-Astro Jekyll site is recoverable from the
  `jekyll-before-astro-paper-current-20260904` tag.
- Upstream theme provenance is recorded in `ASTROPAPER_SOURCE.md`.

## Project Structure

- `src/content/posts/`: canonical Markdown and MDX blog posts.
- `src/content/pages/`: standalone content such as the About page.
- `src/pages/`: Astro routes, including posts, tags, archives, RSS, and legacy
  date-based redirects.
- `src/components/` and `src/layouts/`: reusable UI and page composition.
- `src/styles/` and `src/assets/`: source styles and bundled assets.
- `src/i18n/`: Chinese and English interface strings.
- `astro-paper.config.ts`: site identity, pagination, features, and social links.
- `astro.config.ts`: Astro integrations, Markdown behavior, and build settings.
- `public/`: files copied unchanged to the site, including `CNAME`, images,
  favicon, and the default social image.
- `.github/workflows/deploy.yml`: production build and Pages deployment.

Do not commit generated `dist/`, `.astro/`, `node_modules/`, or
`public/pagefind/` content.

## Post and Front Matter Conventions

Published posts should use a lowercase, hyphen-separated
`YYYY-MM-DD-short-slug.md` filename. The date prefix also powers redirects from
the former Jekyll URL, so do not rename an existing published post without
preserving its old route.

Every post must include schema-valid front matter:

```yaml
---
title: "Concise title"
description: "A useful summary for listings and metadata."
pubDatetime: 2026-09-04T12:00:00+08:00
tags: ["kubernetes", "云原生"]
---
```

- Required fields are `title`, `description`, `pubDatetime`, and `tags`.
- Use a full ISO 8601 timestamp with an explicit timezone.
- Use `draft: true` for content that must not appear in production.
- Use `modDatetime` only for a meaningful published-content update.
- Optional fields such as `featured`, `ogImage`, `canonicalURL`, and
  `hideEditPost` must follow `src/content.config.ts`.
- Keep English product and technology names lowercase in prose and headings,
  except where code, commands, identifiers, or quoted text are case-sensitive.
- Preserve the original article's voice and scenario when editing; remove
  repetition without replacing useful content.

## Tagging Guidelines

- Give each post two to four relevant tags.
- Use lowercase English for products, technologies, languages, and standards,
  such as `kubernetes`, `golang`, `prometheus`, and `chatgpt`.
- Use Chinese for themes and content types, such as `云原生`, `故障排查`,
  `学习笔记`, and `最佳实践`.
- Search existing front matter before introducing a tag. Reuse the established
  spelling and prefer a broader existing tag over a one-post synonym.
- Keep series tags consistent across every entry in the series.
- Avoid `others`, duplicate meanings, case-only variants, and new singleton tags
  unless the term is expected to become a recurring topic.
- When changing tags in bulk, report the unique-tag count and confirm that every
  post still has two to four tags.

## Development and Validation

Use Node.js 22.12 or newer and the committed pnpm lockfile.

- `pnpm install --frozen-lockfile` installs the exact dependency graph.
- `pnpm dev` starts the local development server.
- `pnpm build` runs `astro check` and produces the static site in `dist/`.
- `pnpm preview` serves the production build locally.
- `pnpm lint` checks TypeScript, JavaScript, and Astro source.
- `pnpm format:check` checks formatting without rewriting files.

Validation should match the change:

- For post-only changes, inspect front matter, links, images, Markdown fences,
  and the resulting article and tag routes.
- For components, layouts, configuration, or styles, run `pnpm build` and check
  desktop and narrow layouts locally.
- Check navigation, syntax highlighting, light/dark mode, RSS, archives, tags,
  and previous/next links when those areas are affected.
- Run `git diff --check` before review or commit.
- Do not rewrite unrelated files solely to satisfy formatting preferences.

## Compatibility and Production Configuration

- Keep `src/pages/[year]/[month]/[day]/[slug]/index.astro` working so historical
  Jekyll links continue to reach the matching `/posts/.../` page.
- Use HTTPS for new external assets and links; HTTP images, scripts, or styles
  may be blocked as mixed content.
- Treat changes to `public/CNAME`, the site URL, analytics, verification values,
  RSS, redirects, and GitHub Actions as production-impacting changes.
- Search is currently disabled in `astro-paper.config.ts`; do not commit
  generated Pagefind data unless search is intentionally enabled and verified.

## Git and Publishing Workflow

- Preserve unrelated user changes and keep commits limited to the requested
  scope.
- Use concise imperative commit subjects; avoid vague subjects such as
  `auto commit`.
- Use `codex/` as the default prefix for temporary or review branches.
- When the user asks to review first, leave the changes uncommitted and unpushed
  until explicit approval.
- When the user explicitly requests a direct publish, synchronize with the
  latest `origin/main`, retain intervening remote changes, commit only the
  approved files, and push to `main`.
- A push to `main` triggers the GitHub Pages workflow. Do not manually commit
  build output as a deployment mechanism.
- Pull requests for visual changes should include before/after evidence and note
  the validation performed.

## Security

Never add credentials, private keys, tokens, private environment values, or
personal data. Keep secrets in ignored environment files or repository secrets.
Treat certificate material under `src/https/` as legacy examples, not templates
for new private keys. Review third-party scripts and dependency changes before
publishing them.

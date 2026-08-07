# Repository Guidelines

## Project Structure & Module Organization

This is a Jekyll 3/GitHub Pages blog. Posts live in `_posts/` and follow `YYYY-MM-DD-short-slug.md`. Page templates are in `_layouts/`; reusable Liquid fragments are in `_includes/`. Edit SCSS and CoffeeScript under `_assets/`; generated browser files belong in `stylesheets/` and `javascripts/`. Store static images in `images/`. Root files such as `index.html`, `about.md`, `feed.xml`, and `_config.yml` define site entry points and configuration. `src/` contains examples referenced by articles.

## Build, Test, and Development Commands

- `bundle install` installs the Ruby dependencies pinned in `Gemfile.lock`.
- `bundle exec jekyll build` renders `_site/` and is the primary validation command.
- `bundle exec jekyll server --watch` serves the blog locally and rebuilds changed pages.
- `bundle exec rake` starts Jekyll plus the SCSS and CoffeeScript watchers defined in `Rakefile`; it requires the `scss` and `coffee` executables.

Do not commit the generated `_site/` directory.

## Coding Style & Naming Conventions

Preserve the style of the file being edited. Templates use two-space indentation, Liquid tags, and lowercase HTML class names. Keep reusable markup in `_includes/`. Post front matter should include `layout: post`, a concise `title`, and a full `date`; add `disqus: y` or `share: y` only when needed. Use lowercase, hyphen-separated slugs and descriptive image names. When editing compiled CSS or JavaScript, also consider its `_assets/` source.

## Testing Guidelines

There is no automated test suite or coverage requirement. Before submitting, run `bundle exec jekyll build` and resolve Liquid, Markdown, or front-matter warnings. For layout or asset changes, inspect the page through the local server at desktop and narrow widths. Check links, images, syntax highlighting, and previous/next navigation.

## Commit & Pull Request Guidelines

History uses short subjects such as `fix typo`; no Conventional Commits scheme is enforced. Prefer concise, imperative subjects that identify the change, and avoid vague `auto commit` messages. Pull requests should summarize affected posts or components, state validation performed, and link relevant issues. Include before/after screenshots for visual changes and call out configuration, domain, analytics, or feed changes.

## Security & Configuration

Never add credentials, private keys, tokens, or personal data. Treat existing certificate examples in `src/https/` as legacy fixtures, not templates for new secrets. Review changes to `CNAME`, `_config.yml`, analytics IDs, and external scripts carefully because they affect the deployed site.

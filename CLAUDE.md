# Repository guidance

Read [AGENTS.md](AGENTS.md) for repository rules and [README.md](README.md) for setup, validation, troubleshooting, and publishing.

This is the astro 7 / astropaper 6.1 source for <https://reborncodinglife.com/>. Active posts live in `src/content/posts/`; standalone pages live in `src/content/pages/`. `_posts/` is a historical jekyll archive. Do not edit it for normal publishing or run the one-time migration script over curated content.

Use node.js 24 for parity with CI (minimum 22.12), the pnpm version in `package.json`, and the committed lockfile:

```bash
pnpm install --frozen-lockfile
pnpm dev
pnpm lint
pnpm format:check
pnpm build
pnpm check:content
pnpm preview
```

The content checker also requires python 3.10 or newer, with no third-party packages. Build first: it inspects the generated site in `dist/`.

Configuration lives in `astro-paper.config.ts` and `astro.config.ts`. Keep legacy date-based redirects working. Do not commit `dist/`, `.astro/`, `node_modules/`, or generated pagefind data.

Work on a `codex/` branch when requested. Preserve unrelated changes; leave review work uncommitted and unpushed. Publishing requires explicit user authorization: the `main` push triggers `.github/workflows/deploy.yml`, which builds and deploys a GitHub Pages artifact. Never publish by committing build output.

Use https for public resources and references. Preserve protocol-sensitive examples; document exceptions in [docs/content-quality.md](docs/content-quality.md). Do not add private keys or broaden `.gitleaks.toml` exemptions. `src/https/` contains teaching code; readers generate disposable credentials locally.

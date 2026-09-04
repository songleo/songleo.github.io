# LEo的网络日志

[reborncodinglife.com](https://reborncodinglife.com/) 的 astro 7 / astropaper 6.1 源码。使用 markdown / mdx 写作，通过 github pages actions 发布。

## 快速开始

需要 node.js 22.12 或更高版本；推荐使用与 CI 相同的 node.js 24。安装 `package.json` 中固定的 pnpm 11.3.0。内容检查另需 python 3.10+，无需额外 python 包。

```bash
npm install --global pnpm@11.3.0
pnpm install --frozen-lockfile
pnpm dev
```

开发地址默认是 `http://localhost:4321/`。端口占用时以终端输出为准。

```bash
pnpm lint
pnpm format:check
pnpm build
pnpm check:content
pnpm preview
```

`build` 先运行 `astro check`，再生成 `dist/`；`preview` 预览已构建的生产结果，不会自动重新构建。`check:content` 检查构建后的链接、资源、alt、新标签页语义和重复文章标题，具体范围及历史例外见 [内容质量说明](docs/content-quality.md)。

## 写作与目录

| 路径                                             | 用途                                          |
| ------------------------------------------------ | --------------------------------------------- |
| `src/content/posts/`                             | 当前文章，文件名为 `YYYY-MM-DD-short-slug.md` |
| `src/content/pages/`                             | 关于等独立页面                                |
| `src/content.config.ts`                          | front matter schema                           |
| `src/pages/`                                     | 路由、rss、标签、归档和旧链接重定向           |
| `src/components/`、`src/layouts/`、`src/styles/` | 页面组件、布局和样式                          |
| `astro-paper.config.ts`                          | 站点信息、分页、功能和社交链接                |
| `astro.config.ts`                                | 构建、markdown 和集成配置                     |
| `public/`                                        | 原样发布的图片、`CNAME` 等静态文件            |
| `_posts/`                                        | 旧 jekyll 文章档案，不用于日常编辑            |

文章示例：

```yaml
---
title: "文章标题"
description: "用于列表和元数据的简短摘要。"
pubDatetime: 2026-09-05T12:00:00+08:00
tags: ["kubernetes", "学习笔记"]
draft: true
---
```

每篇文章使用 2—4 个已有相关标签。完成后删除 `draft: true` 或设为 `false`。草稿在开发和生产中均隐藏；非草稿的未来文章在开发模式可见，生产构建按发布时间及配置的提前量筛选（当前 15 分钟）。时间到达本身不会触发构建，需后续推送或手动触发部署。

保持已发布文件名稳定，旧 `/年/月/日/slug/` 地址由专用路由重定向。不要为日常写作运行 `scripts/migrate_jekyll_posts.py`，它可能覆盖人工维护的 front matter。完整协作规则见 [AGENTS.md](AGENTS.md)，主题来源见 [ASTROPAPER_SOURCE.md](ASTROPAPER_SOURCE.md)。

## 发布与边界

1. 在修改分支完成编辑与检查，提交前运行 `git diff --check`，仅包含本次范围内文件。
2. pull request 触发 `.github/workflows/ci.yml`，检查代码、格式、构建和内容质量。
3. 获得发布授权后合入 `main`；推送自动触发 `.github/workflows/deploy.yml`。也可从 actions 手动运行，但这同样是正式发布操作。
4. 部署工作流使用固定 pnpm 版本和 node.js 24，通过 `withastro/action` 构建、检查并上传产物，再由 `actions/deploy-pages` 发布到 `github-pages` 环境。

仓库 pages 的 source 应为 **GitHub Actions**。检查 workflow 的 build / deploy 结果及环境链接确认发布状态。`public/CNAME`、站点 url、rss、重定向、analytics、验证值和 workflows 都影响生产。不要提交 `dist/`、`.astro/`、`node_modules/` 或 `public/pagefind/`。搜索当前关闭。

## 常见问题

- **安装失败或锁文件不匹配**：确认 node/pnpm 版本，使用 `pnpm install --frozen-lockfile`，不要为消除报错删除锁文件。
- **文章不可见**：检查目录、front matter、`draft`、带时区的 `pubDatetime`，并重新构建。预览使用的是上一次生产构建。
- **格式检查失败**：只修复提示中与本次变更有关的文件，不要直接全仓执行 `pnpm format`。迁移文章保留原排版。
- **图片或链接异常**：先运行 `pnpm check:content`，核对 `public/` 路径大小写和文件名；公网图片使用 https。外链超时、403、429 需要人工复核，不直接等同于死链。
- **构建成功但网站未更新**：检查 `main` 提交、pages actions 的部署阶段、pages source 和自定义域名配置。仅本地构建不会发布。
- **旧文章链接 404**：检查旧日期路径与文章文件名的对应关系；保留兼容路由，不靠重跑迁移脚本修复。
- **https 教学代码缺少证书**：按 [示例说明](src/https/README.md) 本地生成。历史密钥已公开，不应复用。

迁移前站点保存在 `jekyll-before-astro-paper-current-20260904` tag，仅供历史恢复参考。

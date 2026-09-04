# 内容质量与链接维护

## 可重复运行的门禁

```bash
pnpm build
pnpm check:content
```

需要 python 3.10+，只使用标准库。命令先运行检查器的回归测试，再扫描 `dist/` 的实际 html。CI 和正式部署都执行相同的 lint、格式、构建和内容检查；检查失败时不上传本次部署产物。

检查范围：

- 所有生成页面的本地链接、资源路径及 html 片段，文件名按大小写匹配。
- 实际加载的 HTTP 资源，包括图片、srcset、脚本、样式链接、iframe 和媒体地址。
- 新标签页链接必须显式带 `rel="noopener noreferrer"`；站内导航默认同窗口。
- 图片的 alt 不能为空；装饰图片需显式标记 `role="presentation"`、`role="none"` 或 `aria-hidden="true"`。
- 已生成文章的重复标题；列表页、分页及历史重定向不参与标题去重。
- 未登记的 HTTP 跳转链接，以及已经失效的例外条目。

代码块中的示例不是浏览器实际加载资源，不把它们作为混合内容报错。草稿和尚未生成的未来文章不属于这次 html 检查范围；schema 由 `astro check` 验证。检查器不运行文章里的命令，不检查 css 内部 URL、动态 js 导航，也不联网探测所有外链。成功表示上述静态检查通过，不表示所有第三方页面都可访问。

## HTTP 例外

普通 `<a href="http://…">` 顶层跳转不等同于混合内容；HTTPS 页面加载 HTTP 子资源才属于混合内容。参见 [mdn 说明](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Mixed_content)。新增公网引用及资源仍应优先使用 HTTPS。

`scripts/content-exceptions.json` 为每条保留的可点击 HTTP 链接记录类型、生成文件、精确 URL 和原因，不使用域名通配或目录级豁免。现有 22 条中，19 条是本地服务、占位地址或历史实验路由，另 3 条为待复核的历史外链。不要给加载资源添加豁免来绕过混合内容检查。

代码和配置中的 `localhost`、私网 IP、服务名、代理地址、占位变量及 ACME HTTP-01 示例保留其协议语义；nginx 响应原文和 apache 许可证注释也保留原文。不能直接把演示中的 HTTP 服务替换为 HTTPS。若新增可点击示例，人工确认用途后添加精确条目；更改或删除链接时同步删除旧条目。

## 2026-09-05 审核结果

- `actions/checkout@v7` 是官方提供的现行版本，并非错误引用；将 CI 与 deploy 统一为 v7，关闭凭据持久化。依据：[官方说明](https://github.com/actions/checkout)。
- 原 deploy 未固定 pnpm，现由 `package.json` 的 `packageManager` 统一为 11.3.0，两个流程使用 node.js 24。部署使用 `withastro/action@v6` 提供的 `build-cmd` 在上传前完成检查。依据：[action 参数](https://github.com/withastro/action/blob/main/action.yml)。
- 活跃文章中的 `http://` 出现次数从 167 降至 74，共清理 93 处；保留部分主要是代码、配置与实验示例。8 处 HTTP 图片逐一验证 HTTPS 返回 200 且类型为图片后替换。响应成功只证明端点可访问，不证明内容未变化。
- 旧有道下载地址返回 404，替换为[官方多平台下载页](https://note.youdao.com/download.html)；旧 strings 文档 tls 握手失败，替换为[官方包文档](https://pkg.go.dev/strings)。
- 修正 awx 文章引用缺少 `automation-learning-` 前缀的站内地址，以及自动链接吞入中文正文或标点的问题。
- 补齐 22 处空图片 alt；移除主页 rss 的新标签页行为。
- 修复全站 rss 自动发现错误尾斜线、不存在的 ico 引用以及 404 页的 canonical 地址；保留已有 svg favicon。
- 旧日期重定向原先未使用文章发布过滤器；现与文章路由统一过滤草稿和未到发布时间的文章，防止生成泄露标题且指向未生成文章的跳转页。
- `getSortedPosts.ts` 原有链式调用格式使现有全仓格式检查失败，仅调整该表达式排版以恢复发布检查，不改排序行为。
- 移除 `src/https/` 的 9 个证书、私钥、csr 和序列号产物，取消 `.gitleaks.toml` 的宽泛放行，提供本地生成说明。证书均于 2022 年到期；是否曾被其他环境使用为 **UNKNOWN**。本次不重写 git 历史。

以下公网引用仍需人工复核，不绕过证书校验，也不声称已修复原站点：

| 原地址 | 状态与原因 | 负责方及下一步 |
| --- | --- | --- |
| `http://underthehood.blog.51cto.com/2531780/1663604` | **UNKNOWN**：HTTPS 证书域名不匹配 | 原站维护者修复证书；博主确认文章的新规范地址后替换 |
| `http://dockone.io/article/6019` | **UNKNOWN**：HTTPS 证书链未通过本机校验 | 原站维护者核对证书链；博主重试并核对文章内容 |
| `http://m.v.qq.com/play/play.html?vid=w01469paeqb&ptag=4_6.1.1.21692_copy` | **UNKNOWN**：HTTPS 请求超时 | 视频提供方确认可用入口；博主确认相同视频后替换 |

oreilly、stackoverflow 的 HTTPS 端点有有效 TLS 响应，但请求返回 403，已改为 HTTPS，正文可访问性仍为 **UNKNOWN**。京东部分商品跳转首页，廖雪峰旧教程跳转首页，微信公众号可能返回验证页，百度分享返回 200 也不保证分享内容有效。它们不是已确认有效的文章/商品内容；后续维护需在正常浏览器中核对原主题，不应仅按状态码删除历史引用。

## 本地验证记录

node.js 24.19.0、pnpm 11.3.0 下，lint、格式、`astro check`、生产构建和 `git diff --check` 通过。生成 940 个页面，内容检查 0 个新增问题，22 个已说明的 HTTP 链接例外，0 个过期例外；检查器的 6 项回归测试通过。

另外添加临时草稿及 2099 年未来文章后执行生产构建，确认两者的文章页、旧日期跳转、标题、rss 和站点地图均未进入生成输出；临时文件已删除。Chrome 验证了桌面和 390px 窄屏首页、明暗切换、移动菜单、旧日期跳转、文章图片和代码显示。未触发远程 actions、未部署，也未执行完整 git 历史的 gitleaks 扫描。

## 外链复核方法

先核对原始 URL 及文章语境，再用正常证书验证访问对应的 HTTPS 地址，检查重定向目标、页面主题和资源类型。403、429、验证码或超时记为待复核；只有确认 404/410 或内容已撤下时才记为失效。优先替换为同一发布者的规范地址。不要请求本地、私网、集群和占位示例地址，也不要为了探测而下载完整安装包。公网状态会变化，因此不让实时外链网络探测成为每次发布的硬门禁。

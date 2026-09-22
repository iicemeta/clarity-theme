# Clarity Theme 发布兼容性矩阵

[English](./COMPATIBILITY.md) | **简体中文**

> 注意：英文原版表格由脚本生成并校验同步；本中文版为人工同步的翻译快照，脚本重新生成时只会更新英文原版。

> 本文档由 `scripts/compatibility-cases.mjs` 中的 `compatibilityContract` 生成，请勿手改表格。
> 重新生成：`node scripts/test-compatibility.mjs --update-docs`；`pnpm test:contract` 会在 CI 中校验同步。

契约只断言「功能是否存在、配置是否生效、路由是否正确、输出是否正确」，不追求覆盖 UI 细节。

## 运行命令

| 命令 | 覆盖范围 | CI |
| --- | --- | --- |
| `pnpm test:contract` | 契约完整性 + 文档同步（无构建，秒级） | Layer 1 · typecheck job |
| `pnpm test:compatibility` | playground 生产构建 SSR + 真实浏览器 + dev hydration | Layer 3 · consumer job |
| `pnpm test:consumer` | pnpm pack → 独立 consumer 安装 → exports / typecheck → 3 组 generate 配置分支 | Layer 3 · consumer job |

调试单条用例：`node scripts/test-compatibility.mjs --filter=mdc`（匹配 case id 或分组）。

## 状态说明

- ✅ Automated：对应测试在 CI 中必须通过；`compat:*` 为渲染回归用例，`consumer:*` 为独立消费者验收用例。
- ⚙️ Partial：只锁定了契约子集（例如构建脚手架行为），边界写在 Expected behavior 中。

## 第一组 · Public API

| 功能 | 输入 | 预期行为 | 测试命令 | 状态 |
| --- | --- | --- | --- | --- |
| clarity-theme（Layer 根入口） | consumer nuxt.config.ts 中 extends: ['clarity-theme'] | Layer 配置、组件、模块与 server 路由全部进入 consumer 构建，nuxt generate 成功 | `pnpm test:consumer` | ✅ Automated<br>`consumer:generate-default`<br>`consumer:generate-branches` |
| clarity-theme/config | import defineClarityConfig；import type FeedGroup / ClarityUiConfig 等 | Node ESM 可解析可调用（默认值填充）；类型经 nuxt typecheck 真实编译 | `pnpm test:consumer` | ✅ Automated<br>`consumer:exports-smoke`<br>`consumer:typecheck` |
| clarity-theme/content | import createClarityContentConfig；import type ArticleSchema | 工厂函数可导入；配合 consumer content.config.ts 真实生成内容集合与页面 | `pnpm test:consumer` | ✅ Automated<br>`consumer:exports-smoke`<br>`consumer:typecheck`<br>`consumer:generate-default` |
| clarity-theme/schema | import clarityConfigSchema；import type ClarityConfig | zod schema 可在纯 Node 中 parse 站点配置；类型与运行时校验一致 | `pnpm test:consumer` | ✅ Automated<br>`consumer:exports-smoke`<br>`consumer:typecheck` |
| clarity-theme/img | import getImgUrl / OicqAvatarSize / getGithubIcon / getFavicon | 纯 Node 中返回确定 URL；ImgService 类型约束非法图床名 | `pnpm test:consumer` | ✅ Automated<br>`consumer:exports-smoke`<br>`consumer:typecheck` |

## 第二组 · 核心功能

| 功能 | 输入 | 预期行为 | 测试命令 | 状态 |
| --- | --- | --- | --- | --- |
| Markdown | playground / consumer 的 Markdown 基准页 | 标题 / 列表 / 表格 / 脚注 / 任务列表 / 删除线等渲染为语义 HTML，无原始语法泄漏 | `pnpm test:compatibility && pnpm test:consumer` | ✅ Automated<br>`compat:A-markdown`<br>`compat:A-markdown-client`<br>`compat:A-markdown-hydration`<br>`consumer:generate-default` |
| MDC | ::alert / :tip / ::card-list / :::folding / :badge | MDC 组件渲染为 Theme 组件 HTML，消费者同名组件可覆盖 | `pnpm test:compatibility && pnpm test:consumer` | ✅ Automated<br>`compat:C-mdc`<br>`compat:C-mdc-client`<br>`compat:C-mdc-hydration`<br>`consumer:generate-default` |
| Code | inline / fenced / meta（filename、icon、wrap、tab-size、highlight）代码基准 | Shiki 高亮、meta 信息与缩进展开正确，payload 携带 highlights 元数据 | `pnpm test:compatibility && pnpm test:consumer` | ✅ Automated<br>`compat:B-code`<br>`compat:B-code-client`<br>`compat:B-code-hydration`<br>`consumer:generate-default` |
| Math | 行内 $...$ 与块级 $$...$$ 公式 | SSR 输出 KaTeX HTML，客户端无 katex-error | `pnpm test:compatibility && pnpm test:consumer` | ✅ Automated<br>`compat:D-math`<br>`compat:D-math-client`<br>`compat:D-math-hydration`<br>`consumer:generate-default` |
| Mermaid | fenced mermaid 代码块 | remark-code-component 转交 Mermaid 组件，客户端渲染 svg 且无错误回退 | `pnpm test:compatibility && pnpm test:consumer` | ✅ Automated<br>`compat:D-mermaid`<br>`compat:D-mermaid-client`<br>`compat:D-mermaid-hydration`<br>`consumer:generate-default` |
| Music | fenced abc 乐谱代码块 | MusicScore (abcjs) 客户端渲染五线谱 svg | `pnpm test:compatibility && pnpm test:consumer` | ✅ Automated<br>`compat:D-music`<br>`compat:D-music-client`<br>`compat:D-music-hydration` |
| Image | Markdown 图片与 ::pic 组件 | NuxtImg 生成 srcset，Pic 渲染 figure / figcaption / zoom 光标 | `pnpm test:compatibility && pnpm test:consumer` | ✅ Automated<br>`compat:D-image`<br>`compat:D-image-client`<br>`compat:D-image-hydration`<br>`consumer:generate-default` |
| Search | 首页侧栏搜索入口 + 输入 clarity | MiniSearch 弹层打开并返回 hello-clarity 相关结果 | `pnpm test:compatibility` | ✅ Automated<br>`compat:F-site-shell`<br>`compat:F-search-client` |
| TOC | 带 H2/H3 的文章页 | 右侧栏渲染文章目录锚点 | `pnpm test:compatibility` | ✅ Automated<br>`compat:F-toc` |
| Archive | /archive 路由 + posts 内容 | 按年分组渲染归档卡片与统计，hydration 无告警 | `pnpm test:compatibility` | ✅ Automated<br>`compat:F-archive`<br>`compat:F-archive-hydration` |
| Pagination | playground app.config 覆盖 pagination.perPage=1，访问 /?page=2 | 第 2 页仅含第二篇文章，分页导航与标题正确，hydration 无告警 | `pnpm test:compatibility` | ✅ Automated<br>`compat:F-pagination`<br>`compat:F-pagination-client`<br>`compat:F-home-hydration` |
| Theme toggle | 点击深色模式按钮 | html class 与 localStorage 偏好切换为 dark，active 态跟随 | `pnpm test:compatibility` | ✅ Automated<br>`compat:F-site-shell`<br>`compat:F-theme-toggle-client` |
| SEO | 站点与文章元数据（title / description / author） | canonical、og:site_name、og:description、WebSite JSON-LD 正确输出 | `pnpm test:compatibility && pnpm test:consumer` | ✅ Automated<br>`compat:F-seo-home`<br>`compat:F-seo-article`<br>`consumer:generate-default` |
| robots | clarity.config 的 site.url 与 article.robotsNotIndex | robots.txt 输出 sitemap 声明与 Disallow 规则 | `pnpm test:compatibility && pnpm test:consumer` | ✅ Automated<br>`compat:F-robots`<br>`consumer:generate-default` |
| sitemap | 全部内容路由（含 permalink） | sitemap.xml 使用站点规范 URL 输出首页 / 归档 / 文章路由 | `pnpm test:compatibility && pnpm test:consumer` | ✅ Automated<br>`compat:F-sitemap`<br>`consumer:generate-default` |
| llms | site.url / title / description 注入 nuxt-llms | /llms.txt 输出站点标题、描述与内容索引 | `pnpm test:compatibility` | ✅ Automated<br>`compat:F-llms`<br>`consumer:generate-default` |
| atom | feed.limit 与内容集合 | /atom.xml 输出站点 id、自引用与文章链接 | `pnpm test:compatibility && pnpm test:consumer` | ✅ Automated<br>`compat:F-atom`<br>`consumer:generate-default`<br>`consumer:generate-branches` |
| opml | feeds.ts 友链数据 | /subscriptions.opml 输出站点自身与友链订阅 | `pnpm test:compatibility && pnpm test:consumer` | ✅ Automated<br>`compat:F-opml`<br>`consumer:generate-default` |
| stats | stats.includePaths = posts/% | /api/stats 输出文章数、字数、分类与标签统计 | `pnpm test:compatibility && pnpm test:consumer` | ✅ Automated<br>`compat:F-stats`<br>`consumer:generate-default` |
| permalink | frontmatter permalink 覆盖文件路由 | 自定义路由可访问并生成，原文件路由 404 | `pnpm test:compatibility && pnpm test:consumer` | ✅ Automated<br>`compat:E-permalink`<br>`compat:E-permalink-source-hidden`<br>`compat:E-permalink-client`<br>`consumer:generate-default` |
| 404 | 不存在的路由 | 返回 404 状态码与 Theme 404 页面 | `pnpm test:compatibility` | ✅ Automated<br>`compat:E-missing-page`<br>`compat:E-hidden-posts-prefix` |

## 第三组 · 配置分支

| 功能 | 输入 | 预期行为 | 测试命令 | 状态 |
| --- | --- | --- | --- | --- |
| enableStyle=false | consumer 分支配置 feed.enableStyle=false | atom.xml 仍生成，但不含 XSLT 样式声明 | `pnpm test:consumer` | ✅ Automated<br>`consumer:generate-branches` |
| useRandomPermalink=true | consumer 分支配置 article.useRandomPermalink=true | schema 接受并保留该开关；构建不受影响（随机 permalink 生成属于构建脚手架，Theme 运行时只透传该配置） | `pnpm test:consumer` | ⚙️ Partial<br>`consumer:exports-smoke`<br>`consumer:generate-features-off` |
| hidePostPrefix=false | consumer 分支配置 article.hidePostPrefix=false | 文章路由保留 /posts 前缀，无前缀路由不再生成 | `pnpm test:consumer` | ✅ Automated<br>`consumer:generate-branches` |
| stats=false | consumer 分支配置 features.stats=false | routeRules 关闭预渲染，generate 产物中无 api/stats | `pnpm test:consumer` | ✅ Automated<br>`consumer:generate-features-off` |
| atom=false | consumer 分支配置 features.atom=false | routeRules 关闭预渲染（产物无 atom.xml），head 无 alternate 声明 | `pnpm test:consumer` | ✅ Automated<br>`consumer:generate-features-off` |
| opml=false | consumer 分支配置 features.opml=false | routeRules 关闭预渲染，generate 产物中无 subscriptions.opml | `pnpm test:consumer` | ✅ Automated<br>`consumer:generate-features-off` |
| antiMirror=false | 默认配置（playground 与 consumer 默认变体） | 不注入任何反镜像脚本与黑名单数据 | `pnpm test:compatibility && pnpm test:consumer` | ✅ Automated<br>`compat:F-site-shell`<br>`consumer:generate-default` |
| antiMirror=true + blacklist | features.antiMirror={ blacklist: ['mirror.example.com'] } | 页面内联反镜像脚本，黑名单与站点 URL 以 base64 注入 | `pnpm test:consumer` | ✅ Automated<br>`consumer:generate-branches` |
| Twikoo enabled | integrations.twikoo={ envId: 'https://twikoo.consumer.example' } | head 输出 preconnect，文章页渲染 #twikoo 容器 | `pnpm test:consumer` | ✅ Automated<br>`consumer:generate-branches` |
| Twikoo disabled | 未配置 integrations.twikoo | 文章页显示“本文暂未开启评论”，不渲染 #twikoo 容器 | `pnpm test:consumer` | ✅ Automated<br>`consumer:generate-default` |
| custom app.config | consumer app/app.config.ts 覆盖 header.emojiTail；playground 覆盖 pagination.perPage | UI 默认值被消费者覆盖并出现在渲染结果中 | `pnpm test:compatibility && pnpm test:consumer` | ✅ Automated<br>`compat:F-pagination`<br>`consumer:generate-default` |
| custom component override | consumer 提供 app/components/content/Badge.vue | MDC :badge 使用消费者组件（输出 data-consumer-override 标记） | `pnpm test:compatibility && pnpm test:consumer` | ✅ Automated<br>`compat:C-mdc`<br>`consumer:generate-default` |
| custom shiki config | consumer app/shiki.config.ts 覆盖 light / dark 主题 | 构建产物加载自定义主题名，Theme 默认主题不再出现 | `pnpm test:consumer` | ✅ Automated<br>`consumer:generate-default` |

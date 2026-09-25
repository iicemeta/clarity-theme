# MDC 能力审计

[English](./audit.md) | **简体中文**

这是面向维护者的清单：被审计的上游 `blog-v3` 基线中，每一个面向文章的 Markdown/MDC 能力与 Clarity Theme Layer 的逐项比对。它是一份活文档：当上游或 Layer 变化时，请按下方方法重新执行并更新表格、计数与 references——这个页面的存在就是为了让同一个缺口不被发现两次。

## 审计范围

上游侧被审计的表面：

- `app/components/content/**` —— 全部 27 个 content 组件
- `content/**/*.md` —— 90 篇文章，含组件展示页 `content/previews/example.md`
- `content.config.ts`、`nuxt.config.ts`、`package.json`、`pnpm-workspace.yaml`
- `remark-plugins/**` —— `remark-code-component.ts`、`rehype-meta-slots.ts`
- `patches/**` 与 `pnpm-workspace.yaml` 中的补丁注册
- 真实文章中使用的 prose 映射 Markdown 节点与 MDC 语法形式

Theme 侧比对对象：`src/components/content/**`、`src/remark-plugins/**`、`src/components/util/Img.vue`、`src/config/feed.ts`、`src/pages/[...slug].vue`、`src/components/post/PostFooter.vue`、`nuxt.config.ts` 的 `content` 配置块、`playground/content/**` 与 `scripts/compatibility-cases.mjs`。

## 审计方法

1. **实现** —— 阅读每个组件的 `defineProps` / `defineSlots` / 模板；只记录源码中存在的 props 与 slots。属性透传（例如 Folding 的 `open`）按透传如实记录，绝不记作已声明 prop。
2. **使用** —— 对全部上游文章正则搜索容器标签（`::name`）、行内标签（`:name{`/`:name[`）、YAML props 块、`#slot` 行、围栏语言（`mermaid`、`music-abc`）、数学定界符、meta 插槽容器与原始 HTML 包装。下方的使用计数是语料中的出现次数，不是站点数。
3. **管线** —— 追踪 `nuxt.config.ts` → remark/rehype 插件链 → prose 组件 → 依赖 app config 的行为。
4. **比对** —— 先 diff 组件目录，再验证 Layer 注册（`nuxt.config.ts` 的 `components` 路径）与消费者边界（数据、页面、补丁、远程资源）。
5. **验证** —— 将每个能力与兼容性基准（`A-markdown`、`B-code`、`C-mdc`、`D-math`、`D-mermaid`、`D-music`、`D-image`）及浏览器/水合用例交叉核对。

只有当 Layer 携带实现、完成注册、且不需要消费者专属数据、页面或补丁时，能力才标记为 `supported`。基准覆盖情况单独记录——没有基准行的源码验证组件依然是 `supported`，但会注明。

## 摘要

| 能力总数 | supported | conditional | upstream-only | do-not-use |
| ---: | ---: | ---: | ---: | ---: |
| 39 | 30 | 7 | 0 | 2 |

组件层面：上游 27 个 content 组件中，24 个 `supported`，2 个 `conditional`（FeedCard、FeedGroup），1 个 `do-not-use`（MdTitle）。站壳组件 `BlogHeader`（上游一篇文章中可从 MDC 内嵌）额外记为 `do-not-use`。**不存在 upstream-only 组件**——Layer 全部携带。

## 清单

使用计数是被审计上游语料中的出现次数。“基准”列出验证该能力的兼容性用例；“—”表示仅经源码验证。

### 组件

| 能力 | 语法 | 上游使用 | Theme 源码 | 基准 | 状态 | 备注 |
| --- | --- | ---: | --- | --- | --- | --- |
| [Alert](./components/alert.zh-CN.md) | `::alert` | 63 | `src/components/content/Alert.vue` | C-mdc | supported | 类型 tip/info/question/warning/error；card/flat 由 app config 决定 |
| [Badge](./components/badge.zh-CN.md) | `:badge[…]` | 75 | `src/components/content/Badge.vue` | C-mdc | supported | 依据 `link` 自动推导 GitHub 头像 / favicon |
| [Blur](./components/blur.zh-CN.md) | `:blur[…]` / `::blur` | 11 | `src/components/content/Blur.vue` | — | supported | 悬停显现的剧透文本 |
| [CardList](./components/card-list.zh-CN.md) | `::card-list` | 7 | `src/components/content/CardList.vue` | C-mdc | supported | 把普通 ul/ol 变成卡片网格 |
| [Chat](./components/chat.zh-CN.md) | `::chat` + `{caption}` | 23 | `src/components/content/Chat.vue` | — | supported | `{.}` 己方、`{:}` 系统、`{name}` 对方 |
| [Copy](./components/copy.zh-CN.md) | `:copy{…}` | 186 | `src/components/content/Copy.vue` | C-mdc | supported | 可编辑、可撤销的命令行 |
| [EmojiClock](./components/emoji-clock.zh-CN.md) | `:emoji-clock{…}` | 2 | `src/components/content/EmojiClock.vue` | — | supported | 未给 `datetime` 时显示实时时钟 |
| [FeedCard](./components/feed-card.zh-CN.md) | `::feed-card` + YAML | 0（页面驱动） | `src/components/content/FeedCard.vue` | — | conditional | 需要完整 `FeedEntry`；为友链页与消费者 `feeds.ts` 设计 |
| [FeedGroup](./components/feed-group.zh-CN.md) | `::feed-group` + YAML | 0（页面驱动） | `src/components/content/FeedGroup.vue` | — | conditional | 需要 `FeedEntry[]` 数据；不是文章写作工具 |
| [Folding](./components/folding.zh-CN.md) | `::folding` | 16 | `src/components/content/Folding.vue` | C-mdc | supported | `open` 通过属性透传落到 `<details>` |
| [Key](./components/key.zh-CN.md) | `:key{…}` | 9 | `src/components/content/Key.vue` | — | supported | 修饰键组合 `cmd`/`ctrl`/`shift`/`alt`/`meta`/`win` |
| [LinkBanner](./components/link-banner.zh-CN.md) | `::link-banner` + YAML | 20 | `src/components/content/LinkBanner.vue` | — | supported | 背景图链接卡；`title`/`link` 必填 |
| [LinkCard](./components/link-card.zh-CN.md) | `::link-card` + YAML | 52 | `src/components/content/LinkCard.vue` | — | supported | 图标链接卡；`#icon` 插槽覆盖 `icon` prop |
| MdTitle | `::md-title` | 0 | `src/components/content/MdTitle.vue` | — | do-not-use | 上游任何地方都没有使用；目的不明的纯样式包装 |
| [Mermaid](./plugins/mermaid.zh-CN.md) | ` ```mermaid ` 围栏 | 2 | `src/components/content/Mermaid.vue` | D-mermaid | supported | 经 remark-code-component 渲染，而非 `::mermaid` |
| [MusicScore](./plugins/music-abc.zh-CN.md) | ` ```music-abc ` 围栏 | 4 | `src/components/content/MusicScore.vue` | D-music | supported | 播放需要远程 SoundFonts；记谱渲染不受影响 |
| [Pic](./components/pic.zh-CN.md) | `::pic` + YAML / `![]()` | 126 | `src/components/content/Pic.vue` | D-image | supported | 灯箱缩放、`#caption` 插槽、图片镜像服务 |
| [Poetry](./components/poetry.zh-CN.md) | `::poetry` | 8 | `src/components/content/Poetry.vue` | — | supported | 居中诗行块，含 title/author/footer |
| [ProseA](./components/link.zh-CN.md) | `[label](https://example.com)` | 遍布 | `src/components/content/ProseA.vue` | A-markdown | supported | 自动域名图标；`icon=false` 关闭 |
| [ProseCode](./components/inline-code.zh-CN.md) | `` `code`{lang="ts"} `` | 常见 | `src/components/content/ProseCode.vue` | B-code | supported | 双模式：有无 MDC 行内代码补丁均可工作 |
| [ProsePre](./components/code-block.zh-CN.md) | 围栏代码 + meta | 遍布 | `src/components/content/ProsePre.vue` | B-code | supported | `[filename]`、`{lines}`、`wrap`、`expand`、`icon=`、`indent=` |
| [ProseTable](./components/table.zh-CN.md) | Markdown 表格 | 常见 | `src/components/content/ProseTable.vue` | A-markdown | supported | 带开关的滚动容器 |
| [Quote](./components/quote.zh-CN.md) | `::quote` / `:quote[…]` | 66 | `src/components/content/Quote.vue` | — | supported | 大段引用块；`#icon` 插槽 |
| [Tab](./components/tab.zh-CN.md) | `::tab` + `#tabN` | 35 | `src/components/content/Tab.vue` | — | supported | 无 detab 补丁时插槽块内缩进会被吞掉 |
| [Timeline](./components/timeline.zh-CN.md) | `::timeline` + `{caption}` | 8 | `src/components/content/Timeline.vue` | — | supported | 标题行成为 `dt`，其余块成为 `dd` |
| [Tip](./components/tip.zh-CN.md) | `:tip[…]` | 21 | `src/components/content/Tip.vue` | C-mdc | supported | 提示气泡；`copy` 模式复制插槽文本 |
| [VideoEmbed](./components/video-embed.zh-CN.md) | `::video-embed` | 10 | `src/components/content/VideoEmbed.vue` | — | supported | raw/bilibili/bilibili-nano/youtube/douyin/douyin-wide/tiktok |

### 管线、语法与补丁能力

| 能力 | 语法 / 形式 | 上游使用 | Theme 源码 | 基准 | 状态 | 备注 |
| --- | --- | ---: | --- | --- | --- | --- |
| [核心 Markdown](./syntax.zh-CN.md) | 标题、列表、任务、脚注、强调、引用 | 遍布 | Content 管线 | A-markdown | supported | TOC 深度 4；任务列表与脚注已验证 |
| [MDC 语法形式](./syntax.zh-CN.md) | 行内、容器、YAML props、插槽、嵌套 | 遍布 | Content 管线 | C-mdc | supported | 见[语法](./syntax.zh-CN.md) |
| [数学](./plugins/math.zh-CN.md) | `$…$`、`$$…$$` | 存在 | `nuxt.config.ts` 中 remark-math + rehype-katex | D-math | supported | KaTeX CSS 由 Layer 从远程 CDN 加载 |
| [代码组件映射](./plugins/code-component.zh-CN.md) | 围栏语言 → 组件 | 6 | `src/remark-plugins/remark-code-component.mjs` | D-mermaid/D-music | supported | `mermaid`→Mermaid、`music-abc`→MusicScore |
| [Meta 插槽](./plugins/meta-slots.zh-CN.md) | `::meta-copyright`、`:::meta-aside-*` | 5 | `src/remark-plugins/rehype-meta-slots.mjs` | — | conditional | `meta-aside-*` 还需要 frontmatter `aside: [...]` 注册 |
| [阅读时间](./plugins/reading-time.zh-CN.md) | frontmatter `readingTime` | 全部文章 | `nuxt.config.ts` 中 remark-reading-time | E-normal | supported | 自动注入；不要手动设置 |
| [保留 tab 的围栏代码](./plugins/patches.zh-CN.md) | 围栏中的 tab 字符 | 存在 | 消费者补丁 | B-code（空格） | conditional | 需要消费者 `@nuxtjs/mdc` detab 补丁 |
| [小数图片密度](./plugins/patches.zh-CN.md) | `densities="1.5x"` | 存在 | 消费者补丁 | — | conditional | 需要消费者 `@nuxt/image` 补丁 |
| [Shiki 高亮选择器修复](./plugins/patches.zh-CN.md) | `::highlight()` 作用域 | 存在 | 消费者补丁 | — | conditional | 需要消费者 `plain-shiki` 补丁 |
| [ICO 透传](./plugins/patches.zh-CN.md) | `.ico` 进入 IPX | 存在 | 消费者补丁 | — | conditional | 可选站点配方；仅当 ICO 进入 IPX 时需要 |
| 原始 HTML / `:::div` 包装 | Markdown 中的 HTML | 2 | Content 管线 | — | supported | 逃生舱；优先语义化组件 |
| 行内内嵌 Vue 组件 | `:blog-header` | 3 | `src/components/blog/BlogHeader.global.vue` | — | do-not-use | 一篇文章里的站壳演示；不是文章能力 |

## 缺口

1. **没有组件级缺口。** 上游全部 27 个 content 组件都存在于 `src/components/content/` 并被 Layer `components` 配置注册。diff 发现的差异只是适配（相对导入、ProseCode 双模式）。
2. **依赖补丁的行为。** 上游四个补丁会改变文章渲染（tab 保留、小数密度、Shiki 选择器、ICO 透传）。Theme 刻意不携带任何补丁；需要该行为的消费者自行注册。见[补丁策略](../../maintainers/patches.zh-CN.md)与[补丁](./plugins/patches.zh-CN.md)。本次审计没有修改任何代码。
3. **基准覆盖缺口。** `blur`、`chat`、`emoji-clock`、`key`、`link-banner`、`link-card`、`poetry`、`quote`、`tab`、`timeline`、`video-embed`、`feed-card`、`feed-group`、`meta-slots` 没有兼容性基准行。它们凭借源码证据归为 `supported`/`conditional`。补充基准覆盖属于未来的测试工作，不是文档变更。
4. **数据驱动组件。** FeedCard/FeedGroup 期望 `FeedEntry` 数据，并由友链页从消费者 `feeds.ts` 消费。它们也能从 MDC YAML 渲染，但不是通用文章工具。
5. **远程资源。** 数学需要 Layer 注入的 CDN KaTeX 样式表；MusicScore 播放会探测 `paulrosen.github.io` 的 SoundFonts；Badge 自动图片来自 GitHub/webp.se/gstatic 端点。离线消费者应将这些视为 `conditional` 的附加能力。

## 维护流程

上游 blog-v3 新增或修改文章能力时：

1. **找实现** —— 上游 `app/components/content/<Name>.vue`、`remark-plugins/` 文件，或 `nuxt.config.ts` 的 `content` 配置项。
2. **找真实用法** —— 在上游 `content/**/*.md` 搜索 `::name`、`:name{`、`:name[`、YAML 块、`#slot` 行与围栏语言；展示文章是 `content/previews/example.md`。
3. **比对 Theme** —— `src/components/content/<Name>.vue`（或 `src/remark-plugins/`）、`nuxt.config.ts` 中的注册，以及任何消费者边界（数据、页面、补丁、远程资源）。
4. **分类** —— `supported` / `conditional` / `upstream-only` / `do-not-use`，并附证据；绝不只凭存在推断支持。
5. **更新** —— 此处表格、计数、`docs/mdc/components/` 或 `docs/mdc/plugins/` 下的逐项 reference、`skills/article-beautifier/references/_index.md` 机器索引**以及 `skills/article-beautifier/references/` 下的捆绑副本**（Skill 携带这些页面的自包含副本，使 `npx skills add` 无需整个仓库即可工作），以及——当能力稳定且通用时——`playground/content/compatibility/` 加 `scripts/compatibility-cases.mjs` 中的基准。

## 维护者问题的答案

- **上游新增组件后在哪里检查？** 本表维护流程第 1–3 步。
- **哪个文件是真正的实现？** Theme：`src/components/content/*.vue` 与 `src/remark-plugins/*.mjs`。上游：`app/components/content/*.vue` 与 `remark-plugins/*.ts`。
- **哪个文件是文章真实用法？** 上游 `content/**/*.md`；权威展示页是 `content/previews/example.md`。
- **Clarity Theme 是否支持？** 状态列；定义见[README](./README.zh-CN.md#状态词汇)。
- **Skill 应该读取哪个 reference？** 每行链接的逐项页面，经由 `skills/article-beautifier/references/_index.md` 到达。

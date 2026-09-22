# Clarity Theme

从 [L33Z22L11/blog-v3](https://github.com/L33Z22L11/blog-v3) 提取的可复用 **Nuxt 4 Layer 博客主题**。

Theme 只包含 UI、页面、Markdown 渲染、SEO、Feed 生成器等通用能力，
**不包含任何具体博客的内容**（文章、友链数据、站点配置、统计与评论配置）。

## 架构

```text
clarity-theme (Layer)          your-blog (Consumer)
├── app/          UI 组件      ├── clarity.config.ts   站点配置
├── config/       Config API   ├── content.config.ts   Content Schema
├── modules/      配置桥接      ├── feeds.ts            友链数据
│   └── clarity-config/         ├── content/            文章
│       （含 anti-mirror-client）├── app/app.config.ts   UI 覆盖
├── remark-plugins/             └── nuxt.config.ts      extends Layer
├── server/  stats/atom/opml
├── shared/  通用工具
└── playground/  示例站点
```

## 使用

### 1. 安装

```bash
pnpm add -D github:YOURNAME/clarity-theme#<commit>
```

> npm 包发布前推荐使用 Git Package 并 pin 到 commit；发布后可改为 `^0.1.0`。

### 2. 继承 Layer

```ts
// nuxt.config.ts
export default defineNuxtConfig({
	extends: ['clarity-theme'],
})
```

### 3. 编写站点配置

```ts
// clarity.config.ts
import { defineClarityConfig } from 'clarity-theme/config'

export default defineClarityConfig({
	site: {
		title: '我的博客',
		description: '记录技术与生活',
		url: 'https://example.com/',
		author: { name: '我的名字', avatar: '/avatar.webp' },
	},
})
```

### 4. 内容 Schema

```ts
// content.config.ts
import { createClarityContentConfig } from 'clarity-theme/content'
import clarityConfig from './clarity.config'

export default createClarityContentConfig(clarityConfig)
```

### 5. 友链数据（可选）

```ts
// feeds.ts
import type { FeedGroup } from 'clarity-theme/config'

export default [] satisfies FeedGroup[]
```

### 6. UI 覆盖（可选）

```ts
// app/app.config.ts
export default defineAppConfig({
	clarity: {
		header: { emojiTail: ['📝'] },
		nav: [/* ... */],
	},
})
```

组件级自定义：在消费项目中创建同路径组件即可覆盖 Layer 组件（如 `app/components/blog/BlogHeader.global.vue`）。

## Theme API

| API | 说明 |
| --- | --- |
| `defineClarityConfig()` | 定义并校验站点配置（`clarity-theme/config`，运行时 + 类型双入口） |
| `createClarityContentConfig()` | 生成 Nuxt Content 集合（`clarity-theme/content`，含 `ArticleSchema` 类型） |
| `useClaritySiteFeedEntry()` | 由站点配置生成本站订阅条目（友链页 / OPML） |
| `useClarityConfig()` | 获取完整配置（站点 + UI） |
| `useClaritySite()` / `useClarityArticle()` | 获取站点 / 文章配置 |
| `clarity-theme/img` | 头像 / 图标 / 图片 URL helper（feeds.ts 与组件共用） |
| `clarity-theme/schema` | 全部 `clarity*` zod schema（TS / MJS 双实现，Node 原生可加载） |
| `type ClarityConfig` 等 | 公共类型（`clarity-theme/config`：`ClarityUiConfig` / `FeedGroup` / `NavGroup` 等） |
| `#clarity/feeds` | 消费项目友链数据注入点 |

完整字段契约（Required / Optional / Default / 客户端可见性）见 [docs/configuration.md](./docs/configuration.md)；
配置边界审计结论见 [docs/config-api-audit.md](./docs/config-api-audit.md)。
发布兼容性矩阵（Public API / 核心功能 / 配置分支）见 [docs/COMPATIBILITY.md](./docs/COMPATIBILITY.md)，
由 `scripts/compatibility-cases.mjs` 生成并在 CI 中校验同步。

## 配置职责边界

| 文件 | 职责 |
| --- | --- |
| `clarity.config.ts` | 站点信息 / 文章分类 / Feed / 集成 / 功能开关 |
| `app/app.config.ts` | 客户端响应式 UI 配置 |
| `content.config.ts` | Nuxt Content Schema |
| `feeds.ts` | 友链数据 |
| `runtimeConfig` | 密钥与环境相关配置（严禁放入 app.config） |

## 开发

```bash
pnpm install        # 安装 Theme + Playground（pnpm workspace）
pnpm dev            # 启动 Playground
pnpm generate       # Playground 静态生成验证
pnpm lint
pnpm typecheck      # vue-tsc 全量类型检查
pnpm verify         # 作者信息 / 站点文件泄漏检查
pnpm peers check    # 开发 workspace peer 依赖审计
pnpm test:sync      # 上游同步工具回归测试
pnpm test:contract  # Release Compatibility Matrix 契约与文档同步校验
pnpm test:consumer  # npm tarball 真实消费项目验证
pnpm test:compatibility  # SSR / 浏览器渲染 / hydration 回归
```

CI（GitHub Actions）：

- `ci.yml`：push / PR 时跑 lint + typecheck + verify + sync / contract / peers 回归（Node 22 / 24 矩阵），
  Node 24 上额外执行 playground generate、real consumer test 与渲染兼容性回归
- `sync.yml`：每周一检查上游更新，有新提交时自动创建同步 Issue（附分类明细）

## 上游同步

- 基线：`blog-v3@3.7.2`（`f6ea97d7`，2026-09-06）
- 清单：`sync-manifest.json` 四分类（devdoc2.0 §21）
 - `include`：可直接同步的通用文件
 - `exclude`：上游私有内容，永不进入 Theme（原 siteOnly）
 - `transform`：从上游派生、需按变更重构的文件（nuxt.config / app.config / content.config / package.json / pnpm-workspace）
 - `manual`：Theme 重构过的文件，只报告差异不自动覆盖

```bash
pnpm sync:check    # 是否有新提交（CI 加 --fail-on-update）
pnpm sync:diff     # 变更分类明细
pnpm sync:apply    # 安全应用：include 快进 + 基线对比冲突检测 + 更新基线
pnpm sync:verify   # 提纯验证 + 基线状态检查
```

`apply` 的安全策略：

- 仅 `include` 类文件参与自动同步，且要求 Theme 工作树干净
- 本地文件与上游基线一致（未被适配）→ 快进到最新
- 本地文件已被 Theme 适配（与基线有差异）→ **标记冲突跳过**，人工按基线 → 最新合并
- 上游删除且本地未适配 → 同步删除
- `transform` / `manual` 永不自动覆盖，仅报告差异

## 上游 Patch 审计

详见 [docs/PATCHES.md](./docs/PATCHES.md)。结论：Theme 包不携带任何 patch，
需要的 patch 由消费项目（`theme-based-blog-v3/patches/`）持有：

| Patch | 判定 |
| --- | --- |
| `@nuxtjs/mdc` | ✅ 已精简：行内代码部分被 ProseCode 取代（删除）；detab 保留 tab 部分仍需 consumer patch |
| `@nuxt/image` | 🟡 consumer patch（小数密度 `1.5x`；`parseFloat` 适合向上游提 PR） |
| `ipx` | 🟡 consumer patch（ICO 透传，避免 favicon 处理崩溃） |
| `plain-shiki` | 🟡 consumer patch（`::highlight` 后代选择器修复，适合向上游提 PR） |

## 与上游的差异（v0.1）

- 移除 `content/`、`app/feeds.ts`、`blog.config.ts` 等全部站点数据
- 新增 `clarity.config.ts` API（`config/` + `modules/clarity-config`）
- `app/app.config.ts` 收敛为 `clarity` 命名空间的纯 UI 默认值
- CSS / 图标 / Remark 插件 / 组件路径全部 Layer 本地化
- `anti-mirror` 改为 `features.antiMirror` 可选功能（默认关闭；Theme 不携带默认黑名单，
  镜像站域名必须由消费者通过 `features.antiMirror.blacklist` 提供，`true` + 空黑名单会跳过注入并 WARN）
- Twikoo 评论、统计脚本等改为 `integrations` 配置注入
- 上游 `pnpm-workspace.yaml` catalog 依赖改为普通语义化版本
- 新增 `clarity-theme/img` 包导出（feeds.ts 头像 helper）
- 上游 `patches/` 已逐个判定（见 [docs/PATCHES.md](./docs/PATCHES.md)）：`@nuxtjs/mdc` 的
  「行内代码 props.code」已被 ProseCode 原生适配**取代**（有 patch / 无 patch 均兼容），
  detab 部分精简为单 hunk；`@nuxtjs/image` / `ipx` / `plain-shiki` 判定为 consumer patch
- Layer 构建兼容修复：
  - `modules` 相对路径改为 Theme 绝对路径（Layer 中相对路径以消费项目为基准）
  - `@pinia/nuxt` 不扫描 Layer 的 `app/stores`，由 `clarity-config` 显式注册
  - `@bikariya/shiki` 的 `~/shiki.config` 在消费项目未提供时回退到 Theme 内置配置
  - `#clarity/feeds` 等消费项目注入点通过模块 alias 提供

## 验证状态

```text
[✓] Playground nuxt generate（39 条路由，含 atom.xml / stats / opml / compatibility）
[✓] Real Consumer Test（pnpm pack → 独立目录安装 tarball → 3 组配置分支 generate；
     exports/类型声明契约审计 + 纯 Node runtime 冒烟 + nuxt typecheck + 产物断言）
[✓] 差异测试站（原版 blog-v3 全量数据 + Theme，242 条路由 + 10 项对比，见下文）
[✓] vue-tsc typecheck（playground 全量，0 错误）
[✓] eslint / stylelint
[✓] 作者信息泄漏、站点文件、跨项目路径检查（pnpm verify）
[✓] 渲染兼容性回归（生产 SSR 24 组 + 浏览器 12 组 + dev hydration 11 组，50 项断言组全部通过）
[✓] Release Compatibility Matrix（契约 39 项：Public API 5 + 核心功能 21 + 配置分支 13）
[✓] peer 依赖审计（pnpm peers check）
[✓] 上游同步检查（sync:check，基线 f6ea97d = upstream/main）
```

### Rendering Compatibility（devdoc2.0 Phase A）

上游 `@nuxtjs/mdc` patch（行内代码 `props.code` 传入原文）**未迁移**。
Theme 的 `ProseCode.vue` 已适配 MDC 原生行为：inline code 原文从默认插槽（text VNode）提取，
同时保留对 patch 场景 `code` prop 的兼容，因此**该 patch 不再是必需依赖**。

兼容性基准页位于 `playground/content/compatibility/`：

| 页面 | 覆盖范围 |
| --- | --- |
| `markdown.md` | A 类：标题 / 强调 / 链接 / 列表 / 任务列表 / 引用 / 分隔线 / 表格 / 脚注 |
| `code.md` | inline / inline 高亮 `{lang}` / fenced / 文件名 / 行高亮 / diff 标记 |
| `mdc.md` | C 类：alert / tip / copy / card-list / folding / badge |
| `math.md` | remark-math + rehype-katex（行内 / 块级 / aligned） |
| `mermaid.md` | remark-code-component → Mermaid |
| `music.md` | remark-code-component → MusicScore (abcjs) |
| `image.md` | Markdown 图片 / Pic 组件 |

Consumer Override Test：`playground/app/components/content/Badge.vue` 同路径覆盖 Theme 组件
（生成 HTML 含 `data-consumer-override` 标记），验证优先级
`Consumer component > Consumer app.config > Module 注入 > Theme app.config`。

```text
[✓] inline code 文字渲染（修复空框问题）
[✓] inline 高亮 / fenced / 文件名 / 行高亮 / diff
[✓] KaTeX / Mermaid / ABC 乐谱
[✓] MDC 组件（alert / tip / copy / card-list / folding / badge）
[✓] Consumer component override
```

### npm Runtime 兼容（devdoc2.0 Phase D）

Real Consumer Test（`pnpm test:consumer`）暴露并修复了三个 workspace 链接掩盖的真实 npm 包问题：

1. **Node 原生 TS 剥离禁止 node_modules 内的 TS 文件**：`@nuxt/content` 以 Node 原生方式加载
   content config 与 remark/rehype 插件，因此 `config/schema`、`config/content`、
   `remark-plugins/*` 提供与 TS 源同构的 **`.mjs` 运行时实现**（`.d.mts` re-export `.ts` 作为类型源），
   exports 指向 `.mjs`
2. **`#modals` 虚拟别名**：`@bikariya/modals` 的 exports 未暴露 runtime/types，
   Vue SFC 编译器在 pnpm 隔离布局下无法解析该类型导入；Theme 在
   `app/types/modal.ts` 内联同构类型
3. **`sass-embedded`**：从 devDependencies 移入 dependencies，保证消费项目开箱编译 SCSS

测试流程：`pnpm pack` → 临时目录消费项目（`extends: ['clarity-theme']` +
`clarity.config.ts` / `content.config.ts` / `feeds.ts` / 文章 / UI 覆盖）→
`pnpm install` → `nuxt generate` → 断言（站点注入 / inline code / 文章路由 / atom / UI 覆盖）。

### 差异测试站：theme-based-blog-v3

`../theme-based-blog-v3` 是一个**独立部署的完整站点**：原版 blog-v3 的全部站点数据
（86 篇文章、友链、redirects、统计与评论配置、上游 4 个 patch）运行在 Theme 上，
通过 tarball 安装（与 npm 发布形态一致），用于与原版输出对比。

```text
[✓] 242 条路由预渲染，0 错误（86 篇文章 + 归档 / 友链 / 预览 / theme 文档）
[✓] 站点注入：标题 / favicon / author meta / umami / Insights / Twikoo 脚本
[✓] 文章正文：article / h2 / pre / inline code（含 language-* 高亮）/ twikoo 容器
[✓] atom.xml 50 条（feed.limit）、stats 90 篇 / 132,995 字、opml 137 个订阅
[✓] redirects.json 全量 308 重定向
[✓] 上游 patch 环境（@nuxtjs/mdc patch APPLIED）下 ProseCode 双模式兼容
```

该站点同时验证了 **patch 共存**（ProseCode 的插槽 / `code` prop 双模式设计）
与 **consumer UI 覆盖**（footer / header / birthYear 均来自站点侧覆盖）。

## 待办（按 devdoc 阶段）

- [x] Phase 0：冻结基线（blog-v3@3.7.2，f6ea97d）
- [x] Phase 1：提纯（移除内容 / 作者配置 / 站点组件）
- [x] Phase 2：clarity.config.ts API + modules/clarity-config
- [x] Phase 3：Layer 本地化路径（CSS / Icon / Remark / 组件 / Server）
- [x] Phase 5（部分）：Playground + lint + generate
- [x] Rendering Compatibility（devdoc2.0 Phase A）
- [x] Config API 加固：`site.url` 尾斜杠校验、`article.types` 空值兜底
- [x] Real Consumer Test（devdoc2.0 Phase D）：tarball 安装 + generate + 断言
- [x] Config API 加固（devdoc2.0 Phase E 部分）：`CustomAppConfig` 类型合并、zod v4 `prefault`、
      server 路由改用 `@nuxt/content/server` 显式导入、`ufo`/`@types/hast`/`minimark` 显式依赖
- [x] 差异测试站 theme-based-blog-v3（原版全量数据 × Theme，Phase A / D 终验）
- [x] Phase 4：patch audit 完成（结论见 [docs/PATCHES.md](./docs/PATCHES.md)；
      需保留的 4 个 patch 由消费项目持有，`@nuxtjs/mdc` 已精简为 detab 单 hunk）
- [x] Phase 5：CI 三层验证（ci.yml：lint + typecheck + verify + sync / peers 回归矩阵 → generate + consumer + compatibility）
- [x] Phase 6：sync 四分类 manifest + `check` / `diff` / `apply` / `verify` 四模式 + 每周同步 Issue

## 许可证

- Theme 代码：MIT（继承自上游，见 [LICENSE](./LICENSE)）
- 上游博客**文章**采用 CC BY-NC-SA 4.0，Theme 中不包含任何文章内容

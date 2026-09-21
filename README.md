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
│   ├── clarity-config/         ├── content/            文章
│   └── anti-mirror/            ├── app/app.config.ts   UI 覆盖
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
| `defineClarityConfig()` | 定义并校验站点配置 |
| `createClarityContentConfig()` | 生成 Nuxt Content 集合 |
| `useClarityConfig()` | 获取完整配置（站点 + UI） |
| `useClaritySite()` / `useClarityArticle()` | 获取站点 / 文章配置 |
| `type ClarityConfig` 等 | 公共类型（`clarity-theme/config`） |
| `#clarity/feeds` | 消费项目友链数据注入点 |

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
pnpm verify         # 作者信息 / 站点文件泄漏检查
node scripts/sync-upstream.mjs check  # 检查上游更新
```

## 上游同步

- 基线：`blog-v3@3.7.2`（`f6ea97d7`，2026-09-06）
- 清单：`sync-manifest.json`（include / siteOnly / manual）
 - `include`：可直接同步的通用文件
 - `siteOnly`：上游私有内容，永不进入 Theme
 - `manual`：Theme 重构过的文件，只报告差异不自动覆盖

```bash
node scripts/sync-upstream.mjs check  # 是否有新提交
node scripts/sync-upstream.mjs diff   # 变更分类明细
```

## 与上游的差异（v0.1）

- 移除 `content/`、`app/feeds.ts`、`blog.config.ts` 等全部站点数据
- 新增 `clarity.config.ts` API（`config/` + `modules/clarity-config`）
- `app/app.config.ts` 收敛为 `clarity` 命名空间的纯 UI 默认值
- CSS / 图标 / Remark 插件 / 组件路径全部 Layer 本地化
- `anti-mirror` 改为 `features.antiMirror` 可选功能
- Twikoo 评论、统计脚本等改为 `integrations` 配置注入
- 上游 `pnpm-workspace.yaml` catalog 依赖改为普通语义化版本
- 上游 `patches/` 尚未迁移（见下方待办）
- Layer 构建兼容修复：
  - `modules` 相对路径改为 Theme 绝对路径（Layer 中相对路径以消费项目为基准）
  - `@pinia/nuxt` 不扫描 Layer 的 `app/stores`，由 `clarity-config` 显式注册
  - `@bikariya/shiki` 的 `~/shiki.config` 在消费项目未提供时回退到 Theme 内置配置
  - `#clarity/feeds` 等消费项目注入点通过模块 alias 提供

## 验证状态

```text
[✓] Playground nuxt generate（37 条路由，含 atom.xml / stats / opml / compatibility）
[✓] Real Consumer Test（pnpm pack → 独立目录安装 tarball → nuxt generate，21 条路由 + 6 项断言）
[✓] vue-tsc typecheck（playground 全量，0 错误）
[✓] eslint / stylelint
[✓] 作者信息泄漏、站点文件、跨项目路径检查（pnpm verify）
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
- [ ] Phase 4：逐个处理上游 patch（删除 / upstream / fork / consumer patch）
- [ ] Phase 5（剩余）：CI 三层验证（lint → playground generate → pack + 临时 consumer generate）
- [ ] Phase 6：sync-upstream `apply` / `verify` 模式与定时 PR

## 许可证

- Theme 代码：MIT（继承自上游，见 [LICENSE](./LICENSE)）
- 上游博客**文章**采用 CC BY-NC-SA 4.0，Theme 中不包含任何文章内容

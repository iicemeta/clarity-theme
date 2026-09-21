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

## 待办（按 devdoc 阶段）

- [ ] Phase 4：逐个处理上游 patch（删除 / upstream / fork / consumer patch）
- [ ] Phase 5：CI 三层验证（lint → playground generate → pack + 临时 consumer generate）
- [ ] Phase 6：sync-upstream `apply` / `verify` 模式与定时 PR

## 许可证

- Theme 代码：MIT（继承自上游，见 [LICENSE](./LICENSE)）
- 上游博客**文章**采用 CC BY-NC-SA 4.0，Theme 中不包含任何文章内容

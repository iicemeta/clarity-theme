# 路由与输出

[English](./routes-and-outputs.md) | **简体中文**

Layer 提供的公共路由与输出。事实来源：`src/pages/**`、`src/server/**`，以及 `src/modules/clarity-config/index.ts` 中的 route-rule/功能接线；行为由 `pnpm test:consumer` 与 `pnpm test:compatibility` 锁定。

## 页面

| 路由 | 来源 | 用途 |
| --- | --- | --- |
| `/` | `src/pages/index.vue` | 分页文章列表、分类筛选与推荐文章 |
| `/archive` | `src/pages/archive.vue` | 年度/分类/标签归档 |
| `/link` | `src/pages/link.vue` | 由 `feeds.ts` 渲染的友链页 |
| `/preview` | `src/pages/preview.vue` | 未发布文章列表（`content/previews/**`） |
| `/*`（catch-all） | `src/pages/[...slug].vue` | 任意 Content 页面，包括文章与自定义固定链接；缺失路径返回 404 |

消费方在相同 Layer 相对路径放置页面即可覆盖 Layer 路由（见[自定义](../guides/customization.zh-CN.md)）。

## 服务端输出

| 路由 | 来源 | 功能开关 | 输出 |
| --- | --- | --- | --- |
| `GET /atom.xml` | `src/server/routes/atom.xml.get.ts` | `features.atom` | Atom 订阅（最新 `feed.limit` 篇，按更新时间排序；`feed.enableStyle` 控制 XSLT 样式） |
| `GET /subscriptions.opml` | `src/server/routes/subscriptions.opml.get.ts` | `features.opml` | OPML 2.0 订阅（自身订阅 + 有订阅 URL 的友链） |
| `GET /api/stats` | `src/server/api/stats.get.ts` | `features.stats` | 文章数、字数、年度/分类/标签统计，范围由 `stats.includePaths` 决定 |

关闭某个功能会移除它的 prerender 规则与 head 接线，**并且**让该路由在 dev/SSR 运行时返回 404——两种语义永不分离。

## 生成的 SEO 输出

| 路由 | 提供方 |
| --- | --- |
| `/robots.txt` | `@nuxtjs/seo` robots 集成，数据来自 `article.robotsNotIndex` |
| `/sitemap.xml` | 由 Content 工厂生成的 Nuxt Content sitemap schema |
| `/llms.txt` | `nuxt-llms`，由站点元数据配置 |
| `/favicon.ico` | 重定向到 `site.favicon` |

## Theme 注入的 route rules

功能启用时，模块会以正确的 Content-Type（Atom/OPML 为 `application/xml`，stats 为 `application/json`）prerender 其输出。消费方把自己的重定向、缓存、headers、鉴权与平台转换保留在 `nuxt.config.ts` 中；与 Theme 路由的冲突必须通过选择唯一所有者来显式解决。

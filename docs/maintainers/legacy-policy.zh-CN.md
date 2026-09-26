# Legacy 政策

**English** | [简体中文](./legacy-policy.zh-CN.md)

Clarity Theme 如何分类与退出 0.1.x 兼容面。本页是治理规则，不是 API 文档——API 参考见[公共 API](../reference/api.zh-CN.md)。

## 时间线

| 时代 | 读取路径 | 状态 |
| --- | --- | --- |
| **0.1.x（legacy）** | `useClarityConfig()` / `useClaritySite()` / `useClarityArticle()` / `useClaritySiteFeedEntry()`；`app/app.config.ts` 的 `clarity` 键；`article.useRandomPermalink`（曾接受→移除→现在警告并忽略） | **已废弃。** 仍然可用。移除目标：**0.2.0** |
| **0.2.x（现行）** | 经 `useAppConfig()` 的扁平 upstream 形状 app config（`title`、`nav`、`component.*`、`article.*` 等）；`clarity.config.ts` 经 `defineClarityConfig()` | 现行 API |

## 哪些是 legacy

| 面 | 所在位置 | 当前行为 |
| --- | --- | --- |
| `useClarityConfig()` 系列 | `src/shared/utils/clarity.ts`（客户端） | 读取注入的 `clarity` app-config 键。无任何 Theme 组件消费它们；仅为 0.1.x consumer 代码存在。 |
| `clarity` 嵌套 app-config 键 | 由 `src/modules/clarity-config` 注入 | 其下的 UI 覆盖合并进扁平形状；其下的站点级字段触发构建期迁移警告。 |
| `article.useRandomPermalink` | legacy 注册表（`src/config/schema.ts` / `schema.mjs` 的 `legacyConfigKeys`） | 构建期输出废弃警告后忽略。注册表**之外**的未知键仍然致命（拼写保护不放宽）。 |
| `useClarityServerConfig()` | `src/server/utils/clarity.ts` | **现行，非 legacy**——server 路由的 Nitro 侧内部配置通道；不是公共导出。 |

## 规则

1. **先治理，后删除。** legacy 面在 0.1.x 全程保持可用，并在文档与构建输出中给出废弃警告。0.2.0 之前不删除任何内容。
2. **不新增 legacy。** 新功能必须面向扁平 upstream 形状 app config。任何新废弃项必须在同一发布内登记进注册表或本页。
3. **删除属于破坏性发布。** 0.2.0 一次性移除 legacy composables、`clarity` app-config 键与 legacy 键注册表，并在 CHANGELOG 附迁移说明。
4. **文档分类。** 文档、skill 或模板中对上述面的每处提法必须是：`CURRENT`（扁平路径）、`LEGACY`（已废弃，见本页）、`MIGRATION`（如何迁移）或 `HISTORY`（冻结记录）。不允许 `UNKNOWN`。

## 迁移（0.2.0 之前）

| 0.1.x | 现行 |
| --- | --- |
| `useClarityConfig().site.title` | `useAppConfig().title` |
| `useClaritySite()` | `useAppConfig()` 扁平站点字段（`title`、`author`、`favicon` 等） |
| `useClarityArticle()` | `useAppConfig().article` |
| `useClaritySiteFeedEntry()` | 由扁平字段自行派生，或直接使用 Theme 的 OPML/Atom 输出 |
| `app.config.clarity` 下的 UI 覆盖 | `app/app.config.ts` 扁平键（`component`、`footer`、`header`、`link`、`nav`、`pagination`、`themes`） |
| `article.useRandomPermalink` | 删除该键（无替代；随机固定链接属 consumer 构建脚手架） |

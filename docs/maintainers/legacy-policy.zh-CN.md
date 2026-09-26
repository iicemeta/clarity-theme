# Legacy 政策

**English** | [简体中文](./legacy-policy.zh-CN.md)

Clarity Theme 如何分类与退出 0.1.x 兼容面。本页是治理规则，不是 API 文档——API 参考见[公共 API](../reference/api.zh-CN.md)。

## 时间线

| 时代 | 读取路径 | 状态 |
| --- | --- | --- |
| **0.1.x（legacy）** | `useClarityConfig()` / `useClaritySite()` / `useClarityArticle()` / `useClaritySiteFeedEntry()`；`app/app.config.ts` 的 `clarity` 键；`article.useRandomPermalink` | **0.2.0 已移除。** 0.1.x 全程带废弃警告保留；随 0.2.0 破坏性发布删除。 |
| **0.2.x（现行）** | 经 `useAppConfig()` 的扁平 upstream 形状 app config（`title`、`nav`、`component.*`、`article.*` 等）；`clarity.config.ts` 经 `defineClarityConfig()` | 现行 API |

## 曾经的 legacy（0.2.0 已移除）

| 兼容面 | 原位置 | 移除时行为 |
| --- | --- | --- |
| `useClarityConfig()` 系列 | `src/shared/utils/clarity.ts`（客户端） | 已删除。无任何 Theme 组件消费过它们；仅为读取注入 `clarity` app-config 键的 0.1.x consumer 代码存在。 |
| `clarity` 嵌套 app-config 键 | 由 `src/modules/clarity-config` 注入 | 注入及其类型面已删除。consumer `app/app.config.ts` 中残留的 `clarity` 键只是惰性未知字段（构建期迁移警告）。 |
| `article.useRandomPermalink` | legacy 注册表（`src/config/schema.ts` / `schema.mjs` 的 `legacyConfigKeys`） | 注册表已删除。该键重新成为致命未知键（strictObject 拼写保护完整恢复）。 |

`useClarityServerConfig()`（`src/server/utils/clarity.ts`）是**现行，非 legacy**——server 路由的 Nitro 侧内部配置通道；不是公共导出。

## 规则

1. **先治理，后删除。** 被废弃面带警告保留到下一个破坏性发布；删除随该发布连同 CHANGELOG 迁移说明一起落地（0.2.0 正是如此执行）。
2. **不新增 legacy。** 新功能必须面向扁平 upstream 形状 app config。任何新废弃项必须在同一发布内登记进本页，并注明移除发布版本。
3. **删除属破坏性发布。** legacy composables、兼容配置键与兼容注册表整体一起移除，绝不零敲碎打。
4. **文档分类。** 文档、skill 或模板中对已移除面的每处提法必须是：`CURRENT`（扁平路径）、`MIGRATION`（如何迁移）或 `HISTORY`（冻结记录）。不允许 `UNKNOWN`。

## 迁移（0.1.x → 0.2.0）

| 0.1.x | 0.2.0 |
| --- | --- |
| `useClarityConfig().site.title` | `useAppConfig().title` |
| `useClaritySite()` | `useAppConfig()` 扁平站点字段（`title`、`author`、`favicon` 等） |
| `useClarityArticle()` | `useAppConfig().article` |
| `useClaritySiteFeedEntry()` | 由扁平字段自行派生，或直接使用 Theme 的 OPML/Atom 输出 |
| `app.config.clarity` 下的 UI 覆盖 | `app/app.config.ts` 扁平键（`component`、`footer`、`header`、`link`、`nav`、`pagination`、`themes`）——覆盖某个键时提供完整对象 |
| `article.useRandomPermalink` | 删除该键（无替代；随机固定链接属 consumer 构建脚手架）。保留该键将无法通过配置校验。 |

# Clarity Theme 公共 API 与配置边界审计报告

[English](./2026-09-config-api-audit.md) | **简体中文**

> **历史审计快照——不再对当前状态具有权威性。**
> 当前配置事实见[配置说明](../guides/configuration.zh-CN.md)、[API](../reference/api.zh-CN.md) 与 [PROJECT-STATUS](../maintainers/project-status.zh-CN.md)。
> 下文的验证计数与工作区快照反映本审计当日的情况。

> 审计日期：2026-09-21
> 审计范围：`config/**`、`modules/clarity-config/**`、`playground/clarity.config.ts`、`playground/app/app.config.ts`
> 方法：源码静态审计 + 生成产物实证（`.nuxt`、`.output` 客户端 bundle、`defuFn` 合并顺序、typecheck 行为注入实验）

## 0. 结论总表

| # | 检查项 | 结论 | 严重度 | 处置 |
| --- | --- | --- | --- | --- |
| 1 | 哪些字段应放 `clarity.config.ts` | 7 组站点级字段归属正确，`article` 内 3 个仅构建期字段建议标注可见性 | 低 | ✅ 已补注释 |
| 2 | 哪些字段必须保留 `app.config.ts` | 10 组 UI 字段归属正确，但类型层未阻止站点级字段流入 | 中 | ✅ 已加构建期警告 |
| 3 | 哪些字段不应进客户端 bundle | `integrations.scripts` 等仅构建期字段曾整体进入 bundle | 高 | ✅ 部分修复 + 遗留登记 |
| 4 | 站点信息泄漏 | `site.author.email` / 站点版本指纹进入客户端 bundle | 中 | ⚠️ 登记为设计取舍 + 建议 |
| 5 | upstream-specific default | 模块硬编码 5 个上游镜像站域名并强制合并进所有消费者黑名单 | 高 | ✅ 已移除 |
| 6 | hard-coded author/favicon/social/domain | Theme 层无硬编码作者信息；镜像域名属唯一残留 | 高 | ✅ 随 #5 移除 |
| 7 | schema 静默丢弃未知字段 | zod 默认 strip，拼写错误被静默吞掉 | 高 | ✅ 已全面 strictObject |
| 8 | Consumer 是否真正优先于 Theme | `defuFn(cfg0, cfg1, inlineConfig)`：Consumer > Theme > 模块注入，实证成立 | — | ✅ 确认无问题 |
| 9 | appConfig type augmentation 是否正确 | 相对路径少算一层目录 → 导入解析失败 → skipLibCheck 下静默退化为 `any`，输入校验完全失效 | 高 | ✅ 已修复 + 双接口增强 |
| 10 | clarity.config 错误是否 build 前暴露 | 模块 setup 期即 parse（构建前失败），但报错是裸 ZodError | 中 | ✅ 已加带路径的友好错误 |
| 11 | config/index.ts 导出完整性 | 缺 `Nav` / `NavItem`（下游 `theme-based-blog-v3` 已在导入，实际是坏引用）、`NavGroup`、`ClarityUiConfigInput`、`Arch` | 高 | ✅ 已补全 |
| 12 | content exports 完整性 | `createClarityContentConfig` + `ArticleSchema` 覆盖当前契约，`content.d.mts`/`content.mjs` 双链完整 | — | ✅ 确认无问题 |
| 13 | schema exports 完整性 | 全部 `clarity*` schema 与类型经 `./schema` 子路径导出，TS/JS 双实现同步 | — | ✅ 确认（含 strict 同步） |

## 1. 分层契约总览

| 配置面 | 文件 | 职责 | 校验时机 | 密钥允许 |
| --- | --- | --- | --- | --- |
| 站点级配置 | `clarity.config.ts` | 站点身份、内容语义、功能开关、第三方集成、更新日志 | `defineClarityConfig()` 立即 zod 校验 + 模块 setup 期二次校验 | ❌ |
| UI 配置覆盖 | `app/app.config.ts` | 仅 UI 分组（component/footer/header/link/nav/pagination/themes）的深度可选覆盖 | TypeScript（`CustomAppConfig`/`AppConfigInput` 增强） | ❌ |
| Content Schema | `content.config.ts` | 文章集合 schema（由 `createClarityContentConfig(clarityConfig)` 生成） | 内容加载期（构建前） | ❌ |
| Consumer 数据 | `feeds.ts` | 友链数据（`FeedGroup[]`），经 `#clarity/feeds` 别名注入 | TypeScript | ❌ |
| secret / environment | `runtimeConfig`（`nuxt.config.ts`） | 构建信息、CI、平台环境；消费者私有 secret 唯一合法位置 | Nuxt 运行时 | ✅（非 public 段不进客户端） |

### 1.1 字段归属矩阵（逐字段）

**clarity.config.ts（站点级，7 组）**

| 分组 | 字段 | 使用位置 | 客户端可见 | 备注 |
| --- | --- | --- | --- | --- |
| `site` | `title` / `subtitle` / `description` / `url` / `language` / `established` / `copyright` | SEO、页头页脚、Feed、客户端组件 | ✅（站点公共身份） | `url` 必须以 `/` 结尾 |
| `site` | `favicon` | head link、favicon 重定向、Feed icon | ✅ | |
| `site` | `timezone` | 归档页年份（客户端）、Stats/Atom/OPML（服务端） | ✅ | 双端使用，必须保留 |
| `site.author` | `name` / `avatar` / `email` / `homepage` | meta author、RSS/OPML、页头 logo 派生、og:image | ✅（见 §4） | email 属公共站点信息（RSS 规范字段） |
| `article` | `defaultCategory` / `categories` / `types` / `order` | Content Schema、客户端分类/排序组件 | ✅ | 内容语义 |
| `article` | `useRandomPermalink` / `hidePostPrefix` / `robotsNotIndex` | 仅模块构建期（脚手架 / afterParse 钩子 / robots） | ⚠️ 仍随 appConfig 进 bundle（见 §3 遗留） | 无敏感值 |
| `feed` | `limit` / `enableStyle` | 仅服务端（atom.xml 生成） | ⚠️ 仍随 appConfig 进 bundle（见 §3 遗留） | |
| `stats` | `includePaths` | 仅服务端（stats API） | ⚠️ 仍随 appConfig 进 bundle（见 §3 遗留） | |
| `integrations.twikoo` | `envId` / `preload` | 客户端评论区初始化 + head 预连接 | ✅（设计如此：公开评论端点） | envId 是服务地址，非密钥 |
| `integrations.scripts` | 第三方脚本属性表 | 仅模块构建期注入 `<head>` | ❌ **已从 appConfig 剔除** | 本次修复 |
| `features` | `atom` / `opml` / `stats` / `antiMirror` | 模块路由规则 / head / 反镜像脚本 | ✅（公开功能开关） | 见 §7 features |
| `changelog` | `{ date, text }[]` | 更新日志组件（客户端） | ✅ | |

**app/app.config.ts（UI 覆盖，10 组，全部 Optional）**

| 分组 | 字段 |
| --- | --- |
| `component.alert` | `defaultStyle` |
| `component.codeblock` | `triggerRows` / `collapsedRows` / `enableIndentGuide` / `indent` / `tabSize` |
| `component.excerpt` | `animation` / `caret` |
| `component.slide` | `showTitle` |
| `component.stats` | `birthYear?` |
| `footer` | `copyright` / `iconNav` / `nav` |
| `header` | `logo` / `showTitle` / `subtitle` / `emojiTail` |
| `link` | `remindNoFeed` / `randomInGroup` |
| `nav` | `NavGroup[]` |
| `pagination` | `perPage` / `sortOrder` / `allowAscending` |
| `themes` | light / system / dark 的 `icon` / `tip` |

`header.logo` / `header.subtitle` / `footer.copyright` 的站点派生默认值由模块以**最低优先级**注入（见 §8），消费者可在 app.config.ts 中覆盖。

**禁止进入 app/app.config.ts**：`site` / `article` / `feed` / `stats` / `integrations` / `features` / `changelog`——它们属于 clarity.config.ts。由于 defu 优先级，写在 app.config.ts 的站点级字段会**压过** clarity.config.ts 的注入结果。本次已加构建期警告（见 §2）。

## 2. #2/#9 详情：app.config.ts 边界与类型增强

### 发现

1. **类型增强路径错误（高）**：`modules/clarity-config/index.ts` 用 `relative(nuxt.options.buildDir, ...)` 计算导入路径，但类型文件实际生成于 `buildDir/types/clarity-app-config.d.ts`（深一层）。生成物中的 `import ... from '../../config/app.ts'` 解析到不存在的 `playground/config/app.ts`；由于 Nuxt 默认 `skipLibCheck: true`，该错误被静默吞掉，`ClarityAppConfig` 退化为 `any`。
   - 实证：向 playground app.config.ts 写入 `header: { logo: 42, showTitle: 'yes', emojiTail: 'not-array' }`，修复前 typecheck **零报错**；`AppConfigInput['clarity']` 可接受 `123`。
   - 读取侧（`useAppConfig().clarity`）碰巧因 Nuxt `MergedAppConfig` 的 `IsAny` 守卫回落到注入字面量类型而正常——属于**侥幸正确**。
2. **边界无守卫**：类型层无法阻止消费者在 app.config.ts 写 `clarity.site.title`（defu 优先级更高，会静默覆盖站点配置）。

### 修复

- 路径基准改为 `resolve(buildDir, 'types')`，生成物导入 `'../../../config/app.ts'` 正确解析。
- **双接口增强**（规避 Nuxt `MergedAppConfig` 的类型代数限制——输入侧要深度可选、读取侧要完整形状，二者在同一种类型上不可兼得）：

```ts
declare module '@nuxt/schema' {
	interface CustomAppConfig { clarity?: unknown } // 读取侧：unknown 触发回落到注入的完整 Resolved 类型
	interface AppConfigInput { // 输入侧：完整配置或 UI 部分覆盖
		clarity?: ClarityAppConfig | ClarityUiConfigInput
	}
}
```

- 新增 `ClarityUiConfigInput`（`config/app.ts`）：`ClarityUiConfig` 的深度可选映射（数组整体替换，与 defu 行为一致）。
- 模块新增**构建期边界警告**：尽力加载消费者 app.config.ts（临时注入恒等 `defineAppConfig` 全局），发现 `clarity` 下出现非 UI 键时输出 `[clarity-config] WARN`，提示迁移到 clarity.config.ts。

### 验证结果

| 场景 | 修复前 | 修复后 |
| --- | --- | --- |
| 部分覆盖 `header: { emojiTail: [...] }` | 通过 | ✅ 通过 |
| `header: { logo: 42, showTitle: 'yes', emojiTail: 'not-array' }` | 静默通过 | ✅ 3 个 TS2322 报错 |
| 读取 `useAppConfig().clarity.site.title` / `header.logo` / `feed.limit` / `article.order` / `component.alert.defaultStyle` | 侥幸正确 | ✅ 稳定全类型 |
| app.config.ts 写入 `clarity.site` / `clarity.article` | 静默覆盖 | ✅ 构建期 WARN |

> 已知限制：`defineAppConfig<C extends AppConfigInput>(config: C): C` 的泛型直通使未知键（如 `bogusGroup`）绕过多余属性检查；Nuxt appConfig 无运行时校验，此为框架层限制，由构建期警告与文档兜底。

## 3. #3 详情：客户端 bundle 泄漏

### 发现（实证自 `.output/public/_nuxt` 修复前产物）

`toPublicClarityConfig` 曾将**整个**解析后配置注入 appConfig，客户端 chunk 中出现：

```text
article:{...useRandomPermalink:!1,hidePostPrefix:!0,robotsNotIndex:[]},
feed:{limit:20,enableStyle:!0},
stats:{includePaths:[`posts/%`]},
integrations:{scripts:[]},
site:{...author:{...,email:`user@example.com`}}
```

### 修复

- `config/public.ts`：`ClarityPublicIntegrationsConfig = Omit<ClarityIntegrationsConfig, 'scripts'>`；`toPublicClarityConfig` 仅在有 twikoo 时注入 `integrations.twikoo`，scripts 由模块直接消费（注入 `<head>`），不再进 appConfig。
- 修复后 bundle 实证：`integrations:{}`（scripts 已消失）。

### 遗留（本轮文件范围受阻，登记为架构债务）

| 字段 | 阻断点 | 目标方案 |
| --- | --- | --- |
| `article.{useRandomPermalink, hidePostPrefix, robotsNotIndex}` | `shared/utils/clarity.ts:17` `useClarityArticle(): ClarityArticleConfig` 锚定完整 article 形状（shared/** 超出本轮允许修改范围） | 放宽返回类型为 `ClarityAppConfig['article']` 后即可 `Omit` 收窄 |
| `feed.*` / `stats.*` | `server/routes/atom.xml.get.ts`、`server/api/stats.get.ts` 经 `useClarityConfig()`（appConfig）读取（server/** 超出范围） | server 路由改从 `#clarity/config`（jiti 加载的完整配置）或私有 runtimeConfig 读取 |
| `site.author.email` | 同上（atom/opml 需要）；且 meta author 标签本就输出它 | 见 §4 |

> 注：三者均非密钥。`article` 三个字段是无敏感值的构建期布尔/路径；feed/stats 是数字与路径模式；email 见下节。

## 4. #4 详情：站点信息泄漏评估

| 项 | 现状 | 评估 |
| --- | --- | --- |
| `site.author.email` | 进入客户端 bundle + `<meta name="author">` + Atom/OPML | **按设计公开**（RSS/OPML 规范字段，主题定位为个人博客）。若消费者有反爬需求，建议未来提供 `features.hideAuthorEmail`（需改 server/shared，本轮范围外） |
| `runtimeConfig.public.clarity.siteVersion` / `sitePackageManager` | BlogTech 组件**主动展示**站点技术架构 | 有意的展示型数据（指纹风险由消费者自知）；非 public runtimeConfig 段不进客户端，secret 边界正确 |
| `antiMirror` 脚本 | 向页面内联 base64 编码的黑名单与站点 URL | 公开信息（镜像判定本就发生在浏览器端）；编码仅为规避构建扫描，非保密手段 |

结论：**无 secret 泄漏**（secret 边界 = 非 public runtimeConfig，未发现越界）；站点身份信息属公开数据，逐项登记如上。

## 5. #5/#6 详情：upstream-specific 默认值与硬编码

### 发现（高）

`modules/clarity-config/index.ts` 硬编码：

```ts
const defaultMirrorBlacklist = ['dgjlx.com', 'dgvhqt.com', 'hcmsla.com', 'wmlop.com', 'yswjxs.com']
```

这 5 个域名是**上游作者（纸鹿摸鱼处）的镜像站黑名单**，且被强制合并进**所有**消费者的 anti-mirror 脚本（`[...defaultMirrorBlacklist, ...blacklist]`）。`scripts/verify-theme.mjs` 的提纯规则未覆盖这批域名，属于漏网的上游残留——对第三方消费者既是信息污染，也可能触发无关域名的误跳转。

### 修复

- 删除默认黑名单；黑名单**完全**由站点配置提供。
- `features.antiMirror: true` 且 `blacklist` 为空时：跳过脚本注入并 `WARN`（避免注入永不生效的空脚本）。
- 其余检查项：`config/schema.ts` 默认值（`zh-CN` / `Asia/Shanghai` / `未分类` / tabler 图标导航）为面向目标受众的**主题级**默认，无作者个人信息；playground 使用 `example.com` 占位域名与通用作者名，无真实数据。

## 6. #7 详情：schema 静默丢弃

### 发现

zod `z.object()` 默认**剥离**未知键。`site.favincon`（拼写错误）、放错层级的顶层 `twikoo`、`scripts` 等都不会报错，直接被丢弃——错误配置悄悄失效。

### 修复

- `config/schema.ts` 与 `config/schema.mjs` 全部对象改为 `z.strictObject()`：未知键 → `unrecognized_keys` 报错。
- 唯一例外：`article.types` 的值保持 `z.looseObject({})`（版式扩展位，文档化）。
- `clarityHeadScriptSchema` 维持 `z.record`（script 元素属性天然开放）。

### 实证

注入 `site.favincon` 与顶层 `twikoo` 后，`nuxt build` 在**构建开始前**（content 配置加载链）失败：

```text
ERROR clarity.config.ts 校验失败：
  - site: Unrecognized key: "favincon"
  - (根对象): Unrecognized key: "twikoo"
```

## 7. 特别检查的七个分组

| 分组 | 归属 | 客户端可见 | 发现与处置 |
| --- | --- | --- | --- |
| `site` | clarity.config.ts | ✅（公开站点身份） | 字段完整；email 评估见 §4 |
| `article` | clarity.config.ts | 部分（categories/types/order 客户端使用；3 个构建期字段遗留入 bundle） | strict 化；遗留见 §3 |
| `feed` | clarity.config.ts | 遗留入 bundle（仅服务端使用） | 遗留见 §3 |
| `stats` | clarity.config.ts | 遗留入 bundle（仅服务端使用） | 遗留见 §3 |
| `integrations` | clarity.config.ts | twikoo ✅（客户端评论区需要）；scripts ❌ 已剔除 | `ClarityPublicIntegrationsConfig` 收窄 |
| `features` | clarity.config.ts | ✅（公开功能开关） | **功能缺口**：`atom/opml/stats: false` 只移除预渲染规则，server 路由仍可响应（需 server/** 修改，登记遗留；建议路由内检查 feature 后 404） |
| `changelog` | clarity.config.ts | ✅（更新日志组件） | 无问题 |

## 8. #8 详情：合并优先级实证

`.nuxt/app.config.mjs` 生成物末尾：

```js
export default defuFn(cfg0, cfg1, inlineConfig)
```

defu 首参优先 → **Consumer app.config > Theme app.config > 模块注入（inlineConfig）**。因此：

- 消费者 UI 覆盖真实生效（含数组整体替换）；
- 模块注入的站点派生默认（`header.logo` / `header.subtitle` / `footer.copyright`）处于最低优先级，不构成越权；
- 但反向成立：app.config.ts 里的站点级字段也会压过模块注入——由 §2 的构建期警告兜底。

## 9. #10–#13 详情：导出完整性与错误暴露

| 检查项 | 发现 | 处置 |
| --- | --- | --- |
| #10 错误时机 | 模块 setup（构建前）+ `defineClarityConfig()`（求值即校验）+ `createClarityContentConfig()`（内容链）三重失败点；原报错为裸 ZodError JSON | `config/define.ts`（及 `.mjs` 运行时链）与模块 `parseClarityConfig` 均改为带字段路径的友好错误；加载失败（jiti）单独包装 |
| #11 config/index.ts | 缺 `Nav` / `NavItem`（`theme-based-blog-v3/app/app.config.ts` 已在导入——发布即坏引用）、`NavGroup`、`Arch`、`ClarityUiConfigInput`、`ClarityPublicIntegrationsConfig` | 已全部补齐 |
| #12 content exports | `./content` → `content.d.mts`（类型真源 content.ts）+ `content.mjs`（Node 原生 TS 剥离受限场景运行时链）；`createClarityContentConfig` + `ArticleSchema` 覆盖当前公共契约 | 无需修改 |
| #13 schema exports | `./schema` 导出全部 `clarity*` zod schema 与类型；TS/JS 双实现已同步 strict 化 | 无需修改 |

附：`config/feed.ts` 原依赖 Nuxt 对 layer `shared/utils` 的类型自动导入解析 `Arch`，现改为显式 `import type { Arch } from '../shared/utils/icon'` 并从 `clarity-theme/config` 转出口，契约自包含。

## 10. 修改清单

| 文件 | 变更 |
| --- | --- |
| `config/schema.ts` / `config/schema.mjs` | strictObject 化（types 值保留 looseObject）；同步双实现 |
| `config/define.ts` / `config/define.mjs` | safeParse + 带字段路径的友好错误 |
| `config/public.ts` | `ClarityPublicIntegrationsConfig`（Omit scripts）；`toPublicClarityConfig` 剔除 scripts、按需注入 twikoo；可见性契约注释 |
| `config/app.ts` | 新增 `ClarityUiConfigInput`（深度可选 UI 覆盖输入类型） |
| `config/feed.ts` | 显式导入并转出口 `Arch` |
| `config/index.ts` | 补齐 `Nav` / `NavItem` / `NavGroup` / `Arch` / `ClarityUiConfigInput` / `ClarityPublicIntegrationsConfig` 导出 |
| `modules/clarity-config/index.ts` | 移除上游镜像域名默认黑名单；空黑名单跳过注入并 WARN；类型模板路径修复 + 双接口增强；jiti/parse 错误包装；app.config.ts 站点级字段构建期警告 |
| `docs/config-api-audit.md` | 本报告 |

## 11. 遗留事项（建议后续处理，均超出本轮允许修改范围）

1. **server 路由配置源切换**（解除 feed/stats/email 入客户端 bundle）：`server/routes/atom.xml.get.ts`、`server/api/stats.get.ts`、`server/routes/subscriptions.opml.get.ts` 改从 `#clarity/config` 导入（与 `#clarity/feeds` 同机制），随后 `toPublicClarityConfig` 可进一步收窄。
2. **`shared/utils/clarity.ts` 返回类型放宽**：`useClarityArticle(): ClarityArticleConfig` → `ClarityAppConfig['article']`，解锁 article 三个构建期字段的剥离。
3. **features 关闭时的路由禁用**：server 路由内检查 feature 并 404（当前仅移除预渲染规则）。
4. **可选 `site.author.email` 隐藏开关**：供反爬需求的消费者选择不出现在 meta/OPML。
5. **verify-theme 提纯规则**：可考虑把「模块中出现硬编码域名列表」列为通用检查（本次 5 个镜像域名未被既有规则覆盖）。

## 12. 验证记录

| 验证 | 命令 / 方法 | 结果 |
| --- | --- | --- |
| 类型检查 | `pnpm typecheck`（playground，含层叠类型链） | ✅ 通过 |
| 输入侧类型 | 注入 `logo: 42` 等错误值 | ✅ 3 个 TS2322 |
| 读取侧类型 | `useAppConfig().clarity.{site,article,feed,header,component}` 逐字段断言 | ✅ 全类型 |
| 部分覆盖兼容 | playground 现有 `header.emojiTail` 覆盖 | ✅ 通过 |
| strict schema | `site.favincon` + 顶层 `twikoo` | ✅ 构建前失败，友好报错 |
| 边界警告 | app.config.ts 写入 `clarity.site` / `clarity.article` | ✅ `[clarity-config] WARN` |
| 生产构建 | `pnpm --dir playground build` | ✅ exit=0 |
| bundle 泄漏 | 扫描 `.output/public/_nuxt` | ✅ scripts 已剔除；遗留项见 §3 |
| 主题提纯 | `pnpm verify` | ✅ 无上游泄漏 |
| lint | `pnpm lint`（eslint + stylelint 全量） | ✅ 通过 |
| RC 复验 | `pnpm lint / typecheck / verify / test:sync / test:consumer / test:compatibility / generate / peers check / pack` | ✅ 全部通过（2026-09-22，Node 24；consumer 33 路由 + 48 项断言，compatibility 33 项断言组） |

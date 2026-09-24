# Transform 面治理

[English](./transform-parity.md) | **简体中文**

`pnpm test:upstream-parity` 只覆盖 sync-manifest 的 `include` 同步面（`src/` 下的
upstream 派生源码）。`nuxt.config.ts`、`app/app.config.ts`、`content.config.ts`、
`package.json`、`pnpm-workspace.yaml` 属于 manifest 的 `transform` 分类——上游变更
时需要人工重新设计，source parity 对它们恒绿。DOUYIN 字体事故（详见 CHANGELOG
与 `docs/history/2026-09-24-repair-phase-1.md`）正是这个盲区：上游 `head.link` 新增静态字体链接，
Theme 侧遗漏，所有 parity 门禁仍然通过。

本文是 transform 面的人工对照登记表；`pnpm test:transform-parity`
（`tests/transform-parity.test.mjs`）把其中可机械判定的子集固化为门禁。

## 状态分类

| 状态 | 含义 |
| --- | --- |
| IDENTICAL | 与上游逐字（或仅机械路径前缀差异）一致，上游变更可直接同步 |
| TRANSFORM | 上游条目经重新设计后在别处实现（多为 `clarity-config` 模块注入） |
| DROP | 有意不随 Layer 下发，理由登记于此 |
| CLARITY-ONLY | Theme / Layer 边界自有条目，上游不存在 |

## `nuxt.config.ts` 对照

基准：manifest commit `f6ea97d`（上游 3.7.2）。

### `app.head`

| 上游条目 | Clarity 对应 | 状态 | 理由 |
| --- | --- | --- | --- |
| `meta: author` | `clarity-config` 注入 `site.author` | TRANSFORM | 站点数据来自 clarity.config.ts |
| `meta: color-scheme` | 同字面量 | IDENTICAL | |
| `meta: generator` | `Clarity Theme ${themeVersion}` | TRANSFORM | Layer 场景标识 Theme 自身而非消费包 |
| `meta: mobile-web-app-capable` | 同字面量 | IDENTICAL | |
| `link: icon (blogConfig.favicon)` | `clarity-config` 注入 `site.favicon` | TRANSFORM | |
| `link: alternate /atom.xml` | `clarity-config` 在 `features.atom` 时注入 | TRANSFORM | feature flag 门控 |
| `link: preconnect (twikoo.preload)` | `clarity-config` 注入 `integrations.twikoo.preload ?? envId` | TRANSFORM | |
| `link: katex / inter-variable / inter / gstatic preconnect / googleapis / DOUYIN` | 同字面量 | IDENTICAL | 静态资源必须逐字下发；门禁锁定 |
| `templateParams.separator` | 同字面量 | IDENTICAL | |
| `titleTemplate` | `clarity-config` 设 `%s %separator ${site.title}` | TRANSFORM | |
| `script: blogConfig.scripts` | `clarity-config` 注入 `integrations.scripts` | TRANSFORM | |
| `rootAttrs id=blog-root` | 同字面量 | IDENTICAL | |

### `modules`

| 上游模块 | Clarity 对应 | 状态 | 理由 |
| --- | --- | --- | --- |
| `@bikariya/image-viewer` / `@bikariya/modals` / `@bikariya/shiki` | 同名注册 | IDENTICAL | |
| `@nuxt/a11y` | 不注册（保留 devDeps） | DROP | alpha 阶段模块不强制下发给 consumer |
| `@nuxt/content` | 同名注册 | IDENTICAL | |
| `@nuxt/hints` | 不注册（保留 devDeps） | DROP | 开发期提示模块，属 consumer 可选体验 |
| `@nuxt/icon` / `@nuxt/image` / `@nuxtjs/color-mode` / `@nuxtjs/seo` | 同名注册 | IDENTICAL | |
| `@pinia/nuxt` / `@vueuse/nuxt` | 同名注册 | IDENTICAL | |
| `nuxt-llms` | 同名注册（列于 clarity-config 之后） | IDENTICAL | 其 setup 读取 clarity-config 注入的站点配置 |
| `unplugin-yaml/nuxt` | `vite.plugins: [Yaml()]` | TRANSFORM | 避免 module 向 consumer 注入无法解析的 `compilerOptions.types` |
| （上游经 modules 目录自动加载）`anti-mirror` | 显式注册 | CLARITY-ONLY | Layer 的 `src/modules` 不被自动加载，需显式注册 |
| — | `clarity-source-layout` | CLARITY-ONLY | 把 `src/` 布局仅应用到 Layer 自身 |
| — | `clarity-config` | CLARITY-ONLY | 站点配置桥接（clarity.config.ts → appConfig / head / SEO） |

### 其余顶层键

| 上游条目 | Clarity 对应 | 状态 | 理由 |
| --- | --- | --- | --- |
| `components`（Z 前缀 + 目录） | 同结构，路径加 `toThemePath` 前缀 | TRANSFORM | Layer 源码在包内 |
| `css`（6 个 scss 入口） | 同名同顺序，路径加前缀 | TRANSFORM | 门禁锁定文件名与顺序 |
| `experimental` | 同字面量 | IDENTICAL | |
| `nitro.prerender.autoSubfolderIndex` | 同字面量 | IDENTICAL | |
| `routeRules`（redirects.json 映射 + feature 路由） | feature 路由由 `clarity-config` 注入；redirects 映射归 consumer nuxt.config | TRANSFORM | `redirects.json` 是站点自有数据（manifest exclude） |
| `runtimeConfig.public` | 同字面量 | IDENTICAL | |
| `typescript`（nodeTsConfig include） | include 改 `../src/**`；另排除 `src/server` | TRANSFORM | `src/` 布局与 Layer server 边界 |
| `vite.css.additionalData` | 同内容，`_variable.scss` 加前缀 | TRANSFORM | |
| `vite.define` | 无 | DROP | 上游仅含注释掉的调试开关 |
| `vite.optimizeDeps.include` | 同清单 | IDENTICAL | 门禁锁定 |
| `vite.server.allowedHosts` | 同字面量 | IDENTICAL | |
| `vite.plugins` | `[Yaml()]` | CLARITY-ONLY | 见 modules 表 unplugin-yaml 行 |
| `alias` | 由 `clarity-config` 设置（`#clarity/*`、`~~/blog.config`、`~/feeds`、`~~/package.json` 等） | CLARITY-ONLY | 依赖注入层：上游同步文件无需改写即可解析 |
| `colorMode` | 同字面量 | IDENTICAL | |
| `content`（markdown 管线） | 插件路径指向 `src/remark-plugins/*.mjs`，其余同形 | TRANSFORM | @nuxt/content 以 Node 原生方式加载插件 |
| `dxup.namedLayoutSlots` | 同字面量 | IDENTICAL | |
| `hooks: ready` | banner 输出 Theme 名/版本 | TRANSFORM | |
| `hooks: content:file:afterParse` | 移至 `clarity-config` | TRANSFORM | permalink / hidePostPrefix 依赖站点配置 |
| `icon`（zi 集合） | `dir` 加前缀；clientBundle 同形 | TRANSFORM | |
| `image` | 同字面量 | IDENTICAL | |
| `linkChecker` | 同字面量 | IDENTICAL | |
| `llms` | `clarity-config` 注入 domain/title/description | TRANSFORM | |
| `ogImage.enabled: false` | 同字面量 | IDENTICAL | |
| `robots`（disallow） | `clarity-config` 注入 `article.robotsNotIndex` | TRANSFORM | |
| `site` | `clarity-config` 注入 | TRANSFORM | |

### `patches/`（manifest `manual` 分类）

| 补丁 | 状态 | 理由 |
| --- | --- | --- |
| `@nuxt__image` / `@nuxtjs__mdc` / `ipx` / `plain-shiki` | IDENTICAL | 与上游 patchedDependencies 一一对应 |
| `@vue__shared`（上游文件存在但未注册） | DROP | 上游遗留未注册文件，无需携带 |
| `temporal-spec` | CLARITY-ONLY | 上游使用 Temporal 旧类型名且不跑 typecheck，Theme 补类型别名 |

## 其余 transform 文件（摘要）

- `app/app.config.ts` → 上游为站点数据展开文件；Clarity 的 `src/app.config.ts` 仅占位（parity manifest `boundary`），真实注入在 `clarity-config`（UI 默认值 + clarity.config.ts + 0.1.x `clarity` 键覆盖）。
- `content.config.ts` → 上游单文件集合定义；Clarity 提供 `createClarityContentConfig()` 工厂（`clarity-theme/content`），由 consumer 的 `content.config.ts` 调用。
- `package.json` → 上游为应用包；Clarity 为可发布 Layer 包（exports / files / peerDeps）。
- `pnpm-workspace.yaml` → 上游 catalogs 按 monorepo 角色组织；Clarity 保留单包所需子集并登记补丁。

## 门禁与维护

- `pnpm test:transform-parity`：机械比对 `head.link`（字面量逐字下发、TRANSFORM/CLARITY-ONLY 登记）、`css`（同名同序）、`modules`（DROP/CLARITY-ONLY 登记）、`vite.optimizeDeps.include`（清单一致）。上游基线变化使断言失败时，先更新本表再更新测试中的登记集合。
- 上游 `head.link` / `modules` / `css` 新增条目 → 同步进 Layer 或在本表登记 DROP/TRANSFORM 理由，二者必居其一，不允许静默遗漏。

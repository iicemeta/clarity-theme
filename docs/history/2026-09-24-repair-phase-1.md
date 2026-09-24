# Repair Phase 1 报告（边界修复 + 最小防回归）

> 冻结记录：本文是 2026-09-24 Repair Phase 0 + Phase 1 的验收报告。
> 决策上下文见 `docs/reconstruction-decision.md`（DECISION: REPAIR）。

## 1. Baseline

| 项 | 值 |
| --- | --- |
| Clarity HEAD（起点） | `e3418e3f76b74f820ff79b39e35c9bac97f99438`（tag `create-v0.1.3`，theme version 0.1.4） |
| Upstream 基线 | `L33Z22L11/blog-v3@f6ea97d745517feb52f0c100e89acb36f0adc12f`（3.7.2） |
| 修复分支 | `repair/phase-1-boundary`（自 master 新建） |
| 基线 tag | `repair-baseline-0.1.4` |
| 起点 parity | identical 103 / mechanical 16 / boundary 10 / bugfix 1（include 120） |
| 未提交工作区 | 仅有前次审计遗留的未跟踪文档 `docs/reconstruction-audit.md`、`docs/reconstruction-decision.md`（保留未动） |

## 2. Issue A：DOUYIN 字体未随 Layer 下发

**结论：PASS**

- **Root cause**：upstream `nuxt.config.ts` 的 `app.head.link` 第 9 项——抖音美好体
  `https://fonts.bytedance.com/dfd/api/v1/css?family=DOUYINSANSBOLD-GB&display=swap`——是
  无配置依赖的静态资源，Layer 化时人工重写 `nuxt.config.ts` 过程中被遗漏。source parity
  对该文件恒绿：它属于 sync-manifest 的 `transform` 分类（上游变更需人工重新设计），
  不在 `include` 同步面内。`src/assets/css/font.scss` 的 `--font-creative` /
  `--font-stroke-free` 引用该字体族，链接缺失导致实际渲染回退 Inter。
- **Change**：`nuxt.config.ts` `head.link` 逐字补回该链接（与 upstream 相同位置、相同注释）。
  未触碰 `src/` 同步面。
- **Transform 治理**（防复发）：
  - `docs/maintainers/transform-parity.md` / `.zh-CN.md`：`nuxt.config.ts` 全量人工映射表
    （head.link / meta / modules / css / vite / alias / dxup / routeRules / patches…），
    状态机 `IDENTICAL / TRANSFORM / DROP / CLARITY-ONLY`，附 `app.config.ts`、
    `content.config.ts`、`pnpm-workspace.yaml` 摘要。
  - `tests/transform-parity.test.mjs` + `pnpm test:transform-parity`（接入 CI）：机械比对
    manifest commit 的 upstream `nuxt.config.ts` 与 Layer 版——head.link 字面量逐字下发、
    Theme 额外条目登记、css 同名同序、modules DROP/CLARITY-ONLY 登记、
    optimizeDeps.include 清单一致。已验证：用修复前的 `nuxt.config.ts` 跑该门禁即失败。
- **Verification**（真实浏览器，`document.fonts` + computed style 双证据）：
  - dev（playground，Nuxt dev）：`/`、`/link`、`/archive`、`/hello-clarity` 四页
    DOUYIN 字体 54 个 FontFace 注册、实际加载 8–18 个（未加载的是未用到的子集），
    页面元素 computed `font-family` 命中 `DOUYINSANSBOLD-GB`（`--font-creative` 与
    `--font-stroke-free` 两条链都验证到）。
  - production（`nuxt generate` 产物 + 静态服务）：四页 SSR HTML 均含该 `<link>`；
    字体注册/加载同 dev；文章页 `.text-creative` 元素 computed family 命中。

## 3. Issue B：consumer package.json 缺 version 时生产 client build 失败

**结论：PASS**

- **Reproduction**：真实 `file:` 安装 consumer，删除 `package.json` 的 `version` 后
  `nuxt build`：`MISSING_EXPORT: "version" is not exported by "package.json"`（exit 1，
  BlogTech.vue 的 `import { packageManager, version } from '~~/package.json'`）。
  仓库自带 `test:consumer` 从未覆盖此场景——它脚手架的 consumer 恒写 `version: '0.0.0'`。
- **Root cause**（完整链路）：
  1. BlogTech / atom.xml（upstream 同步文件，不可改写）以 `~~/package.json` 读取消费包数据；
  2. clarity-config 生成归一化 ES 模块 `src/generated/package-json.mjs`（恒有 `version` 导出）
     并把它注册为 `nuxt.options.alias['~~/package.json']`，排在 `~~`（→ rootDir）之前；
  3. **dev** 路径 vite 用 JS 版 alias 插件（@rollup/plugin-alias 语义，首个匹配生效），
     精确别名命中 → 生成模块，行为正确；
  4. **生产打包**（bundled 环境）vite 8 使用 rolldown 的原生 `viteAliasPlugin`
     （vite/dist `applyToEnvironment` 分支），其匹配语义让更短的 `~~` → rootDir 前缀别名
     抢先——实测证据：`order: 'pre'` 的探针插件收到 BlogTech 的 import 时，id 已被改写为
     `<rootDir>/package.json` 绝对路径（真实 JSON），生成模块别名在 client 打包中被架空；
  5. 真实 JSON 有 `version` 时命名导入碰巧成立（但会把 consumer 完整 package.json 打进
     client bundle）；缺 `version` 时即深层 bundler 错误。
- **Chosen design**：消除对跨构建 context 隐式 alias 匹配顺序的依赖——clarity-config 通过
  `vite:extendConfig` 注入 `clarity:build-data-redirect` 插件（resolveId，order 'pre'），
  把**已被改写后的**绝对路径 `<rootDir>/package.json`、`<rootDir>/pnpm-workspace.yaml`
  显式重定向到生成模块。无论哪个别名获胜，最终 id 都落在归一化模块上：
  - **client**：版本缺失也能构建（生成模块恒有导出；BlogTech 显示空值）；
  - **nitro**：server 路由（atom.xml 的 default 导入）行为不变；
  - **prerender**：既有 `prerender:config` externals.inline + tsconfig paths 不变，
    generate 全链路通过。
  一套契约覆盖三个 context，无分头 hack。缺 `name`/`version` 时另发构建期警告
  （不要求 consumer 必须提供 version，无需启动期 fatal）。
- **Regression**：
  - `test:consumer` 的 consumer `package.json` **刻意不再写 version**——每次真实
    pack→install→generate 全链路都覆盖缺 version 场景（收紧而非放宽）。
  - 连带发现并修复打包边界缺陷：`files: ["src"]` 会把 `src/generated/`（开发机上次构建
    写入的站点数据，含统计 ID/评论服务地址）打进 tarball；CI 干净检出下该目录不存在，
    故从未暴露。加 `!src/generated` 排除，tarball 审计为构建期生成引用
    （anti-mirror → generated/blog.config.mjs）增加登记豁免（该文件由 clarity-config
    在 consumer 构建期创建，按设计不随包分发）。
  - 修复 test-consumer 在 Windows 的 GNU tar `C:` 远程主机解析问题（`--force-local`），
    使该验收可在本机执行（断言逻辑未动）。
- **Verification**：缺 version 的 file: consumer `nuxt build` exit 0、`nuxt generate`
  exit 0（页面齐全）；带 version 场景回归通过 playground build/generate 与 test:consumer。

## 4. Issue C：0.1.x legacy config 触发 strict schema fatal

**结论：PASS**

- **Reproduction**：`clarity.config.ts` 含 `article.useRandomPermalink: true` →
  `defineClarityConfig` 阶段即 fatal：`clarity.config.ts 校验失败：Unrecognized key
  "useRandomPermalink"`（published 0.1.0 工件期的 schema 曾接受该键，0.1.4 移除）。
- **Legacy behavior**：strictObject 对一切未知键 fatal，旧 consumer 直接无法构建。
- **New behavior**：
  - `src/config/schema.ts` / `schema.mjs`（ts/mjs 孪生）新增 `legacyConfigKeys` 注册表与
    `stripLegacyConfigKeys()`；`defineClarityConfig`（define.ts/define.mjs）与模块内
    `parseClarityConfig` 双路径先剥离 legacy 键再 strict 解析；
  - legacy 键 → **警告 + 忽略**（"已废弃…已忽略。该 0.1.x 兼容将在 0.2.0 移除"）；
  - 注册表**之外**的未知键仍然 fatal（拼写保护不放宽）；
  - 现行主 API 方向不变：upstream-shaped 扁平 app config（`useAppConfig()`），
    未复活 `clarity.*` 嵌套配置，`useClarityConfig()` 未成为组件读取方式。
- **Sunset**：`docs/reference/api.md(.zh-CN)` 将 `useClarityConfig()` / `useClaritySite()` /
  `useClarityArticle()` / `useClaritySiteFeedEntry()` 标记 deprecated（读取注入的
  `clarity` app-config 键，0.2.0 移除，指引迁移 `useAppConfig()`）；
  `docs/guides/configuration.md(.zh-CN)` 增补「严格性与 0.1.x 兼容」章节。
- **Regression**：`tests/config-schema.test.mjs`（6 例：注册表收敛、剥离保真、未知键仍
  fatal、define 双行为）接入 `pnpm test:config` + CI；exports smoke 断言同步为新契约
  （旧断言编码的是本次任务明确推翻的"必须 fatal"契约——在报告中说明后修改）。
- **Verification**：file: consumer 携带 legacy 键 build/generate exit 0，构建日志输出
  废弃警告（Nuxt 双次加载配置各一次，模块内不重复警告）。

## 5. Issue D：file: 安装 + nuxt generate 没有预渲染页面 —— PHASE 2 BLOCKER

**结论：本阶段未能在干净环境复现（NOT REPRODUCED），未修复（NOT FIXED，按任务边界）**

- **Reproduction attempt**（当前环境，Windows + pnpm 12 + Nuxt 4.5.2 + Vite 8.3.0）：

  | Consumer | 安装形态 | build | generate | pages |
  | --- | --- | --- | --- | --- |
  | upstream 直接项目 | 直跑（f6ea97d 干净树） | — | exit 0 | 139 个 index.html |
  | clarity playground | workspace 链接 | — | exit 0 | 14 个 index.html |
  | clarity 最小 consumer | `file:` 目录 | exit 0 | exit 0（Prerendered 23 routes） | `/`、`/link`、`/archive`、文章、`/preview`、200/404 + atom/llms/stats/sitemap 全齐 |

  exit code / stdout / stderr / 生成目录 / HTML 数 / prerender 路由数均已留档
  （本机临时日志 + parity-lab 历史日志）。
- **Evidence（审计期症状，历史日志）**：`parity-lab/clarity-gen-norules.log`、
  `clarity-gen-shallow.log` 显示当时 generate 只预渲染数据路由
  （200/404/robots/opml/stats/llms/atom/sql_dump），**无任何页面路由**；
  `clarity-generate.log` 还有一次 Windows 原生崩溃（exit -1073740791 = 0xC0000409）。
- **Current hypothesis（未证实）**：
  1. Issue B 的重定向契约可能顺带稳定了 generate 阶段 client 构建的模块解析
     （同一 rolldown 原生 alias 路径）；
  2. 或审计期环境因素（该 lab consumer 的陈旧 node_modules / 多次中断的构建 /
     原生崩溃）导致，与主题无关。
- **Unknowns**：审计原始 consumer（parity-lab/clarity-consumer）当前被残留进程的
  sqlite `database is locked` 阻塞，无法在其上做 A/B 验证；本机也无法确认审计当时的
  精确依赖状态。
- **Phase 2 recommendation**：不复现 ≠ 已修复。在干净环境（CI runner / 新 clone +
  registry tarball 安装）做一次受控 A/B（0.1.4 基线 tag vs 本修复分支），对比
  prerender 路由清单与 nitro crawler 行为；若基线可复现而本分支不可，则 D 已被 B 修复
  覆盖，补一条 generate 路由断言回归即可关闭；否则继续向 Nuxt/Nitro prerender 层定位。

## 6. Parity

**PASS** —— `pnpm test:upstream-parity`：

```text
include 同步面文件：120
  identical  103
  mechanical 16
  boundary   10
  bugfix     1
✔ upstream parity 通过：同步面内无未声明的上游漂移
```

计数与修复基线完全一致，manifest 规则未放宽。`src/modules/clarity-config/index.ts`
（boundary 类，设计上的哈希锁定项）经审查变更后按流程刷新哈希。新增
`pnpm test:transform-parity` 补上 transform 面盲区。

其余回归：lint ✔、typecheck ✔、verify ✔、test:sync ✔（todo 0）、test:migration ✔（10/10）、
test:config ✔（6/6）、test:transform-parity ✔（6/6）、test:consumer ✔
（pack 审计 + exports 契约 + typecheck + generate ×3 分支断言，consumer 无 version）。
`docs:check` 仅余 4 项前次审计遗留未跟踪文档的预存失败，本次新增文档全部合规。

## 7. Remaining risks

1. **Issue D 未关闭**（见 §5）：`file:` + generate 在本机当前状态一切正常，但审计症状
   的根因未定位；按任务边界未做任何修复。
2. **审计遗留未跟踪文档** `docs/reconstruction-audit.md` / `reconstruction-decision.md`
   使 `docs:check` 保持 4 项失败（版本污染 + 缺双语配对）；需文档负责人决定归档
   （建议移入 docs/history 并补配对）。
3. **parity-lab/clarity-consumer 被残留进程锁库**（`database is locked`）：
   需清理该 node 进程后该 lab consumer 才能复用。
4. **consumer-b 复现目录的 `#modals` 解析失败**（parity-lab 同版本工具链下不复现）：
   与本次三个 Issue 无关，未追查；正式 consumer（minimal-consumer / test-consumer /
   playground）均正常。
5. **`src/generated/` 写入 node_modules 的既有设计**：registry 安装形态下向包目录写入
   构建产物（本次通过 tarball 排除避免了 store 污染扩散，但写入行为本身仍在），
   属 Phase 2+ 的设计议题。
6. 0.2.0 需兑现的删除项：legacy 键兼容层（`legacyConfigKeys` + 剥离逻辑）、
   `clarity` app-config 键与 `useClarityConfig()` 系列助手。

## 8. Commits

- `fix(boundary): restore upstream font metadata`（Issue A + transform 治理 + 字体回归）
- `fix(consumer): harden package metadata and legacy config`（Issue B/C + 回归 +
  打包边界 + sunset 文档）

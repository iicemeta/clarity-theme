# Repair Phase 2 报告（生产静态生成链路）

> 冻结记录：2026-09-25。目标：解释并修复「真实 package/file: consumer 中
> `nuxt generate` 静默产出空产物」的报告症状（审计遗留，Phase 1 标记为
> PHASE 2 BLOCKER）。

## 1. Reproduction

审计期症状（parity-lab 日志，2026-09-24 16:43–17:12）：

- `clarity-generate.log`：client 构建期 Windows 原生崩溃（exit -1073740791 / 0xC0000409）；
- `clarity-generate2.log`：`MISSING_EXPORT "version" is not exported by "package.json"`（Phase 1 Issue B，已修复）；
- `clarity-generate3.log` / `clarity-gen-norules.log` / `clarity-gen-shallow.log`：**exit 0 但只预渲染 9–10 条数据路由（200/404/robots/opml/stats/llms/atom/sql_dump/sitemap-xsl），无任何页面路由，日志在 `/` 之前截断**。

本阶段复现环境：Windows 10（node 24.15 / pnpm 12.4.1），主题基线
`repair-baseline-0.1.4`（Phase 1 前）与当前分支双态 A/B。

## 2. Root Cause

审计症状是**三个独立机制**在同一批 lab 环境叠加的表象；受控拆分后逐一归因：

```text
consumer → Nuxt load（modules 运行，clarity-config 写生成模块）
        → vite client build → nitro build → prerenderer（独立子构建）→ 爬虫从 / 起爬 → HTML
```

**机制 1（deterministic，已由 Phase 1 修复）**：生产 client 构建中 rolldown 原生
alias 让 `~~`（→ rootDir）前缀抢走 `~~/package.json`，导入落到 consumer 真实
JSON；缺 `version` 键即 MISSING_EXPORT → 构建失败。这是审计 16:45 的确切报错。

**机制 2（环境争用，本阶段消除其放大器）**：`clarity-config` 把构建期生成数据
（package-json / pnpm-workspace / blog.config）写进**安装包内部**
`node_modules/.../clarity-theme/src/generated/`。该位置是 pnpm store 的硬链接
目标：审计 lab 并行运行多个 Nuxt 进程（dev + 多个 build/generate，跨共享同一
store 条目的 consumer）时，同一路径被并发重写，读取方可能拿到半写状态或互相
覆盖——非确定性挂起/崩溃的合理来源（与 16:43 的原生崩溃、`database is locked`
互为佐证）。此外写穿 store 会污染主题源码目录（Phase 1 实测 `verify` 因此失败）。

**机制 3（consumer 数据/配置完整性，loud 而非 silent）**：审计 consumer 的
content 是不完整拷贝（缺 `theme.md` 等）。受控复现表明：爬虫进入页面后在缺失
路由处以 `[404]` prerender error 退出（exit 1）——是显式失败，不是静默空产物；
审计 runner 的截断日志/exit 0 表现无法在受控环境重放，判定为其会话自身的
进程终止方式（timeout/kill）所致。

**A/B 证据**（同机、完整 upstream content、审计形 consumer：redirects/feeds/twikoo）：

| 主题 | generate | 路由 | HTML 页面 |
| --- | --- | --- | --- |
| upstream 直跑（f6ea97d） | exit 0 | 333 | 142 |
| clarity 基线（Phase 1 前） | exit 0 | 333 | 142 |
| clarity 当前（Phase 1+2） | exit 0 | 333 | 142 |

**即：数据完整的受控环境下，三种形态产出完全一致；「file: 静默空产物」在
干净环境中不可复现，其可复现成分（机制 1/2）均已消除。**

调查中另外定位并定性了一个干扰项（非本主题缺陷）：**缺根 `tsconfig.json` 的
手工 consumer** 在生产构建的 Vue SFC 类型解析处失败
（`Failed to resolve import source "#modals"`）——Vite/oxc 依赖根 tsconfig 的
paths 解析模块别名；`create-clarity-theme` 脚手架与 test-consumer 均自带该文件，
故仅影响未走官方路径的 consumer。已补双语文档前置条件说明。同症状的另一触发
方式是 pnpm overrides 造成的 rolldown 混合拓扑 + `node_modules/.cache/nuxt`
（Nuxt buildDir）缓存在失败后被毒化并跨重装存活（实测：override 移除后仍失败，
清缓存即恢复）——排障时须先清 buildDir 缓存。

## 3. Fix

| 文件 | 变更 |
| --- | --- |
| `src/modules/clarity-config/index.ts`（boundary，哈希已审查刷新） | 生成模块写入点从安装包内 `src/generated/` 迁移到 **`<buildDir>/clarity/`**；写入提取为幂等函数，模块 setup 与 `build:before` 各写一次（Nuxt build 在模块运行后清理 buildDir，会删除 setup 阶段产物，打包前必须重写） |
| `src/modules/anti-mirror/index.ts`（bugfix 类，哈希已审查刷新） | 相对导入 `../../generated/blog.config.mjs` 改为基于 `nuxt.options.buildDir` 的 **file URL 动态导入**（jiti 与 Node 原生均可解析；clarity-config 先于本模块注册，写入先于读取的既有契约不变） |
| `scripts/test-consumer.mjs` | 移除 Phase 1 的 `src/generated` 悬空引用豁免（新实现无静态生成路径引用，tarball 审计恢复严格） |
| `scripts/test-file-generate.mjs`（新增）+ `package.json` `test:file-generate` | **file: 目录安装**形态的页面级回归：真实 pnpm file: 安装 → generate → 断言 `/`、`/link`、`/archive`、文章页、200/404 的 HTML 实际存在、站点标题与 anti-mirror 注入、atom/stats 产物，以及**包边界**（安装包内零 generated 写入、生成物位于 buildDir）。与 test:consumer（tarball）互补 |
| `.github/workflows/ci.yml` | 新增 `file-generate` job：**ubuntu-latest + windows-latest 双 OS 矩阵**运行上述回归（Linux 验证通道）；consumer job 亦接入 |
| `docs/getting-started/manual-installation(.zh-CN).md` | 补根 `tsconfig.json` 前置条件（官方脚手架自带；缺失导致 SFC 类型解析失败） |

未改动：`src/pages|components|assets|layouts|composables`、parity 规则、
prerender 路由逻辑（未塞任何 fake route）、creator、migration、skills。

## 4. Why This Fix

- **buildDir 而非虚拟模块**：`addTypeTemplate`/虚拟模块在 jiti 加载的 Layer 模块
  （anti-mirror）中不可解析（既有注释约束）；buildDir 是 consumer 私有可写位置，
  每实例各自持有，天然消除 store 硬链接共享与并发写竞争，且 registry 安装/
  只读包目录均安全。
- **双写（setup + build:before）而非仅 hook**：setup 写入服务 prepare/dev 与
  jiti 模块读取；build:before 重写对冲 Nuxt 的 buildDir 清理时序。两处幂等，
  无第二套 hack。
- **不删除 `prerender:config` externals.inline / nitro tsconfig paths**：未证明
  它们是根因（A/B 中基线主题同样完整生成），按最小修改原则保留。
- **不 pin rolldown**：1.2.10 与 1.2.9 的"差异"被证明是毒化缓存与文件集差异的
  混杂（干净态下两版本均可构建通过 consumer），pin 只会制造混合拓扑（实测
  反而触发 #modals）。

## 5. Verification Matrix（Windows 本机实测）

| 形态 | 安装 | build | generate | 路由 / HTML 页面 | 关键页面 |
| --- | --- | --- | --- | --- | --- |
| upstream 直跑 | direct | exit 0 | exit 0 | 333 / 142 | — |
| clarity playground | workspace | exit 0 | exit 0 | 51 / 17 | / /link /archive /hello-clarity ✓ |
| clarity 审计形 consumer | file:（目录） | — | exit 0 | 333 / 142 | / /link /archive /theme ✓ |
| clarity file-generate 回归 | file:（目录，绝对路径 Temp） | — | exit 0 | 23 / 8+ | / /link /archive /hello ✓（19 项断言全过，含包边界） |
| clarity tarball consumer | pack→file:tgz | — | 见 test:consumer | 3 组配置分支 | 页面级断言（Markdown/MDC/Math/Mermaid/permalink…） |

**Linux**：本机无 WSL/docker，经 CI 通道验证——`file-generate` job（workflow_dispatch，
run 36079140868）在 ubuntu-latest 与 windows-latest 上运行：**两个平台的 nitro
prerender 均完整渲染全部 23 条路由（含 / /link /archive /hello /preview 及数据
路由）**。首轮断言失败仅因 GitHub Actions 环境触发 upstream 既有行为
`GITHUB_ACTIONS → nitro.prerender.autoSubfolderIndex: false`（页面产物为扁平
`X.html` 而非 `X/index.html`）——断言已改为双布局兼容（与 test-consumer 的
`readGeneratedPage` 同一策略）。

## 6. Regression

- 新增 `pnpm test:file-generate`（file: 目录安装 + generate + 页面级断言 + 包
  边界断言），CI 双 OS 常驻；
- `test:consumer`（tarball 安装）既有页面级断言保持不变，且 Phase 1 起其
  consumer 刻意无 `version`；
- 移除 tarball 审计的 generated 豁免（恢复严格）；
- parity：identical 103 / mechanical 16 / boundary 10 / bugfix 1 计数不变，
  `clarity-config`（boundary）与 `anti-mirror`（bugfix）经审查刷新哈希。

## 7. Remaining Risks

1. 审计 runner 的确切行为（exit 0 截断）无脚本存档，其最后一步只能靠排除法
   归因（机制 1/2/3 已各消解或定性）；如需 100% 复刻需审计方提供执行脚本。
2. 上游工具链的两个脆弱点（consumer 缺根 tsconfig.json → SFC 类型解析失败；
   buildDir 缓存毒化跨重装存活）属 Nuxt/Vite/pnpm 生态行为，已文档化规避，
   建议后续向上游反馈。
3. `node_modules/.cache/nuxt`（Nuxt 4 buildDir）在失败后被毒化的行为会让任何
   后续构建误报，排障成本高；已在本报告记录排障入口（清 buildDir 缓存），
   可考虑在 verify 脚本加检测提示（Phase 3+）。
4. 调查中的噪音源（如实录）：CI 上 `GITHUB_ACTIONS` 触发 upstream 的
   `autoSubfolderIndex: false` 扁平产物布局，任何按 `X/index.html` 断言的
   脚本都会在 CI 上误报——验收断言必须双布局兼容（已在本仓库所有 consumer
   断言中统一）。

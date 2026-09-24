# Clarity Theme 重建决策审计报告

> 审计日期：2026-09-24
> 审计对象：`iicemeta/clarity-theme` @ `e3418e3`（master，tag create-v0.1.3；主题版本 0.1.4）
> 上游基线：`L33Z22L11/blog-v3` @ `f6ea97d`（版本 3.7.2）
> 审计方式：只读考古 + git 历史分析 + 双 reference consumer 运行时对照 + 生产构建复现。**未修改任何主题核心源码。**

---

## 1. Executive Summary

**这个项目到底是什么：** clarity-theme 是把上游博客 blog-v3（其主题本身名为 "Clarity"）提取为 Nuxt 4 Layer 的主题包。它经历过两个截然不同的架构时代：

- **0.1.0 时代（已被抛弃）**："重写式主题"——把上游组件逐个改写为读 `useClarityConfig()` 嵌套键的 Clarity 专用组件。这个时代产生了 46 个文件的漂移、组件与配置形状不匹配，是维护者体验到"样式丢失、/link 崩坏、不如 init-project"的直接来源。
- **0.1.4 时代（当前，2026-09-24 的 `d263d4d` fidelity reset）**："忠实提取"——120 个同步面文件中 103 个与上游字节级一致、16 个仅做类型导入路径的机械改写、10 个声明的边界文件。组件读回 `useAppConfig()` 扁平键，配置由 `clarity-config` 模块注入为上游形状。

**最重要的结论：维护者记忆中的"/link 崩坏"属于 0.1.0 重写式架构，且已被 fidelity reset 修复。** 本次审计在受控双 consumer 对照中验证：当前 master 在 dev SSR 下 /link 页面的 DOM 结构与 upstream **完全一致**（9 卡片、2 分组、类名相同，唯一差异是 emojiTail 数量这一站点数据差异）。

**但 source parity 成立 ≠ 交付质量成立。** 本次审计发现当前 master 存在四个真实的、可复现的边界缺陷：

1. **抖音字体（DOUYINSANSBOLD-GB）样式表未随 Layer 下发**——上游 `nuxt.config.ts` 的 `app.head.link` 里有 bytedance 字体链接，Layer 版抄漏了。`--font-creative` / `--font-stroke-free`（FeedGroup 标题、archive 标题、文章样式都引用）的字体栈虽一字不差，但浏览器实际回退到 Inter/系统字体。这是"CSS 源码完全一样、渲染结果不一样"的实证。该文件在 sync-manifest 中属 `transform` 类，**不在 parity gate 的比对面内**，所以字节级门禁永远抓不到它。
2. **真实 consumer 的生产构建对 `package.json` 缺 `version` 字段的包直接失败**（`MISSING_EXPORT: "version" is not exported by "package.json"`，BlogTech.vue）。根因：`~~/package.json` → 生成模块 `src/generated/package-json.mjs` 的 alias 在 client 构建上下文**从未生效**，实际一直解析到 consumer 真实 JSON、靠 Vite JSON 插件的 namedExports 兜底。playground 和官方 consumer fixture 的 package.json 恰好都有 `version`，所以全绿。
3. **file:（npm 打包形态）安装的 consumer，`nuxt generate` 静默产出没有任何预渲染页面的产物**——`/` 及全部应用页面从未渲染，exit 0，无完成横幅。官方模板最小 consumer 同样复现；workspace 链接的 playground 不复现；同机 upstream 正常。机制未完全定位（嫌疑在 prerenderer 内联 hack / 生成模块 / Windows×pnpm 交互），属于 blocker 级待查项。
4. **配置 API 对 0.1.0 consumer 无兼容**：schema 是 strictObject，旧配置里的 `useRandomPermalink` 键直接让构建期校验致命失败（本审计实测踩中）。

**根因总结（一句话）**：问题不在 Layer 抽象本身，而在边界层——`clarity-config` 模块为了适配上游的 `~~/package.json`、`~~/pnpm-workspace.yaml`、`~~/blog.config` 引用而搭的"生成模块 + 别名 + prerender 内联"机器，在三个构建上下文（client / nitro / prerenderer）中只有部分生效，形成了"每个上下文各兜各的、没有任何一处被真正验证"的暗物质层；同时 `nuxt.config.ts` 这类手工转换面脱离了 parity 管控，产生了字体链接这样的静默丢失。

**是否继续当前实现？** 是。是否 reconstruction？**不需要推倒重建，需要一次有边界的修复**（详见 [reconstruction-decision.md](./2026-09-24-reconstruction-decision.md)，结论：REPAIR）。是否重新考虑 Layer？**不需要**——双 consumer 对照已证明 Layer 在 dev/workspace 形态能达到与 upstream 逐标签一致的渲染，Layer 与 blog-v3 结构的冲突已被 `src/` 布局 + 别名桥解决到可工作程度；需要的是把"真实安装形态的生产管线"修到同样可靠。

---

## 2. Current Architecture（当前架构）

```text
L33Z22L11/blog-v3 (upstream, f6ea97d)
        │  sync-manifest.json: include/exclude/transform/manual 四类
        │  pathMap: app/→src/, modules/→src/modules/, public|remark-plugins|server|shared 同理
        ▼  scripts/sync-upstream.mjs（check/diff/apply/verify）
┌─────────────────────────────────────────────────────────────┐
│ clarity-theme (Nuxt Layer 包，入口 nuxt.config.ts)            │
│                                                             │
│  nuxt.config.ts（手工转换面，不进 parity gate）                 │
│   ├─ css: 6×src/assets/css/*.scss（绝对路径注册）              │
│   ├─ scss.additionalData ← src/assets/css/_variable.scss     │
│   ├─ components: src/components(+ Z 前缀 partial)             │
│   ├─ modules: clarity-source-layout → 官方模块 →              │
│   │           clarity-config → anti-mirror → nuxt-llms        │
│   └─ app.head.link: katex/inter/JetBrains/Noto               │
│       ⚠ 无 bytedance DOUYIN 字体（upstream 有）                │
│                                                             │
│  src/modules/clarity-source-layout（边界模块 #1）              │
│   ├─ 运行时改写 layer.config.srcDir/dir.* → src/              │
│   ├─ layer alias ~ @ ~~ @@ → 消费项目目录                      │
│   └─ 直接改 Nuxt 内部 getLayerDirectories() 缓存（无官方 API）  │
│                                                             │
│  src/modules/clarity-config（边界模块 #2，589 行）              │
│   ├─ jiti 加载 clarity.config.ts（zod strictObject 校验）      │
│   ├─ 别名注入：~~/blog.config、~~/shared、~/feeds、            │
│   │   ~/shiki.config、#clarity/config、#clarity/feeds         │
│   ├─ ⚠ 构建期向主题包内写 src/generated/{package-json,        │
│   │   pnpm-workspace,blog.config}.mjs（副作用写入依赖目录，     │
│   │   pnpm 硬链接布局下会穿透 store）                           │
│   ├─ alias ~~ /package.json、~~/pnpm-workspace.yaml → 生成模块 │
│   │   ⚠ 实测 client 构建中此 alias 不生效（见 §5.2）            │
│   ├─ prerender:config / nitro:config 内联 hack                │
│   ├─ prepare:types / nitro:prepare:types 类型垫片              │
│   ├─ updateAppConfig：扁平上游形状 + 0.1.x clarity 兼容键       │
│   └─ SEO/robots/llms/routeRules/head 注入                     │
│                                                             │
│  src/（120 文件同步面：103 identical + 16 mechanical）         │
│   └─ assets/components/pages/layouts/composables/...          │
│                                                             │
│  外围（不进 npm 包）：playground、tests、scripts、docs、        │
│   skills×2、create-clarity-theme、.github×4 workflows         │
└─────────────────────────────────────────────────────────────┘
        │  extends: ['clarity-theme']（npm / git / 本地安装）
        ▼
consumer（nuxt.config.ts + clarity.config.ts + content.config.ts
         + content/ + feeds.ts? + app/app.config.ts?）
```

### 依赖 / 数据流（真实生效路径）

```text
配置流：
  clarity.config.ts ──jiti──▶ clarity-config 模块
      ├─ updateAppConfig(扁平上游形状) ─▶ useAppConfig()（组件读取，与 upstream 同构）
      ├─ src/generated/blog.config.mjs ─▶ anti-mirror（jiti 上下文）
      ├─ alias ~~/blog.config ─▶ src/blog.config.ts（App/Nitro 上下文，读 #clarity/config）
      ├─ alias ~~/package.json ─▶ src/generated/package-json.mjs
      │     ⚠ 仅 Nitro/prerender 上下文生效；client 上下文落到真实 JSON
      └─ runtimeConfig.clarity（服务端私有，现已基本闲置）

CSS 流：
  Layer css[]（绝对路径） ─▶ Vite 收集 6 个全局 SCSS
  _variable.scss 经 additionalData 注入每个 SCSS 编译单元
  组件 <style scoped> 随组件 chunk
  字体：katex/Inter/JetBrains/Noto 走 CDN <link>；
        DOUYIN 字体 ⚠ 丢失（仅此一处断链）

构建期生成物：
  clarity-config setup ─▶ 写 src/generated/*.mjs（主题包内）
  ⚠ 与运行中 dev server / 其他 consumer 构建共享同一份文件
```

---

## 3. Git 历史地图（62 commits，2026-09-21 → 09-24）

| 时段 | 里程碑 | 性质 |
| --- | --- | --- |
| 09-21 `1261939` | 001 fork blog-v3 baseline | 基线原样拷贝 |
| 09-21 `ca0c377`–`83243bc` | 003 clarity.config API、005 layer-local nuxt.config、008–027 server 迁移、alias 规范化、playground、sync 脚本与 manifest | **重写式架构时代**：组件改读 `useClarityConfig()`，逐文件手工适配 |
| 09-21/22 `4ebb1b1` | v0.1.0 发布门禁 + npm publish 流水线 | 0.1.0 上线（theme-based-blog-v3 消费的 tgz 即此代） |
| 09-22 `eeaf21f` | src layout 迁移（app/ → src/）+ clarity-source-layout 模块 | **关键转折**：为 Layer 目录语义打补丁，开始触碰 Nuxt 内部缓存 |
| 09-22 `e2b2d9e`–`0f51c81` | v0.1.2、create-clarity-theme CLI、v0.1.3、引导式 prompts | 脚手架扩张期 |
| 09-23 `e3cd9d3`–`34a8522` | 文档架构重组、MDC 审计 wiki、article-beautifier skill | 文档/技能扩张期（docs/mdc/** 100+ 文件） |
| 09-24 `d263d4d` | **audit/upstream-fidelity-reset**：恢复 46 个漂移文件至 f6ea97d 字节级、引入 parity gate、扁平 appConfig 注入、生成模块别名桥、上游 patch 随包 | **第二次关键转折：抛弃重写式架构，转向忠实提取** |
| 09-24 `7a587d6`–`e3418e3` | BlogTech widget 修复、v0.1.4 发布、creator 0.1.1–0.1.3 | 当前状态 |

**历史结论**：维护者"不知道哪些是核心设计"的迷失感来自两代架构叠加——0.1.0 的重写遗产（useClarityConfig 兼容层、clarity.config 嵌套 schema、migration skill 的旧映射）与 0.1.4 的忠实提取层（parity manifest、扁平注入、别名桥）同时存在于仓库中，文档没有把"0.1.0 已被判决死刑"这件事讲清楚。

---

## 4. UPSTREAM_RUNTIME_MODEL（上游运行模型）

上游是一个**自足站点**而非主题包：

- `pnpm init-project` = **原地自毁式初始化**：删除全部 `content/`、用正则重写 `app/app.config.ts`（去作者化：logo 改为 blogConfig 派生、外部化 /theme 链接、birthYear→0、wordCount→''、emojiTail→默认）与 `blog.config.ts`（占位站点数据）、写默认 `app/feeds.ts`（1 组 1 条目，含"Clarity 主题作者"示例）、`redirects.json`。**官方初始化之所以能用，是因为整个 app/ 目录、全部依赖、patches、nuxt.config 原封不动留在用户手里**——不存在任何跨包边界。
- 站点数据流：`blog.config.ts`（根） → `nuxt.config.ts`（head/SEO/routeRules 直接展开） + `app/app.config.ts`（`...blogConfig` 扁平展开进组件的 `useAppConfig()`）。
- 关键约定：`~~/package.json`、`~~/pnpm-workspace.yaml`（BlogTech widget 读技术栈版本）、`~~/blog.config`（server 路由与模块读）、`~/feeds`（友链数据）、`~~/shared`（server 工具）——**全部是"站点根目录"语义**，这正是 Layer 化的全部难点所在。
- 模块面：`@nuxt/a11y`、`@nuxt/hints`、`unplugin-yaml/nuxt` 在上游注册；Layer 版替换/省略了这三者（unplugin-yaml 改为直接注册 vite 插件——为避免向 consumer 注入无法解析的 types；a11y/hints 留在 devDeps 未注册）。
- `dxup: { features: { namedLayoutSlots: true } }`：上游与 Layer 都依赖 dxup 特性开关（页面 `<template #aside>` 具名插槽进布局），两侧一致。
- patches：上游 5 个 patch 中 4 个与 Layer 内容一致（仅行尾差异），缺的 `@vue__shared.patch` 仅类型层（`.d.ts`），无 runtime 影响。

---

## 5. Parity 分层结论

### 5.1 Source Parity：✅ 成立（且是这套体系最强的部分）

`pnpm test:upstream-parity`：120 文件 —— 103 identical / 16 mechanical（全部是 `import type` 路径改写，编译期擦除）/ 10 boundary（基础设施，hash 锁定）/ 1 bugfix（anti-mirror 的 oxc-minify 异步误用，上游真 bug）。16 个 mechanical 的替换规则逐条登记在 manifest，改动即红。

**但 parity 面有盲区**：`nuxt.config.ts`、`app.config.ts`、`content.config.ts`、`pnpm-workspace.yaml` 属 `transform` 类，**只被 sync 工具理解、不被 parity gate 逐内容校验**。字体丢失正是从这个盲区漏进来的。

### 5.2 Runtime Parity：部分成立，四处实证缺口

双 reference consumer（相同 content/link.md/feeds 数据集）对照结果：

| 检查项 | 结果 |
| --- | --- |
| /link dev SSR DOM 标签序列（LCS diff） | **逐标签一致**（仅 emojiTail span 数量差异 = 站点数据） |
| /link feed-card / feed-group 计数 | 9/9、2/2 一致 |
| 组件解析 | 同名同内容组件（partial Z 前缀注册一致） |
| SCSS 变量注入 | 同一 `_variable.scss`，additionalData 均生效 |
| 6 个全局 SCSS | 均加载；Layer 侧 dev 模式下每个样式表 **双 URL 重复加载**（/@fs/ 与普通路径，绝对路径注册的副作用，生产未见异常） |
| **字体加载** | ❌ upstream `document.fonts` 有 53 个 DOUYINSANSBOLD-GB 字面 loaded；Clarity 为 **0**。computed font-family 栈两侧一字不差——CSS 源码相同的完美反讽 |
| **生产 client 构建** | ❌ consumer package.json 无 version 字段时 MISSING_EXPORT 崩溃（alias 未生效实锤：若 alias 生效，生成模块恒有 `version` 导出，不可能因 JSON 字段缺失而炸） |
| **生产 generate** | ❌ file: 安装形态下全部页面未预渲染、exit 0 静默（playground workspace 形态正常，官方模板最小 consumer 复现） |
| payload | upstream dev 内联了渲染 vnode 字符串，Clarity 无（dev 行为差异，无视觉影响） |

### 5.3 Visual Parity：结构性一致；记录性差异如下

生产截图（UR static @4180 vs playground static @4182，同主题代码不同站点数据）：

| 页面 | 像素差异率 | 判读 |
| --- | --- | --- |
| /link light 1440×900 | 6.77% | 站点标题/头像/文案不同 + 字体回退差异 |
| /link dark | 15.18% | 同上，暗色下描边字体回退更醒目 |
| / mobile 390×844 | 4.46% | 移动布局结构一致 |

差异主要来源（按证据强度排序）：① DOUYIN 字体回退（分组标题 `.feed-title` 80px 描边字在 Clarity 侧渲染为普通粗体——已由 computed style + document.fonts 双重确认）；② 站点身份数据（预期差异）；③ 友链组内随机排序（`randomInGroup`，数据级）。

**0.1.0 时代的 /link 崩坏已定案**：该版本组件全面改用 `useClarityConfig()` 读嵌套 `clarity` 键（BlogSidebar/FeedCard/link.vue 均如此，实测 tgz 源码），配置注入也只注入嵌套键——半重写状态下的形状错配是当时页面损坏的直接来源。v0.1.4 已整体回滚该路线。

---

## 6. 测试体系审计

| 测试 | 验证什么 | 覆盖层 | 判定 | 处置建议 | 证据 |
| --- | --- | --- | --- | --- | --- |
| `test:upstream-parity` | 同步面 120 文件逐字节 vs upstream blob | SOURCE | **CORE**：这是防止"随手改上游组件"复发的关键门禁，正是它锁住了 fidelity reset 的成果 | KEEP | 本次运行通过；0.1.0 的漂移正是无此门禁时代的产物 |
| `verify`（verify-theme） | 私密数据泄漏 / 站点文件入包 / 跨项目路径引用 | 打包边界 | **CORE** | KEEP | 脚本头部的边界原则与 d263d4d 后语义一致 |
| `test:sync`（sync-upstream 回归） | 同步工具 fast-forward/conflict/rollback | 工具 | REAL_REQUIREMENT（sync 可靠性是主题存续前提） | KEEP | node:test 覆盖 apply 各分支 |
| `test:migration` | migration skill 契约（frontmatter/引用/fixture 计划） | 元层 | INSTRUMENTATION：测的是 skill 文本契约而非迁移行为 | KEEP（轻量） | 断言 SKILL.md 结构与 references 存在 |
| `test:contract` | compatibility 契约与 docs 同步 | 元层 | INSTRUMENTATION | KEEP | `--contract-only` 快速 |
| `test:consumer` | pack→tarball→安装→typecheck→3 配置分支 generate→产物断言 | 打包+RUNTIME(弱) | **CORE，但有两处失明**：① Windows 下 tar 路径 bug（`C:` 被当远程主机）直接不可运行；② fixture package.json 带 version 字段，MISSING_EXPORT 一类缺陷永远踩不中 | KEEP + FIX | 本机实测 tar 崩溃；版本字段实测 |
| `test:compatibility` | 生产 SSR 路由断言 + 真浏览器 CDP（Shiki/Mermaid/hydration）+ dev 水合检查 | RUNTIME | **REAL_REQUIREMENT（现体系中最接近 runtime parity 的资产）**，但自引用（playground 对自己的期望），无 upstream 对照 | KEEP + 扩展为双 consumer 对照 | 947 行，原生 CDP 无依赖，工程质量高 |
| `test:create*`（CLI/E2E/tarball） | creator 包 QA | 工具 | REAL_REQUIREMENT（独立包） | KEEP（冻结功能扩张） | 独立 workspace |
| `test:registry-consumer` | 已发布 npm 版本安装冒烟 | 发布 | INSTRUMENTATION | KEEP（仅发布时） | release 流程 |
| `release:check` / `docs:check` | 发布门禁 / 文档治理 | 元层 | INSTRUMENTATION | KEEP | — |
| **缺失** | 视觉/computed-style parity；真实 consumer × upstream 渲染对照 | VISUAL | **空白** | 新建（本次 parity-lab 即原型） | `project-status.md` 自己承认 "not visual quality" |

**测试体系总评**：结构远比"历史遗留堆积"健康——Layer1/2/3 分层清晰、各有真实目标。真正的问题是**覆盖重心错位**：source parity 严防死守，runtime parity 只有 playground 自检，visual parity 为零。维护者的直觉"测试很多但页面还是坏"由此得到解释：**门禁守护的层与出事故的层不是同一层。**

---

## 7. 文档体系审计

| 文档 | 描述的是真实系统？ | 处置 | 依据 |
| --- | --- | --- | --- |
| README(.zh-CN) | ✅ 忠实提取原则、边界、路径表均与代码一致 | KEEP | 核心原则段与 parity manifest 互证 |
| docs/concepts/architecture.md | ⚠ 有 DRIFT：§3 称 server 路由经 `useClarityServerConfig()` 读配置，实际代码已恢复直接 `import blogConfig from '~~/blog.config'`；未记载 generated 模块的别名实际生效范围 | REWRITE | `src/server/routes/atom.xml.get.ts:7` 实测 |
| docs/maintainers/upstream-sync.md | ✅ 分类优先级、pathMap 与 manifest 一致 | KEEP | — |
| docs/maintainers/project-status.md | ✅ 自我认知准确（明示 compatibility 矩阵不含视觉质量） | KEEP | — |
| docs/maintainers/testing.md / patches.md / development.md | 基本准确 | KEEP（随 architecture 修复同步小改） | — |
| docs/guides/**、getting-started/** | ✅ 与当前 API 大体一致 | KEEP | quick start 四文件实测可用（模板占位符除外） |
| docs/reference/compatibility.md | 生成物 | KEEP | 由契约再生成 |
| docs/history/**（9 组中英） | 历史记录 | ARCHIVE（维持现状，不再增补） | 设计如此 |
| docs/mdc/**（100+ 文件） | 内容创作素材，非主题系统文档；与 skills/article-beautifier 大量重复 | **FREEZE**（移出 docs/ 主树或标注非规范） | 属于内容运营资产，混入规范文档树是"文档迷失感"的主要来源 |
| skills/article-beautifier | 终端用户写作辅助 | FREEZE（非核心，不阻塞任何重建阶段） | — |
| skills/migrate-blog-v3-to-clarity | 迁移工作流 | KEEP + REWRITE（`useRandomPermalink` 等旧键已从 schema 移除，skill 引用需同步） | 本审计实测旧配置致命失败 |
| CHANGELOG | ✅ | KEEP | — |

**文档体系总评**：没有发现"文档描述不存在的系统"的严重失真；主要病灶是 (a) architecture.md 一处实质 drift，(b) mdc 文档语料库与规范文档混栽导致体量失控（docs/ 下 100+ 文件中过半是 MDC 素材），(c) 未把"0.1.0 重写式架构已废弃"写成显式讣告，新旧两代 API（clarity 嵌套键 vs 扁平键）共存无导航。

---

## 8. Proposed Minimal Architecture（clarity-theme vNext 最小面）

如果今天从零开始、只带着"把 blog-v3 做成 Layer"这一句话，最小必要集是：

```text
blog-v3 ──(sync 工具 + parity manifest)──▶ clarity-theme Layer
                                              │
              ┌───────────────────────────────┤
              │ src/（同步面：字节级 parity）    │
              │ nuxt.config.ts（含完整 head.link！）│
              │ modules/clarity-source-layout  │ ← 可保留（无官方 API 替代）
              │ modules/clarity-config（瘦身版）│ ← 唯一允许复杂的文件
              └───────────────────────────────┘
                        │ extends
                        ▼
              最小 consumer（4 文件 + content/）
```

| 分类 | 内容 |
| --- | --- |
| **必须存在** | src/ 同步面 + parity manifest/gate；nuxt.config.ts（修齐 head.link 后作为受控转换面）；clarity-source-layout；clarity-config（保留：clarity.config 发现/校验、扁平 appConfig 注入、~~/blog.config·~/feeds 别名）；一个 playground；一个真实 consumer 打包测试；sync 工具 |
| **可以瘦身** | clarity-config 内生成模块机器：`~~/package.json` / `~~/pnpm-workspace.yaml` 可改为 consumer 必须自有 version 字段的显式契约 + 或 `define` 注入，砍掉三上下文别名/内联 hack；`useClarityConfig` 兼容层设 sunset 期限 |
| **可以后置** | registry-consumer、migration skill 的深度维护、creator 的继续功能化 |
| **没有必要存在于主树** | docs/mdc/** 语料库（拆去独立仓或 skills 目录深处）、article-beautifier 的 30+ 参考文件随 skill 冻结 |

---

## 9. Reconstruction Plan（修复路线，配合 DECISION: REPAIR）

**Phase 0 —— 冻结与防回归（0.5 天）**
- 目标：锁定当前 fidelity 状态，不再失血。
- 允许：CI 加 Windows matrix（暴露 tar bug 与本地复现的静默失败）；文档标注 0.1.0 API 为 deprecated。
- 禁止：任何 src/ 同步面改动；新功能。
- 验收：CI 在 linux+windows 双平台跑通或明确红。

**Phase 1 —— 边界缺陷修复（2–3 天）**
- 目标：消灭本次审计的四个实证缺陷。
- 允许改：`nuxt.config.ts`（补 DOUYIN 字体 link，并将 head 段与 upstream 建立对照清单）；`clarity-config`（package.json 契约化处理 version 字段缺失——生成模块 alias 在 client 不生效是既成事实，改为显式校验+清晰报错或彻底移除 client 侧依赖）；schema 对 0.1.x 旧键宽容（passthrough+warn 而非 fatal）。
- 禁止：改 src/ 同步面任何文件；改测试期望来适配实现。
- 验收：无 version 字段的最小 consumer 构建/生成全绿；/link 与 upstream 截图 computed-style 中 DOUYIN 字体 loaded。

**Phase 2 —— 生产管线攻坚（3–5 天，含未定位项）**
- 目标：file: 安装形态的 generate 恢复完整预渲染。
- 允许：prerender:config 内联 hack 重构、生成模块落点迁移（离开 node_modules，改 buildDir 或 consumer 可写位置）、必要时给 nitro 提最小复现。
- 禁止：绕过问题把 playground 当唯一发布依据。
- 验收：官方模板 consumer 在 Win+Linux generate 出全页面；现有 test:consumer 修好 tar 路径后在两平台运行。

**Phase 3 —— Parity 门禁升层（2 天）**
- 目标：把"事故层"纳入门禁。
- 允许：新建双 consumer 对照 harness（本次 parity-lab 的 shot/styles/pixdiff 三件套产品化）、CI 内跑 / /link /archive /文章 四页 computed-style diff。
- 禁止：像素全等断言（数据随机性会淹死 CI）。
- 验收：字体/样式表/字体栈三类回归会红。

**Phase 4 —— 语料与外围治理（1 天）**
- docs/mdc 迁出、skills 冻结标注、architecture.md 重写（含 generated 模块语义）、migration skill 对齐新 schema。

---

## 10. 审计过程中对工作区的修改声明

本次审计严格遵守"不修改主题核心源码"。实际改动全部位于审计自建的对照环境，可完整还原：

- `parity-lab/`（新建）：clarity-consumer（theme-based 骨架 + 本地 file: 主题）、minimal-consumer（官方模板）、双静态服务器、CDP 截图/样式/像素 diff 工具、全部构建日志与截图。
- `upstream-reference/`（既有 consumer，原本就有未提交修改）：追加 `content/link.md`（换为 upstream 真实版）、`app/feeds.ts`（统一测试数据集）、`public/favicon.svg` + `blog.config.ts` favicon 指向本地（修预渲染外链 500）、package.json 无涉。
- `clarity-theme/`：仅新增本报告与 decision 文档；`.git` 未动；src/ 未动。
- `blog-v3-upstream/`：只读，未动。

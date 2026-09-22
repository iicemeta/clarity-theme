# Clarity Theme 只读工程审计

> 审计日期：2026-09-21（Asia/Taipei）
> 审计仓库：`D:\NewPartition\DEV\ClarityTheme\clarity-theme`
> 审计方式：只读检查 + 全量命令执行，未修改任何代码（本文件为唯一新增交付物）

---

## A. 当前状态

### A.1 工作区布局

`D:\NewPartition\DEV\ClarityTheme` 为容器目录（仅占位 `package.json`），包含三个子项目：

| 目录 | 性质 | 状态 |
| --- | --- | --- |
| `clarity-theme/` | Theme 仓库（本审计对象） | git 仓库，master |
| `blog-v3-upstream/` | 上游源仓库本地镜像 | git 仓库，main |
| `theme-based-blog-v3/` | 差异测试 Consumer（原版站点数据 + Theme） | **非 git 仓库**，依赖本地 tarball |

### A.2 Git 基线

| 项目 | 分支 | Commit | 说明 |
| --- | --- | --- | --- |
| clarity-theme | `master` | `8440bc8b1880eaa8fdf6aa820ea7799c9cf54cf2`（2026-09-21 22:05:49 +0800，"docs: freeze config contract, fix package metadata"） | 工作树干净，与 `origin/master` 同步 |
| blog-v3-upstream | `main` | `f6ea97d745517feb52f0c100e89acb36f0adc12f`（2026-09-06 23:01:32 +0800） | 与 `sync-manifest.json` 基线**完全一致**；`sync:check` 确认远程无新提交 |
| theme-based-blog-v3 | —（无 .git） | — | 依赖 `file:./clarity-theme-0.1.0-4.tgz`，目录内残留 `-2/-3/-4` 三份 tarball |

上游基线（`sync-manifest.json`）：`L33Z22L11/blog-v3` main @ `f6ea97d`，版本 3.7.2 / Nuxt 4.5.2，同步时间 2026-09-21T16:40:00+08:00。

### A.3 命令执行矩阵

| 命令 | 结果 | 备注 |
| --- | --- | --- |
| `pnpm install` | ✅ 通过 | "Already up to date"（workspace 2 项目，7ms） |
| `pnpm dev` | ✅ 可启动 | localhost:3000 HTTP 200，标题 "Clarity Playground" 与 generator meta 均正确；有 Badge 同名警告、optimizeDeps 解析警告 |
| `pnpm generate` | ✅ 通过 | 37 路由预渲染成功；Badge 警告、esm.sh external 警告、link checker 1 warning（绝对 URL，预期行为） |
| `pnpm lint` | ❌ **失败（仅 Windows 本地）** | 7 个 `@stylistic/linebreaks` 错误：`app/assets/css/reusable.scss` 6 处 + `app/components/content/Alert.vue` 1 处。HEAD blob 中为纯 LF，工作树被 `core.autocrlf=true` 转为 CRLF；CI（Linux）不受影响 |
| `pnpm typecheck` | ✅ 通过 | playground `nuxt typecheck` 全绿；Badge 同名警告（NUXT_B3011） |
| `pnpm verify` | ✅ 通过 | 提纯验证：无作者信息泄漏、无站点文件、无跨项目路径引用 |
| `pnpm test:consumer` | ✅ 通过 | pack → 独立目录安装 tarball → `nuxt generate` → 6 项断言全部通过；安装时报 peer 依赖警告 |
| `pnpm sync:check` | ✅ 通过 | 上游已是最新 `f6ea97d` |
| `pnpm sync:diff` | ✅ 通过 | 无差异（上游无新提交，diff 无输出） |
| `pnpm peers check` | ❌ 有问题 | `unctx@3.0.1` 需要 `oxc-parser >=0.140.0`（装 0.139.0）与 `unplugin ^3.3.0`（装 2.3.11） |

结论：**核心链路（dev / generate / typecheck / verify / consumer / sync）在 Node 22 + pnpm 12.4.1 + Windows 环境全部可用**；唯一红灯是 Windows 本地 lint（环境性行尾问题，非代码缺陷）与 transitive peer 依赖警告。

---

## B. 已完成能力

按 `git log`（039 → 8440bc8 共 20+ 提交）与实测验证：

1. **Layer 化架构**：单入口 `extends: ['clarity-theme']`；`nuxt.config.ts` 内全部资源路径经 `toThemePath()` 绝对化（css / components / modules / icons / scss variables），兼容 npm 包 / git 包 / 本地目录安装；remark 插件用 `pathToFileURL` 加载 `.mjs`。
2. **依赖注入层**：`modules/clarity-config` 通过 alias `#clarity/config`、`#clarity/feeds` 注入消费项目文件，Theme 内部不感知 consumer 文件布局；未提供 `feeds.ts` 时回退空数据并警告。
3. **站点配置契约（已冻结）**：`clarity.config.ts` + `defineClarityConfig`（zod 校验、prefault 默认值）；`docs/configuration.md` 逐字段记录 Required/Default/Client-visible。
4. **Content Schema 工厂**：`createClarityContentConfig`，`.ts` 类型真源 + `.mjs` 运行时双轨（规避 Node 原生 TS 剥离不允许 node_modules 内 TS 的限制）。
5. **配置桥接**：SEO/site/robots/llms 注入、head 元数据、routeRules（atom/opml/stats 预渲染）、runtimeConfig 构建信息、appConfig 站点派生默认值、`~/shiki.config` fallback、pinia stores 目录显式注册。
6. **提纯验证**（`scripts/verify-theme.mjs`）：上游作者域名/账号/统计 ID/头像/评论服务/备案号黑名单 + 站点内容文件 + `~~/blog.config` 等跨项目路径引用检查；实测通过。本次额外 `git grep` 复核：allowlist 之外零命中。
7. **上游同步工具**（`scripts/sync-upstream.mjs`）：check / diff / apply（基线快进 + 冲突检测）/ verify 四模式；GitHub Actions 每周一检查并自动开 Issue。
8. **Real Consumer 测试**（`scripts/test-consumer.mjs`）：`pnpm pack` → 临时目录独立安装 → generate → 6 项输出断言（标题注入 / inline code / 文章路由 / atom 站点与标题 / emojiTail 覆盖）。
9. **Playground 兼容性基准**：markdown / code / mdc / math / mermaid / music / image 七个基准页 + 显式 prerender。
10. **Consumer 覆盖验证**：`playground/app/components/content/Badge.vue` 同路径组件覆盖 + `app.config.ts` 局部覆盖（有实测断言的是后者）。
11. **Patch 审计**（`docs/PATCHES.md`）：4 个上游 patch 逐个判定为 consumer 持有，mdc patch 已精简。
12. **CI**：Node 22/24 矩阵（lint + verify + typecheck）+ Node 24（playground generate + real consumer）。
13. **元数据修复**：package.json homepage/repository/bugs 已指向 `iicemeta/clarity-theme`；LICENSE 按 MIT 衍生作品规范保留上游 `Copyright (c) 2024 Zhilu`（合规正确，非泄漏）。

---

## C. 高风险问题

### C-1 `clarity-theme/img` 类型入口指向不存在的文件（exports 契约破坏）

- 证据：`img/index.d.mts` 内容为 `export * from './img.ts'`，但 `img/img.ts` **在仓库中不存在**（`img/` 仅有 `index.d.mts` 与 `index.mjs`）。注释自述"类型真源在同目录 img.ts"，实际类型真源是 `app/utils/img.ts`。
- 影响：`import { getFavicon } from 'clarity-theme/img'` 在 TypeScript 中类型解析失败（模块声明缺失/指向不存在文件）。运行时 `.mjs` 正常，故 generate 不炸；但这是 commit `a6dcf50` 对外承诺的公共 API，且 README 第 100/177 行明确宣传该导出。
- 未被测试暴露的原因：playground 与 test:consumer 均未实际导入 `clarity-theme/img`；typecheck 只覆盖 playground 内部代码。

### C-2 CDN 资源硬编码中国镜像域名，无任何配置开关（站点区域偏好残留）

- 证据：`nuxt.config.ts`（约 32–40 行）硬编码：
  - `https://s4.zstatic.net/npm/katex@0.16.44/...`、`inter-ui@4.1.1`（npmmirror 第三方镜像）
  - `https://fonts.googleapis.cn`、`https://fonts.gstatic.cn`（Google Fonts 中国域名）
- 影响：这是从上游（面向中国大陆用户的个人博客）直接继承的区域特定基础设施决策，被固化进 Theme 分发给所有消费者：海外/无墙环境加载慢或不稳定、企业内网无法更换、CDN 域名变更时消费者无法自救。KaTeX CSS 与全部字体栈（Inter、JetBrains Mono、Noto Serif SC）均受影响。
- 属于"Theme 内残留的站点特定逻辑"中最典型的一处，且 `clarity.config.ts` 契约中**没有**任何 CDN/字体配置面。

---

## D. 中风险问题

### D-1 `./config` 导出无 `.mjs` 运行时入口，与兄弟导出不一致

- `package.json` exports：`./content`、`./schema`、`./img` 均为 `types → .d.mts` + `default → .mjs` 双轨；唯独 `./config` 直接指向 `./config/index.ts`（TS 源文件）。
- 当前能工作仅因 `clarity.config.ts` 由 Nuxt/jiti 加载；消费者若在纯 Node 脚本（CI 配置校验、feeds 生成脚本等）`import 'clarity-theme/config'` 将失败。npm tarball 内分发 `.ts` 源码作为运行时入口是脆弱设计。

### D-2 Consumer patch 依赖未消化，自动化测试与真实站点行为存在系统性差异

- `docs/PATCHES.md` 判定 4 个 patch 必须由 consumer 持有：
  1. `@nuxt/image`：`parseInt→parseFloat`，否则 `densities: [1, 1.5, 2]` 中 1.5x **静默失效**（Theme nuxt.config 已声明该配置）
  2. `ipx`：ICO 透传，否则 favicon.ico 经 IPX 报错
  3. `plain-shiki`：`::highlight()` 选择器空格，否则**代码高亮颜色失效**
  4. `@nuxtjs/mdc`：去 detab，否则代码块 tab 被转空格
- playground 与 test:consumer 均**无 patch** 运行——即所有自动化测试验证的是"降级行为"；真实站点（theme-based-blog-v3，有 patch）才是完整行为。二者差异没有任何机制保证一致。
- README 的"差异测试 242 路由 0 错误"结论来自一次性人工运行，不可复现。

### D-3 差异测试 Consumer 工程失控：非 git 仓库 + 陈旧本地 tarball 依赖

- `theme-based-blog-v3/` 无 `.git`，无版本控制；
- `package.json` 依赖 `file:./clarity-theme-0.1.0-4.tgz`（第 4 次手工 pack 的产物），目录内残留 `-2/-3/-4` 三份 tarball；与 `clarity-theme` master（持续演进）**脱钩**，每次验证 Theme 新改动需手工重新 pack 并改 package.json；
- 不在任何 CI 中；上游作者全部站点数据（zhilu 域名、头像、邮箱）仅存在于该目录（属测试数据，可接受，但无 git 历史可追溯）。

### D-4 Badge.vue 组件覆盖机制产生框架级警告（NUXT_B3011）

- `playground/app/components/content/Badge.vue` 与 Theme `app/components/content/Badge.vue` 同名，dev / typecheck / generate 三个命令均报 "Two component files resolving to the same name Badge"。
- 覆盖功能本身生效（Layer 组件可被 consumer 同路径覆盖），但：(a) 警告噪声会掩盖未来真正的同名冲突；(b) 该覆盖能力**无输出断言**（generate 的页面未验证 `data-consumer-override` 标记），仅靠"没报错"背书。

### D-5 anti-mirror 默认黑名单携带上游作者个人镜像站列表

- `modules/clarity-config/index.ts`（约 24–31 行）`defaultMirrorBlacklist` 硬编码 5 个域名（dgjlx.com、dgvhqt.com、hcmsla.com、wmlop.com、yswjxs.com）——这些是**上游作者站点**遇到的镜像站，与 Theme 其他消费者无关。
- 虽默认关闭（`features.antiMirror` default false），但一旦消费者开启，会继承这 5 个无关域名跳转逻辑。属上游站点特定数据的残留。

### D-6 Transitive peer 依赖不满足（含真实 consumer 环境）

- `pnpm peers check`：`unctx@3.0.1` 要求 `oxc-parser >=0.140.0`（装 0.139.0）与 `unplugin ^3.3.0`（装 2.3.11）。
- test:consumer 的独立安装同样输出 "Issues with peer dependencies found"——问题随 Theme 依赖树传递给所有消费者；当前能构建，但属于上游版本漂移的定时炸弹。

### D-7 大量用户可见能力零自动化覆盖

详见附录"未覆盖能力清单"。核心风险：搜索（minisearch 客户端全文检索）、Twikoo 评论、anti-mirror 注入、归档页交互、分页/排序、widget 注册表、sitemap/llms 输出、`enableStyle:false`/`useRandomPermalink:true`/`hidePostPrefix:false` 等配置分支均无断言；compatibility 基准页仅验证"预渲染不炸"，不做内容级断言。

---

## E. 低风险问题

| # | 问题 | 证据 | 影响 |
| --- | --- | --- | --- |
| E-1 | Windows 贡献者本地 `pnpm lint` 必挂 | `.gitattributes` 仅 `* text=auto`（无 `eol=lf`）；本机 `core.autocrlf=true` 导致 `reusable.scss`/`Alert.vue` 检出为 CRLF，stylelint 要求 LF。HEAD blob 已是 LF，CI/Linux 正常 | 仅本地环境噪声；加 `* text=auto eol=lf` 可根治 |
| E-2 | dev 模式 optimizeDeps 解析警告 | `@vue/devtools-core`、`@vue/devtools-kit` 在 `vite.optimizeDeps.include` 中但 devDependencies 未安装（仅 Nuxt DevTools 可选依赖场景） | 警告噪声；dev 功能未受影响 |
| E-3 | shiki 构建期 esm.sh 远程导入 | `useShiki` 引入 `https://esm.sh/shiki/{wasm,langs,engine-oniguruma.mjs}` 被标为 external | 离线/受限网络构建部署有风险（来自上游设计） |
| E-4 | link checker 每次构建 1 条 warning | 友链页渲染本站绝对 URL（`absolute-site-urls`），属预期行为 | 可在 linkChecker 配置跳过该规则消除噪声 |
| E-5 | sync 脚本 matchGlob 为简化实现 | 不支持 `!`、`{}` 等模式；当前 manifest 模式简单，够用 | 上游 manifest 复杂化时需重写 |
| E-6 | 差异站点内 3 份 tarball 副本堆积 | `clarity-theme-0.1.0-{2,3,4}.tgz` | 磁盘混乱 + 易误用旧版本 |
| E-7 | Konami 彩蛋、QQ 头像/OICQ 等工具无开关 | `app/plugins/easter-egg.ts`、`app/utils/img.ts`（q1.qlogo.cn 等） | 上游个人功能泛化保留；可在 UI 配置面暴露开关 |
| E-8 | `img/index.mjs` 的 `getGithubAvatar` 等依赖第三方公共服务（webp.se）无降级 | `img/index.mjs`、`app/utils/img.ts` | 服务停用影响 Badge/Favicon 展示（上游继承） |

---

## F. 建议后续并行任务

按优先级排序；T1–T4 可立即并行（文件集互不相交），T5–T10 第二批。

| 任务 | 内容 | 优先级 | 验收标准 |
| --- | --- | --- | --- |
| **T1 修复 img 类型入口** | `img/index.d.mts` 改指向真实类型真源 `../app/utils/img`（或补建 `img/img.ts` 并让 `app/utils/img.ts` re-export），并在 test:consumer 中新增 feeds.ts 使用 `getFavicon` 的断言 | P0 | tsc 可解析 `clarity-theme/img`；consumer 断言覆盖该导出 |
| **T2 CDN/字体配置化** | `clarity.config.ts` 新增 `site.cdn`（或 `features.assets`）配置面：`katex`/`fonts` 提供开关与自定义 URL 列表；默认保留当前镜像但可覆盖；schema(.ts/.mjs) + 模块注入实现 | P0 | 海外消费者可切换官方 CDN / 自托管；文档更新 |
| **T3 `./config` 运行时入口双轨化** | 新增 `config/index.mjs`（re-export define/feed 类型剥离版），exports 改为 types+default 双轨，与 `./content` 对齐 | P1 | 纯 Node `import 'clarity-theme/config'` 可用 |
| **T4 Windows lint 根治** | `.gitattributes` 加 `* text=auto eol=lf`；本地重新规范化检出 | P1 | Windows/Linux lint 双通过 |
| **T5 Badge 覆盖断言 + 去警告** | playground Badge 覆盖加输出断言（generate 后检查 `data-consumer-override`）；评估用 components.dirs 配置消除 NUXT_B3011 | P2 | generate 输出含覆盖标记且无 B3011 |
| **T6 差异站点工程化** | theme-based-blog-v3 git 化、改用 pnpm workspace / `link:` 依赖（替换 tarball）、清理 3 份 tgz、可选接入 CI 定期 generate | P2 | master 改动可一键在差异站点验证 |
| **T7 consumer 测试扩展** | test:consumer 增加分支矩阵：`enableStyle:false`、`useRandomPermalink:true`、`hidePostPrefix:false`、`antiMirror` 注入、sitemap.xml / llms.txt 断言 | P2 | 每个配置分支至少一条输出断言 |
| **T8 peer 依赖治理** | 升级或 `pnpm.overrides` 对齐 `unctx` 的 `oxc-parser`/`unplugin` peer 要求；CI 增加 `pnpm peers check` | P2 | peers check 零输出 |
| **T9 anti-mirror 黑名单移出默认** | `defaultMirrorBlacklist` 改为空数组，上游 5 域名移入 `docs/PATCHES.md`/README 作为可选示例；或增加配置开关 | P3 | 新消费者开启 antiMirror 不继承无关域名 |
| **T10 兼容性基准扩展** | playground 新增 search / theme-toggle / toc / widget / archive 交互基准页，逐步从"预渲染不炸"升级为内容级断言 | P3 | 未覆盖清单（附录）中 UI 能力进入基准页 |

---

## G. 每个任务应修改的文件

| 任务 | 文件（新增 ✚ / 修改 ✎） |
| --- | --- |
| T1 | ✎ `img/index.d.mts`；✎ `scripts/test-consumer.mjs`（consumer feeds.ts 用例）；可选 ✎ `README.md` |
| T2 | ✎ `config/schema.ts`、✎ `config/schema.mjs`、✎ `modules/clarity-config/index.ts`、✎ `nuxt.config.ts`（CDN link 改由模块注入）、✎ `config/public.ts`、✎ `docs/configuration.md` |
| T3 | ✚ `config/index.mjs`；✎ `package.json`（exports）；✎ `config/content.d.mts`/`schema.d.mts` 链路复核 |
| T4 | ✎ `.gitattributes`；（工作树行尾重新规范化，不改内容语义） |
| T5 | ✎ `playground/app/components/content/Badge.vue` 或 ✎ `playground/nuxt.config.ts`；✎ `scripts/test-consumer.mjs` 或 playground generate 断言脚本 |
| T6 | （theme-based-blog-v3 目录）✚ `.git`、✎ `package.json`、✎ `pnpm-workspace.yaml`；✚/✎ 容器根 `pnpm-workspace.yaml`（纳入 workspace）；✎ `docs/PATCHES.md`、✎ `README.md` |
| T7 | ✎ `scripts/test-consumer.mjs`；✎ `playground/content/**`（如需基准内容） |
| T8 | ✎ `package.json`（pnpm.overrides）或 ✎ `pnpm-workspace.yaml`；✎ `.github/workflows/ci.yml` |
| T9 | ✎ `modules/clarity-config/index.ts`；✎ `README.md`、✎ `docs/configuration.md` |
| T10 | ✚ `playground/content/compatibility/{search,widgets}.md` 等；✎ `playground/nuxt.config.ts`（prerender routes）；✎ 断言脚本 |

---

## H. 任务间文件冲突分析

### 冲突组（需串行或合并为同一 Agent）

| 冲突文件 | 涉及任务 | 建议 |
| --- | --- | --- |
| `modules/clarity-config/index.ts` | **T2 × T9** | 合并给同一 Agent，或 T2 先行、T9 后做 rebase |
| `config/schema.ts` / `config/schema.mjs` / `config/public.ts` / `docs/configuration.md` | **T2 × T9**（blacklist 若也配置化则冲突扩大） | 同上 |
| `package.json` | **T3 × T8**（exports vs pnpm.overrides） | 同一 Agent 顺序完成，或分 hunk 提交 |
| `scripts/test-consumer.mjs` | **T1 × T5 × T7**（都要加断言） | 合并为单个"测试扩展"任务，或严格划分断言区块 |
| `playground/nuxt.config.ts` | **T5 × T10**（components 配置 vs prerender routes） | 分开 hunk 或串行 |
| `README.md` | **T1 × T6 × T9** | 文档统一收尾时合并 |
| 容器根 workspace 配置 | **T6 独占**，但会改变根 `pnpm install` 行为，影响所有在容器根执行的命令 | 需要单独协调窗口 |

### 可安全并行的组合

- **第一批（零交集）**：T1（img/ + test 脚本局部）、T2（schema + 模块 + nuxt.config）、T3（config/index.mjs + package.json exports）、T4（.gitattributes）——四组文件互不重叠。
- **第二批**：T5、T6、T7、T8 按上表规避；T9 必须等 T2 合并后启动。

---

## 附录：未被自动化测试覆盖的能力清单

| 能力 | 现状 | 缺口 |
| --- | --- | --- |
| 客户端搜索（Search.vue + minisearch + stores/search） | 无任何测试 | 输入、结果渲染、键盘导航零断言 |
| 深浅色主题切换（ThemeToggle + color-mode） | 无测试 | 无切换/持久化断言 |
| Twikoo 评论（Comment.vue） | 仅差异站点人工验证 | envId 配置分支、禁用分支无断言 |
| anti-mirror 脚本注入 | verify 只查泄漏不查行为 | 开启后 head 中脚本存在性/编码正确性无断言 |
| 归档页（archive.vue 年度分组、间距/列数滑杆、birthYear 年龄） | generate 成功但不查内容 | 交互与统计断言缺失 |
| 预览页 / ZSecret 隐藏入口（previews/%） | 无 preview 文章 fixture | 整条 preview 链路未验证 |
| 分页 / 排序切换（Pagination、OrderToggle、URL query 绑定） | 无测试 | query 状态与列表切片断言缺失 |
| Widget 注册表（useWidgets、BlogLog/BlogStats/BlogTech、meta.aside） | 无测试 | aside 插槽组合未验证 |
| TOC（useToc、Toc.vue） | 无测试 | 标题深度 4 配置无断言 |
| Mermaid / MusicScore（abcjs） | compatibility 页仅预渲染 | SVG/音频渲染产物无内容断言 |
| Shiki 代码高亮（useShiki、ProsePre、缩进导航、折叠） | 仅"不炸" | 高亮 class/颜色/折叠行为无断言（且依赖 plain-shiki patch，见 D-2） |
| atom.xml enableStyle=false 分支 | 未测 | XSLT 开关分支无断言 |
| useRandomPermalink=true | 未测（playground/差异站点均 false） | permalink 路由生成零覆盖 |
| hidePostPrefix=false | 未测 | /posts 前缀分支零覆盖 |
| sitemap.xml / robots.txt / llms.txt 内容 | generate 成功但无断言 | 条目数、lastmod、disallow 规则未验证 |
| 图片处理（@nuxt/image densities、IPX、favicon.ico 重定向） | 无断言 | 与 patch 强耦合（见 D-2） |
| 移动端布局 / Mask / Sidebar 抽屉 | 无测试 | 响应式行为零覆盖 |
| error.vue / 404 状态码 | [...slug] 设置 404 但无断言 | 状态码与错误页渲染未验证 |

---

## 结论

Clarity Theme 的 Layer 化主体工程**已经完成并可信**：核心命令全绿、npm tarball 真实消费链路通过、提纯验证与上游同步机制齐备、配置契约已冻结。当前主要债务集中在四类：**对外 API 的边角缺陷（C-1、D-1）**、**上游区域/个人偏好的固化（C-2、D-5）**、**patch 与差异测试环境的工程失控（D-2、D-3）**、以及**大面积零测试覆盖的 UI 能力（D-7/附录）**。建议按 F 节顺序以第一批四任务并行开局。

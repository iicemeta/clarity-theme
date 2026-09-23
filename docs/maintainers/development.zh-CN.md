# 开发

[English](./development.md) | **简体中文**

如何在 Clarity Theme 仓库本身上工作。命令事实来源：`package.json` scripts、`pnpm-workspace.yaml` 与 `.github/workflows/**`。

## 仓库结构

```text
clarity-theme/
├─ src/                  # Theme 运行时源码（Layer srcDir；npm 发布的全部内容）
│  ├─ assets/ components/ composables/ layouts/ middleware/
│  ├─ pages/ plugins/ stores/ types/ utils/
│  ├─ app.config.ts app.vue error.vue shiki.config.ts
│  ├─ config/            # config API 源码（npm ./config ./content ./schema）
│  ├─ img/               # img API 源码（npm ./img）
│  ├─ modules/           # clarity-source-layout 与 clarity-config 模块
│  ├─ public/ server/ shared/ remark-plugins/
├─ create-clarity-theme/ # 独立的 npm 创建包（独立版本与 changelog）
├─ skills/               # Agent 工作流 Skill（不属于 npm 包）
├─ docs/                 # 双语文档（见文档规则）
├─ playground/           # workspace 链接的开发用 consumer
├─ scripts/ tests/       # 验证与工具
├─ .github/workflows/    # CI、发布与上游同步工作流
└─ nuxt.config.ts, package.json, sync-manifest.json, …
```

`nuxt.config.ts` 保持在包根目录。它的第一个模块 `src/modules/clarity-source-layout` 只把 `src/` 目录元数据应用到 Clarity layer；不使用静态 `srcDir`/`serverDir`/`dir.*` 值，因为 c12 会把它们合并进消费方根配置。npm、Git commit 与本地目录安装因此解析到相同布局，又不会覆盖消费方自己的应用目录。

npm 包、Agent Skill 与文档是三个独立关注点：

- **`clarity-theme`（npm 包）** —— 以 `extends: ['clarity-theme']` 安装的运行时 Nuxt Layer。`files` 字段只发布 `src/` 与根入口文件；开发资产永远不会进入 tarball。
- **`skills/migrate-blog-v3-to-clarity`** —— 迁移现有 blog-v3 项目的规范 Agent 工作流。随仓库版本化，但有意**不**打包进 npm 包。
- **`docs/`** —— 英中双语文档。

## 环境准备

```bash
pnpm install   # Theme + playground + creator workspace
```

Node 必须满足 `engines.node`；pnpm 版本读取自 `packageManager`。pnpm workspace 只服务于本仓库开发（playground 与创建包测试）——消费方不需要 workspace。

## 日常命令

| 命令 | 用途 |
| --- | --- |
| `pnpm dev` | Playground dev server |
| `pnpm build` / `pnpm generate` | Playground 构建 / 静态生成 |
| `pnpm lint` / `pnpm lint:fix` | ESLint + Stylelint（包含 Markdown） |
| `pnpm typecheck` | Playground `nuxt typecheck` |
| `pnpm docs:check` | 文档治理检查（见下文） |

## 验证命令

完整矩阵与各层适用时机见[测试](./testing.zh-CN.md)。

```bash
pnpm verify                 # Theme 纯度/静态泄漏检查
pnpm peers check            # peer 依赖审计
pnpm test:sync              # 上游同步工具回归
pnpm test:migration         # 迁移 Skill + fixture 回归
pnpm test:contract          # 兼容性契约 + 生成文档同步
pnpm test:consumer          # 真实打包 tarball 消费者
pnpm test:compatibility     # SSR + 真实浏览器 + dev 水合
pnpm test:create            # 创建器 CLI 测试
pnpm test:create:e2e        # 生成的消费者 E2E
pnpm test:create:tarball    # 打包创建器 tarball E2E
pnpm test:registry-consumer # 发布后 registry 消费者（已发布版本）
pnpm release:check          # 发布门禁（见发布）
pnpm pack --dry-run         # 不写盘检查 npm tarball
```

## 上游同步

Theme 在 `sync-manifest.json` 中记录已审查的上游基线，且从不自动合并：

```bash
pnpm sync:check   # 比较 manifest 基线与远端
pnpm sync:diff    # 分类上游变更
pnpm sync:apply   # 事务性应用已审查的 include-only 变更
pnpm sync:verify  # 重跑 Theme 纯度与基线检查
```

细节、冲突语义与每周只读漂移工作流见[上游同步](./upstream-sync.zh-CN.md)。

## 文档变更

文档位于 `docs/`，按受众组织并要求双语配对；发布版本只记录在 `CHANGELOG.md`。提交文档变更前运行 `pnpm docs:check`；规则本身见[文档规则](./documentation.zh-CN.md)。

## CI

CI 从包元数据推导 Node 与 pnpm 版本。它先在固定的 Node 矩阵上运行 lint/typecheck/verify/sync/migration/contract/peers，再在主 Node 版本上运行 playground generate、真实消费者验收与渲染兼容性。另有每周工作流只检测并报告上游漂移。确切的 job 接线见 `.github/workflows/ci.yml` 与 `.github/workflows/sync.yml`。

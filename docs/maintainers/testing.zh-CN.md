# 测试

[English](./testing.md) | **简体中文**

验证套件分层且严格串行——每一层都假定上一层已通过。命令事实来源：`package.json` scripts、`scripts/**`、`tests/**` 与 `.github/workflows/ci.yml`。逐功能生成的矩阵见[兼容性说明](../reference/compatibility.zh-CN.md)。

## 第一层 —— 静态与契约检查（Node 矩阵）

| 命令 | 覆盖 |
| --- | --- |
| `pnpm lint` | ESLint（源码、脚本、测试、文档）+ Stylelint（Vue/SCSS） |
| `pnpm typecheck` | Playground 在 workspace 链接 Layer 上的 `nuxt typecheck` |
| `pnpm verify` | Theme 纯度：无上游作者/站点信息泄漏、无站点文件、无跨项目导入 |
| `pnpm test:sync` | 上游同步工具回归（manifest 分类、冲突、回滚） |
| `pnpm test:migration` | 迁移 Skill 结构、fixture 映射与受保护资产契约 |
| `pnpm test:contract` | 兼容性契约完整性 + 生成文档同步（无构建） |
| `pnpm peers check` | peer 依赖审计 |
| `pnpm docs:check` | 文档治理（版本污染、配对、链接、changelog 顺序） |

## 第二层 —— playground 生成（主 Node 版本）

| 命令 | 覆盖 |
| --- | --- |
| `pnpm generate` | workspace 链接 Layer 的 playground 静态生成 |

## 第三层 —— 真实消费者与渲染（主 Node 版本）

| 命令 | 覆盖 |
| --- | --- |
| `pnpm test:consumer` | `pnpm pack` → 独立安装 → 五个导出冒烟 → typecheck → 三组配置分支生成与输出断言 |
| `pnpm test:compatibility` | playground 生产构建 SSR + 真实浏览器（CDP）+ dev 水合，由 `scripts/compatibility-cases.mjs` 驱动 |
| `pnpm test:create` | 创建器 CLI 行为测试 |
| `pnpm test:create:e2e` | 生成的消费者安装/typecheck/生成 E2E |
| `pnpm test:create:tarball` | 打包创建器二进制 E2E |

## 仅发布时执行

| 命令 | 覆盖 |
| --- | --- |
| `pnpm release:check` | tag/版本契约、changelog 条目、exports/files/engines/peers、pack 成功、tarball 边界 |
| `pnpm test:registry-consumer` | 把**已发布的 registry 版本**（非本地 tarball）安装进临时消费者并运行导出/typecheck/生成断言 |

消费者层共同构成：workspace → tarball → registry。

## 何时运行什么

- **任何源码变更：** `pnpm lint`、`pnpm typecheck`，然后运行该领域的针对性套件（config/content 用 contract，打包/导出用 consumer，渲染用 compatibility）。
- **纯文档变更：** `pnpm docs:check` + `pnpm lint`。
- **打 release tag 之前：** [发布](./publishing.zh-CN.md)中的完整有序套件；发布工作流会在确切 tag 上重跑。
- **发布之后：** 对已发布版本运行 `pnpm test:registry-consumer`。

## 约定

- 串行运行命令；不要在同一工作树上并发启动 dev/build/test 进程。
- 用 `node scripts/test-compatibility.mjs --filter=<id>` 调试单条兼容性用例。
- `--contract-only`、`--no-build`、`--no-browser` 与 `--no-dev` 用于加速本地迭代；CI 与发布运行走完整路径。
- 已知的非致命告警类别（有意的 `NUXT_B3011` 同路径覆盖重名警告、Vue slot/readonly 告警、og:image/twitter:card 弃用、远程 Shiki 资源）记录在[项目状态](./project-status.zh-CN.md)。

# 文档规则

[English](./documentation.md) | **简体中文**

这些规则治理 Clarity Theme 文档系统的维护方式。`pnpm docs:check`（见 `scripts/check-docs.mjs`）在 CI 中强制执行其中的机械子集。

## 文档事实来源

当任何文档与现实不一致时，优先级为：

1. 当前源代码
2. `package.json` / `pnpm-lock.yaml` / `pnpm-workspace.yaml`
3. 自动化测试与兼容性契约
4. GitHub Actions 工作流
5. `sync-manifest.json`
6. 文档

绝不要为了让过期文字显得正确而"修复"代码——除非该修改是让文档变真实所必需的，并记录原因。现有文档是待审计材料，不是事实来源——编辑前先对照代码复核。

## 版本规则

**发布版本记录在 `CHANGELOG.md`；长期文档可以引用某个发布，但不得把当前发布写成快照。**

- 发布版本、日期、Added/Changed/Fixed/Breaking Changes 与迁移说明属于根目录 `CHANGELOG.md`：最新版本在最上方，严格按 SemVer 倒序（`docs:check` 校验顺序；可选的 `## Unreleased` 节可位于最新版本之上）。
- `create-clarity-theme` 使用自己的 `create-clarity-theme/CHANGELOG.md`；Theme changelog 永不描述创建器发布，反之亦然。
- 长期文档（README、`history/` 之外的 `docs/**`）不得把当前 Theme 发布版本**写成快照**——版本断言标签（`Version: <version>`、`Current release: <version>`、`当前版本：<version>`）、元数据表格值（`| Version | <version> |`）、精确包版本钉死（`clarity-theme@<version>`）或独立成行的版本标题。请使用 `<version>`、`v<version>` 或 `clarity-theme@<version>` 占位符。快照会在下一次发布时过期。
- 以下**不是**快照，因此允许：历史事实（`useClarityConfig was removed in 0.2.0`、`deleted in 0.2.0`）、迁移对照（`0.1.x → 0.2.0`）、安装范围（`^0.2.0`、`>=0.2.0 <0.3.0`）与发布来源记录（提升记录）。写明是哪个版本移除了某个 API 是必要的文档内容——`docs:check` 会把它们与快照区分开。
- 兼容性版本（Node、Nuxt、Vue、Nuxt Content、pnpm、上游 blog-v3 基线）属于技术参考数据，不是发布版本——允许保留在 requirements/compatibility/maintainer 页面中。
- 历史发布事故与一次性证据属于该版本的 changelog 条目或 `docs/history/`——绝不进入 publishing/checklist 流程文档。
- 不要创建按版本拆分的文件，如 `RELEASE-NOTES-*.md`、`VERSION-*.md`、`CHANGELOG-*.md`；`docs:check` 会对新文件报错。

## 受众规则

| 受众 | 需求 |
| --- | --- |
| 用户 | 创建、安装、迁移、配置并运行博客 |
| 开发者 | 与包/Layer API 及输出集成 |
| 维护者 | 开发、测试、同步、文档、发布与审计 Theme |
| Agent | 快速定位架构、API、测试、迁移 Skill、同步、发布与文档规则 |
| 历史 | 冻结的一次性记录，明确标注不具权威性 |

每个页面都要陈述或明确暗示自己的受众；不要在一个文件中混杂多个受众。

## 文档放置规则

| 内容 | 位置 |
| --- | --- |
| Clarity 是什么、关键路径、快速开始、顶层功能摘要 | `README.md`（落地页——保持精简；链接出去，而不是内联参考内容） |
| 首次设置与迁移操作指南 | `docs/getting-started/` |
| 功能的日常使用方法 | `docs/guides/` |
| 确切的 API/输出/兼容性契约 | `docs/reference/` |
| 心智模型与设计边界 | `docs/concepts/` |
| 如何开发、测试、同步、发布与治理仓库 | `docs/maintainers/` |
| 一次性审计、迁移报告、阶段叙事 | `docs/history/` |

经验法则：

- README 在一分钟内回答"这是什么/如何开始/文档在哪"，其余全部链接到文档站。
- Reference 页面描述契约而非教程；guides 描述任务而非穷举类型列表。
- Maintainer 页面用 `<version>` 占位符描述永久流程——绝不包含某次具体发布的证据、时间戳或数量。
- History 页面以"历史记录——不具权威性"说明开头，可以引用已不存在的版本与路径。

## 双语规则

面向用户的文档使用 `foo.md`（英文）+ `foo.zh-CN.md`（中文）成对文件：

1. 两个语言版本保持相同的信息架构与标题层级。
2. 代码示例与功能列表必须等价——任何一方都不得丢失实际功能信息。
3. 新增面向用户的文档默认双语添加；`docs:check` 校验配对（history 页面作为冻结记录豁免；审计的中文译本可自愿补充）。
4. 措辞可以自然翻译，但链接必须指向另一语言的同一文档。

## 生成文档规则

- `docs/reference/compatibility.md` 由 `scripts/compatibility-cases.mjs` 中的 `compatibilityContract` 生成。用 `node scripts/test-compatibility.mjs --update-docs` 重新生成；绝不要手改表格。`pnpm test:contract` 会在文件不同步时报错。中文版是人工同步的翻译快照——英文版重新生成时需同步更新。
- 不引入新的生成文档，除非有能在漂移时失败的检查。

## 文档校验

`pnpm docs:check` 在 CI（第一层）运行并校验：

1. 长期文档不得把当前 `package.json.version` **写成快照**——版本断言标签、元数据表格值、精确包版本钉死或独立成行的版本标题；历史、迁移、安装范围与来源引用允许保留；
2. 不存在 `RELEASE-NOTES-*.md`、`VERSION-*.md`、`CHANGELOG-*.md` 文件；
3. 双语文件配对（`docs/history/` 除外）；
4. 相对 Markdown 链接指向真实文件；
5. changelog 发布章节按 SemVer 倒序；
6. README 体积保持合理（warning，不失败）。

# Clarity Theme 文档

[English](./README.md) | **简体中文**

这里是 Clarity Theme 全部文档的入口。文档按受众组织；每个面向用户的页面都有对应的 `*.zh-CN.md` 中文版本。当文档与源代码、包 manifest、测试、CI 或 `sync-manifest.json` 不一致时，以这些来源为准——见[文档规则](./maintainers/documentation.zh-CN.md)。

## 入门 — 面向创建或迁移博客的用户

| 页面 | 用途 |
| --- | --- |
| [创建新项目](./getting-started/new-project.zh-CN.md) | 使用创建器 CLI 脚手架生成博客 |
| [手动安装](./getting-started/manual-installation.zh-CN.md) | 在 Nuxt 项目中手动接入 Layer |
| [从 blog-v3 迁移](./getting-started/migration-from-blog-v3.zh-CN.md) | 保留内容、配置、重定向、补丁与自定义代码 |

## 指南 — 面向运行 Clarity 博客的用户

| 页面 | 用途 |
| --- | --- |
| [配置](./guides/configuration.zh-CN.md) | `clarity.config.ts` 字段级契约与 UI app config |
| [内容](./guides/content.zh-CN.md) | 文章集合、frontmatter schema、固定链接与渲染功能 |
| [Markdown / MDC 参考](./mdc/README.zh-CN.md) | 文章能力审计、语法指南与逐组件 references |
| [自定义](./guides/customization.zh-CN.md) | UI 覆盖、组件、Shiki、CSS、页面与服务端路由 |
| [集成](./guides/integrations.zh-CN.md) | Twikoo、head 脚本与反镜像 |

## 参考 — 面向与主题集成的开发者

| 页面 | 用途 |
| --- | --- |
| [公共 API](./reference/api.zh-CN.md) | 包导出、Layer 运行时契约与稳定性模型 |
| [路由与输出](./reference/routes-and-outputs.zh-CN.md) | 公共页面、HTTP 输出与功能开关 |
| [兼容性矩阵](./reference/compatibility.zh-CN.md) | 由脚本生成的验证矩阵（请勿手改） |

## 概念 — 面向理解设计的人

| 页面 | 用途 |
| --- | --- |
| [架构](./concepts/architecture.zh-CN.md) | Theme/Consumer 边界、配置流、数据流与包模型 |

## 维护者 — 面向开发与发布主题的维护者

| 页面 | 用途 |
| --- | --- |
| [开发](./maintainers/development.zh-CN.md) | 仓库结构、命令与工作流 |
| [测试](./maintainers/testing.zh-CN.md) | 验证矩阵与各层运行方式 |
| [上游同步](./maintainers/upstream-sync.zh-CN.md) | 基线 manifest、漂移处理与同步命令 |
| [补丁策略](./maintainers/patches.zh-CN.md) | 为什么补丁由消费方持有 |
| [发布](./maintainers/publishing.zh-CN.md) | 永久发布流程：版本、tag、OIDC npm 发布与回滚 |
| [发布清单](./maintainers/release-checklist.zh-CN.md) | 与版本无关的发布模板 |
| [项目状态](./maintainers/project-status.zh-CN.md) | 当前架构与验证事实 |
| [路线图](./maintainers/roadmap.zh-CN.md) | 现在 / 下一步 / 以后 / 推迟 |
| [文档规则](./maintainers/documentation.zh-CN.md) | 文档治理与放置规则 |

## 历史 — 冻结记录

[docs/history](./history) 保存一次性审计、迁移报告与阶段叙事。历史记录**对当前行为不具备权威性**；它们可能引用已不存在的旧版本与路径。发布历史位于根目录 [CHANGELOG](../CHANGELOG.md)，永远不使用按版本拆分的文件。
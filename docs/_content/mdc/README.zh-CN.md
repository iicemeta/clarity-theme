# Markdown / MDC 参考

[English](./README.md) | **简体中文**

本节文档化 Clarity Theme 面向文章的全部 Markdown 与 MDC 能力：语法外观、精确写法、props 与 slots，以及普通消费站点能否依赖它。它同时服务两类读者——人类作者与编码 Agent——并作为 [`article-beautifier`](../../../skills/article-beautifier/SKILL.md) Skill 的导航层。

事实来源优先级：`src/` 中的 Layer 实现、`nuxt.config.ts` 中的渲染管线、`playground/content/compatibility/` 中的兼容性基准，最后才是本文档。文档与源码冲突时以源码为准，并请修正文档。

## 状态词汇

每个能力都有且仅有一个状态。分类基于证据，而不是“上游存在”：

| 状态 | 含义 |
| --- | --- |
| `supported` | Layer 已携带实现、已为 MDC/Markdown 注册，普通消费站点按文档语法书写即可使用，无需消费者专属数据、页面或补丁。 |
| `conditional` | 可以使用，但必须满足文档化的条件：消费者数据、frontmatter 注册、消费者自有补丁或网络访问。 |
| `upstream-only` | 上游 blog-v3 存在，但 Theme 不做保证。不要引导用户使用。 |
| `do-not-use` | 源码或上游内容中能找到，但不应推荐用于文章写作。 |

## 当前审计摘要

完整清单、逐项状态、证据与缺口见 [审计](./audit.zh-CN.md)。本轮审计的 headline 数字：

| 能力总数 | supported | conditional | upstream-only | do-not-use |
| ---: | ---: | ---: | ---: | ---: |
| 39 | 30 | 7 | 0 | 2 |

`upstream-only` 组件缺口为零，表示被审计的上游基线中的每一个文章组件都已被 Layer 携带。`conditional` 条目几乎全部是消费者补丁与数据驱动的友链组件，而非实现缺失——判断功能是否损坏前请先阅读[审计缺口](./audit.zh-CN.md#gaps)。

## 章节地图

| 文档 | 用途 |
| --- | --- |
| [语法](./syntax.zh-CN.md) | MDC 语法形式本身：行内组件、容器、YAML props、插槽、嵌套、prose 映射 |
| [组件](./components/_index.zh-CN.md) | 每个 MDC 组件一份 reference（Alert、Badge、Tab、Pic……） |
| [插件](./plugins/_index.zh-CN.md) | 围栏驱动与 remark/rehype 驱动的能力（数学、Mermaid、ABC、meta 插槽、补丁） |
| [审计](./audit.zh-CN.md) | 完整清单、分类证据、缺口与维护流程 |

## Agent 阅读顺序

1. 先读 [`skills/article-beautifier/references/_index.md`](../../../skills/article-beautifier/references/_index.md)——机器可读的能力索引。
2. 只挑选与文章语义匹配的 reference 文件。
3. 打开 `docs/mdc/components/` 或 `docs/mdc/plugins/` 下对应的页面。当 Skill 通过 `npx skills add` 独立安装时，改用 `skills/article-beautifier/references/` 下的捆绑副本——它们是这些页面的同步副本。
4. 绝不猜测 prop、slot 或 variant；文档没有写的内容就不要使用。

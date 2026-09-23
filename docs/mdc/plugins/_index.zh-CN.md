# 管线与插件 References

[English](./_index.md) | **简体中文**

这些能力不是以组件标签书写的：它们通过围栏代码语言、数学定界符、frontmatter 或包补丁进入。一种独立扩展，一份 reference。

| Reference | 作者语法 | 状态 | 用途 |
| --- | --- | --- | --- |
| [code-component](./code-component.zh-CN.md) | 围栏语言映射 | supported | ` ```mermaid ` 与 ` ```music-abc ` 如何变成组件 |
| [mermaid](./mermaid.zh-CN.md) | ` ```mermaid ` | supported | 图表渲染，懒加载且适配主题 |
| [music-abc](./music-abc.zh-CN.md) | ` ```music-abc ` | supported | ABC 记谱渲染与播放 |
| [math](./math.zh-CN.md) | `$…$`、`$$…$$` | supported | KaTeX 行内与块级公式 |
| [meta-slots](./meta-slots.zh-CN.md) | `::meta-*` | conditional | 注入页面插槽的文章内容 |
| [reading-time](./reading-time.zh-CN.md) | frontmatter | supported | 自动注入的阅读时间 |
| [patches](./patches.zh-CN.md) | 消费者补丁 | conditional | 依赖消费者自有补丁的渲染行为 |

Layer 配置了整条 Markdown 管线；消费项目不要重复注册这些插件。见[内容指南](../../guides/content.zh-CN.md)。

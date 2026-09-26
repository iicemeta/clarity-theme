# 组件 References

[English](./_index.md) | **简体中文**

一个组件一份 reference。所有 `supported` 与 `conditional` 的 MDC 组件都有独立页面；`do-not-use` 结论只保留在[审计](../audit.zh-CN.md)中，刻意不提供写作 reference。机器应从 `skills/article-beautifier/references/_index.md` 进入；人类可以浏览下表。

| Reference | MDC 标签 | 类型 | 状态 | 用途 |
| --- | --- | --- | --- | --- |
| [alert](./alert.zh-CN.md) | `::alert` | 容器 | supported | 分类型提示块：tip、info、question、warning、error |
| [badge](./badge.zh-CN.md) | `:badge[…]` | 行内 | supported | 紧凑链接徽章，自动配图 |
| [blur](./blur.zh-CN.md) | `:blur[…]` | 行内 | supported | 悬停显现的剧透文本 |
| [card-list](./card-list.zh-CN.md) | `::card-list` | 容器 | supported | 把普通列表变成卡片网格 |
| [chat](./chat.zh-CN.md) | `::chat` | 容器 | supported | 带发言人标记的聊天记录 |
| [copy](./copy.zh-CN.md) | `:copy{…}` | 行内 | supported | 可编辑、可复制的命令行 |
| [emoji-clock](./emoji-clock.zh-CN.md) | `:emoji-clock{…}` | 行内 | supported | 随时间变化的时钟 emoji |
| [feed-card](./feed-card.zh-CN.md) | `::feed-card` | 容器 | conditional | 需要 `FeedEntry` 数据的友链卡片 |
| [feed-group](./feed-group.zh-CN.md) | `::feed-group` | 容器 | conditional | 需要订阅数据的友链分组 |
| [folding](./folding.zh-CN.md) | `::folding` | 容器 | supported | 可折叠 details 块 |
| [key](./key.zh-CN.md) | `:key{…}` | 行内 | supported | 带修饰键的键盘按键 |
| [link](./link.zh-CN.md) | `[label](https://example.com)` | prose | supported | 带域名图标的主题化链接 |
| [link-banner](./link-banner.zh-CN.md) | `::link-banner` | 容器 | supported | 横幅式链接卡片 |
| [link-card](./link-card.zh-CN.md) | `::link-card` | 容器 | supported | 图标链接卡片 |
| [pic](./pic.zh-CN.md) | `::pic` | 容器 | supported | 带图注与缩放的富图片 |
| [poetry](./poetry.zh-CN.md) | `::poetry` | 容器 | supported | 居中诗行块 |
| [code-block](./code-block.zh-CN.md) | 围栏代码 | prose | supported | ProsePre：文件名、meta、折叠、复制 |
| [inline-code](./inline-code.zh-CN.md) | `` `code` `` | prose | supported | ProseCode，可选 `{lang}` |
| [table](./table.zh-CN.md) | Markdown 表格 | prose | supported | 可滚动表格容器 |
| [quote](./quote.zh-CN.md) | `::quote` | 容器 | supported | 带图标的大段引用 |
| [tab](./tab.zh-CN.md) | `::tab` | 容器 | supported | 通过 `#tabN` 插槽实现的选项卡 |
| [timeline](./timeline.zh-CN.md) | `::timeline` | 容器 | supported | 带标题行的时间线 |
| [tip](./tip.zh-CN.md) | `:tip[…]` | 行内 | supported | 行内提示气泡，可复制 |
| [video-embed](./video-embed.zh-CN.md) | `::video-embed` | 容器 | supported | 响应式视频 / iframe 嵌入 |

围栏驱动组件（[Mermaid](../plugins/mermaid.zh-CN.md)、[ABC 乐谱](../plugins/music-abc.zh-CN.md)）与管线能力见[插件](../plugins/_index.zh-CN.md)。

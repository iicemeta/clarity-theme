# VideoEmbed

[English](./video-embed.md) | **简体中文**

## 用途

响应式、懒加载的视频嵌入，支持原始文件与多个平台，并按类型适配宽高比。

## 基本语法

```md
::video-embed
---
type: bilibili
id: BV1Yr421p7rW
---
::

:video-embed{type="raw" id="https://example.com/clip.mp4" poster="https://example.com/poster.jpg"}
```

## Props

| Prop | 类型 / 默认值 | 说明 |
| --- | --- | --- |
| `type` | `raw` \| `bilibili` \| `bilibili-nano` \| `youtube` \| `douyin` \| `douyin-wide` \| `tiktok`，默认 `raw` | 嵌入类型 |
| `id` | string，必填 | 平台视频 id；`raw` 时为视频 URL |
| `autoplay` | boolean | 传入播放器 URL |
| `ratio` | string \| number | 例如 `"16 / 9"`、`1.6`；按类型默认（douyin `27 / 56`、douyin-wide `1198 / 731`、其余 `16 / 9`） |
| `poster` | string | 封面图，仅 `raw` |
| `width` / `height` | string | 最大尺寸（`height` 默认 `80vh`） |

YAML 中长数字 id 要加引号，保持字符串。

组件源码中声明了 `zoom` prop，但当前未被使用——抖音类型在内部自动计算缩放。不要传递它。

## 插槽

无。

## 支持的取值

见 `type`。外部 iframe 懒加载；自动播放取决于平台。

## 示例

```md
::video-embed{type="youtube" id="dQw4w9WgXcQ"}
::
```

## 嵌套

独立块。

## 何时使用

视频本身就是内容——文章要讨论的演示、演讲、回放。

## 何时不要使用

装饰性片段，或一篇文章大量嵌入（它们很重且依赖第三方）。

## 常见错误

- 19 位抖音 id 未加引号被解析为数字。
- 对 iframe 类型设置 `poster`。

## 支持状态

`supported` —— 源码验证；暂无兼容性基准覆盖（见审计缺口 3）。

## 来源

`src/components/content/VideoEmbed.vue`；上游语料中 10 次。

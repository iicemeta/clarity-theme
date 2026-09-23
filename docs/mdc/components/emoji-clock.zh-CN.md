# EmojiClock

[English](./emoji-clock.md) | **简体中文**

## 用途

与时钟一致的 emoji——可以是固定时间，也可以是读者当前时间。

## 基本语法

```md
:emoji-clock
:emoji-clock{rotate}
:emoji-clock{datetime="2024-11-09 23:39:30"}
```

## Props

| Prop | 类型 | 说明 |
| --- | --- | --- |
| `datetime` | string | 固定时间；省略则显示实时时钟，每 30 秒刷新 |
| `rotate` | boolean | 分针模式：emoji 按 5 分钟步进旋转 |

## 插槽

无。

## 支持的取值

`datetime` 经站点的 `toZonedTemporal` 辅助函数解析为带时区的 Temporal 值。

## 示例

```md
部署窗口在 :emoji-clock{datetime="2026-01-01 09:00:00"} 准时开启。
```

## 嵌套

仅行内。

## 何时使用

随笔、日记类文章中的时间戳；小幅度的“当前时间”指示。

## 何时不要使用

任何需要精确、可访问时间的地方——请用纯文本；emoji 不是机器可读的时间。

## 常见错误

- 用实时时钟表达既定活动时间。
- 未确认 `datetime` 语义就假设特定时区。

## 支持状态

`supported` —— 源码验证；暂无兼容性基准覆盖（见审计缺口 3）。

## 来源

`src/components/content/EmojiClock.vue`；上游展示页中的用法。

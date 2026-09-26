# 阅读时间

[English](./reading-time.md) | **简体中文**

## 用途

`remark-reading-time` 为每个内容文件的 frontmatter 注入计算出的 `readingTime`；文章头部、列表与统计消费它。

## 基本语法

无需书写——也不可以书写：

```yaml
---
title: 一篇文章
# readingTime: ← 永远不要手动设置
---
```

## 行为

插件在解析时计算 `{ text, minutes, time, words }`。schema 把它带到页面与组件（来源：`src/config/content.ts`、`PostHeader`）。

## 何时使用

始终；它是自动的。

## 何时不要使用

永远不要手改 `readingTime`；注入值优先，否则 schema 会拒绝不匹配。

## 常见错误

- 重构时在文章之间复制 `readingTime`。

## 支持状态

`supported` —— 每个兼容性文章用例（如 `E-normal-article`）都会经过它。

## 来源

`nuxt.config.ts` 中的 `remark-reading-time` 注册；schema 位于 `src/config/content.ts`。

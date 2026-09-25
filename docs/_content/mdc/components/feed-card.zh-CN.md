# FeedCard

[English](./feed-card.md) | **简体中文**

## 用途

由结构化 `FeedEntry` 数据驱动的友链卡片：头像、作者、站点标题、订阅状态、描述、架构图标。为友链页设计，不是通用文章排版组件。

## 基本语法

```md
::feed-card
---
author: 示例博主
title: 示例博客
desc: 一段简介
link: https://friend.example.com/
feed: https://friend.example.com/atom.xml
icon: https://friend.example.com/favicon.svg
avatar: https://friend.example.com/avatar.webp
archs:
  - Nuxt
date: 2026-01-02
---
::
```

## Props

`FeedEntry` 的全部字段（来源：`src/config/feed.ts`）：`author`*、`sitenick`、`title`、`desc`、`link`*、`feed`、`icon`*、`avatar`*、`archs`、`date`*、`comment`、`error`（* 必填）。

## 插槽

无。

## 支持的取值

`archs` 使用共享的 `Arch` 图标名。订阅源失效时，`error` 会作为卡片描述渲染。

## 示例

见上；典型消费者是友链页，它展开来自消费者 `feeds.ts` 的条目。

## 嵌套

独立块；不要嵌套。

## 何时使用

仅用于确实符合 `FeedEntry` 结构的友链 / 博客圈数据。

## 何时不要使用

推荐资源卡、项目卡，或任何需要硬塞进 `FeedEntry` 字段的内容——请用 `card-list`、`link-card` 或 `link-banner`。

## 常见错误

- 省略必填字段却期待优雅的占位渲染。
- 把友链数据维护在文章里，而不是消费者的 `feeds.ts`。

## 支持状态

`conditional` —— 组件已携带并注册，但它期望消费者自有的订阅数据，并由友链页（上游 `src/pages/link.vue`）消费。不属于文章美化能力；Skill 的推荐中已排除。

## 来源

`src/components/content/FeedCard.vue`；类型 `src/config/feed.ts`；上游 `app/pages/link.vue` 的页面用法。

# FeedGroup

[English](./feed-group.md) | **简体中文**

## 用途

带标题（和可选随机排序按钮）的 FeedCard 分组——友链页的数据容器。

## 基本语法

```md
::feed-group{name="朋友" desc="我订阅的人" shuffle}
…… 与 FeedCard 兼容的条目通常以数据提供，而非手写 ……
::
```

实际上该组件接收 `entries` 数组；在 YAML 中手写 `entries` 虽可行但很冗长——那是友链页的职责。

## Props

`FeedGroup` 字段（来源：`src/config/feed.ts`）外加一个开关：`name`*、`desc`、`entries`*（`FeedEntry[]`）、`shuffle`（boolean——启用随机/恢复排序控件）。

## 插槽

无。

## 支持的取值

`shuffle` 会尊重 URL 查询参数 `?shuffle=false` 以恢复原始顺序（来源：`FeedGroup.vue`）。

## 示例

上游友链页把消费者 `feeds.ts` 的分组映射到本组件，并从 `link.randomInGroup` app config 键传入 `shuffle`。

## 嵌套

包含 FeedCard 数据；不要嵌套其他内容。

## 何时使用

仅限由消费者数据支撑的真实友链列表。

## 何时不要使用

任何文章结构。文章内容的分组应交给标题、CardList 或 Tab。

## 常见错误

- 在文章里手写 `entries`，而不是维护 `feeds.ts`。
- 未设置 `shuffle` 却期待随机排序行为。

## 支持状态

`conditional` —— 已携带，但只有配合消费者订阅数据与友链页才有意义。Skill 的推荐中已排除。

## 来源

`src/components/content/FeedGroup.vue`；类型 `src/config/feed.ts`；上游 `app/pages/link.vue`。

# LinkCard

[English](./link-card.md) | **简体中文**

## 用途

面向单个外部资源的紧凑卡片：标题、描述与图标。“推荐阅读”条目的主力组件。

## 基本语法

```md
::link-card
---
title: Nuxt Content
icon: https://content.nuxt.com/favicon.ico
link: https://content.nuxt.com/docs/files/markdown
---
::
```

短值也可以用花括号 props：

```md
::link-card{title="Nuxt" link="https://nuxt.com"}
::
```

## Props

| Prop | 类型 | 说明 |
| --- | --- | --- |
| `title` | string，必填 | 卡片标题 |
| `link` | string，必填 | 目标 URL |
| `description` | string | 回退为链接域名 |
| `icon` | string | 图标图片 URL；`#icon` 插槽优先 |
| `mirror` | `ImgService` | 图标图片镜像：`baidu` \| `fly` \| `weserv` \| `true` |

## 插槽

- `icon` —— 富文本图标内容；覆盖 `icon` prop

## 支持的取值

`class` 属性会透传到卡片（上游 YAML 中使用 `class: gradient-card active`）。

## 示例

```md
::link-card{title="文档" icon="https://example.com/favicon.ico" link="https://example.com/docs" description="参考资料"}
::
```

## 嵌套

独立块；成组卡片应放进 [CardList](./card-list.zh-CN.md) 或普通列表。

## 何时使用

读者可能点击离开的少量推荐资源、工具或相关文章。

## 何时不要使用

每个行内引用（用纯链接）、站内导航（用列表），或装饰性填充。

## 常见错误

- 省略 `title`/`link`。
- 期待 favicon 自动解析——与 Badge 不同，LinkCard 只有传入 icon 才显示。

## 支持状态

`supported` —— 源码验证；暂无兼容性基准覆盖（见审计缺口 3）。

## 来源

`src/components/content/LinkCard.vue`；上游文章与展示页中的用法（52 次）。

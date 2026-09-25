# LinkBanner

[English](./link-banner.md) | **简体中文**

## 用途

带背景图的宽幅横幅链接卡——用于极少数值得英雄级突出的链接。

## 基本语法

```md
::link-banner
---
banner: https://example.com/cover.jpg
title: 项目名称
description: 一行介绍
link: https://example.com/
---
::
```

## Props

| Prop | 类型 | 说明 |
| --- | --- | --- |
| `title` | string，必填 | 横幅标题 |
| `link` | string，必填 | 目标 URL |
| `banner` | string | 背景图 URL |
| `description` | string | 回退为链接域名 |
| `mirror` | `ImgService` | 让背景图走图片镜像：`baidu` \| `fly` \| `weserv` \| `true` |

## 插槽

无。

## 支持的取值

`mirror` 接受 `src/utils/img.ts` 定义的图片服务键；`true` 使用默认镜像。

## 示例

```md
::link-banner{banner="/img/cover.webp" title="主题文档" link="/docs/"}
::
```

## 嵌套

独立块。

## 何时使用

文章开头或结尾处单个旗舰推荐。

## 何时不要使用

一篇文章里多个横幅，或普通引用——用纯链接或 LinkCard。

## 常见错误

- 省略 `title` 或 `link`（两者必填）。
- 对本地路径使用 `mirror`；镜像面向可能缓慢或被墙的远程图片。

## 支持状态

`supported` —— 源码验证；暂无兼容性基准覆盖（见审计缺口 3）。

## 来源

`src/components/content/LinkBanner.vue`；上游文章与展示页中的用法。

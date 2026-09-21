---
title: MDC 组件兼容性
description: Clarity 自定义 MDC 组件渲染基准（C 类）。
---

# MDC 组件

## Alert

::alert{type="info" title="信息提示"}
info 类型的提示内容。
::

::alert{type="warning"}
warning 类型的提示内容。
::

## Tip

悬停提示：:tip{icon="tabler:info-circle" text="提示内容"}

## Copy

::copy{prompt="安装命令"}
```sh
pnpm add -D clarity-theme
```
::

## CardList

::card-list
- **特性一**：卡片列表第一项
- **特性二**：卡片列表第二项
::

## Folding

:::folding{title="点击展开"}
折叠内容。
:::

## Badge（Consumer Override）

:badge[Nuxt]{link="https://nuxt.com"}

:badge[GitHub]{link="https://github.com"}

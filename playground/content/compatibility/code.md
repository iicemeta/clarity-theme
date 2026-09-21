---
title: 代码渲染兼容性
description: inline / fenced / metadata 代码渲染基准。
---

# 代码渲染

## 行内代码

`hello`

`clarity.config.ts`

配置文件 `clarity.config.ts`、`content.config.ts`、`feeds.ts` 与 `app/app.config.ts` 应全部正常显示。

## 行内高亮代码

`const x = 1`{lang="ts"}

`pnpm install`{lang="sh"}

## 围栏代码

```ts
interface Article {
	title: string
	tags?: string[]
}

export function createArticle(title: string): Article {
	return { title, tags: [] }
}
```

## 指定文件名

```ts [clarity.config.ts]
import { defineClarityConfig } from 'clarity-theme/config'

export default defineClarityConfig({
	site: { title: '我的博客' },
})
```

## 行高亮与元信息

```ts {2,4} meta-info-demo
const first = 1
const highlighted = 2
const third = 3
const alsoHighlighted = 4
```

## Diff 标记

```diff
- const removed = 'old'
+ const added = 'new'
```

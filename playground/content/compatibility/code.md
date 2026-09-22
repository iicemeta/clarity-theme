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
const highlighted = 2 // [!code highlight]
const third = 3
const alsoHighlighted = 4 // [!code highlight]
```

## 元信息驱动渲染

```ts [meta-demo.ts] {2} icon=tabler:star indent=2 wrap
const metaLine = 1
const highlightedByMeta = 2
```

## Tab 保留

```ts
function tabIndent() {
	const nested = {
		deep: 'value',
	}
	return [1,	2,	3]
}
```

## Diff 标记

```diff
- const removed = 'old'
+ const added = 'new'
```

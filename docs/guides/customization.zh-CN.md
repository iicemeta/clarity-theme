# 自定义 Clarity Theme

[English](./customization.md) | **简体中文**

Clarity 将站点数据与展示分离：

- `clarity.config.ts` 持有站点身份、Content 语义、feed 上限、统计范围、集成、功能开关与更新日志数据。
- `app/app.config.ts` 只持有 UI 默认值。
- 使用方的同路径文件可以覆盖选定的 Layer 组件。
- 使用方的 CSS、服务端路由、路由规则、插件与模块仍然属于你自己。

数据契约见[配置说明](../guides/configuration.zh-CN.md)，blog-v3 文件映射见[迁移指南](../getting-started/migration-from-blog-v3.zh-CN.md)。

## 1. UI 配置

创建 `app/app.config.ts`，把覆盖项放在 `clarity` 下：

```ts
export default defineAppConfig({
	clarity: {
		component: {
			alert: { defaultStyle: 'flat' },
			codeblock: {
				triggerRows: 32,
				collapsedRows: 16,
				enableIndentGuide: true,
				indent: 4,
				tabSize: 3,
			},
			excerpt: { animation: true, caret: '_' },
			slide: { showTitle: true },
			stats: { birthYear: 2000 },
		},
		footer: {
			copyright: '© 2026 My Name',
			iconNav: [
				{ icon: 'tabler:brand-github', text: 'GitHub', url: 'https://github.com/example' },
			],
			nav: [
				{
					title: 'Site',
					items: [{ icon: 'tabler:rss', text: 'Feed', url: '/atom.xml' }],
				},
			],
		},
		header: {
			logo: '/avatar.webp',
			showTitle: true,
			subtitle: 'A short subtitle',
			emojiTail: ['📝', '✨'],
		},
		link: {
			remindNoFeed: true,
			randomInGroup: true,
		},
		nav: [
			{
				title: '',
				items: [
					{ icon: 'tabler:files', text: 'Articles', url: '/' },
					{ icon: 'tabler:link', text: 'Friends', url: '/link' },
					{ icon: 'tabler:archive', text: 'Archive', url: '/archive' },
				],
			},
		],
		pagination: {
			perPage: 10,
			sortOrder: 'date',
			allowAscending: false,
		},
		themes: {
			light: { icon: 'tabler:sun', tip: 'Light' },
			system: { icon: 'tabler:device-desktop', tip: 'System' },
			dark: { icon: 'tabler:moon', tip: 'Dark' },
		},
	},
})
```

只有 `component`、`footer`、`header`、`link`、`nav`、`pagination` 与 `themes` 是合法的 UI 分组。不要把 `site`、`article`、`feed`、`stats`、`integrations`、`features` 或 `changelog` 放在这里；Clarity 会发出警告，因为使用方 app config 的合并优先级更高，可能意外遮蔽已校验的站点配置。

Nuxt 对对象做深度合并。数组会整体替换主题的值，因此覆盖 `nav`、`footer.nav`、`footer.iconNav` 或 `emojiTail` 时必须提供完整数组。

派生默认值：

- `header.logo` 回退到 `site.author.avatar`。
- `header.subtitle` 回退到 `site.subtitle`。
- `footer.copyright` 由当前年份、作者与可选的版权名称生成。
- `pagination.sortOrder` 必须匹配 `article.order` 中的某个键。

## 2. 使用方组件覆盖

当组件存在于相同的 Layer 相对路径时，Nuxt 让使用方应用优先。把你的文件放在项目的 `app/components/` 树下。

### Content 组件

Content/MDC 组件位于：

```text
app/components/content/
```

例如，创建：

```text
app/components/content/Badge.vue
```

即可替换被以下语法使用的 Layer 组件：

```md
:badge{name="Nuxt"}
```

保留你的 Markdown 期望的公共 props/slots。一个最小的标记组件：

```vue
<template>
<span class="my-badge"><slot /></span>
</template>
```

常见的内容覆盖点包括 `Alert.vue`、`Badge.vue`、`CardList.vue`、`Copy.vue`、`Folding.vue`、`Mermaid.vue`、`MusicScore.vue`、`Pic.vue`、`Tip.vue`，以及 `ProseCode.vue` 等 prose 组件。

### 博客布局组件

博客外壳与文章组件位于：

```text
app/components/blog/
app/components/post/
app/components/widget/
```

例如：

```text
app/components/blog/BlogFooter.vue
app/components/blog/BlogSidebar.vue
app/components/post/Article.vue
app/components/widget/BlogStats.vue
```

导航、页脚链接、分页、组件阈值等数据驱动的修改请优先使用 UI 配置。只有当你需要不同的结构或行为时才复制组件。

### 覆盖规则

1. 不要把整个主题组件树复制进你的项目。
2. 只复制你有意自定义的组件。
3. 在你的站点文档中记录被复制的路径与 Clarity 版本。
4. 每次主题升级后重新审查覆盖。
5. Nuxt 可能对有意的同路径覆盖发出重名警告（`NUXT_B3011`）；功能受支持，但该警告是当前的已知限制。

`content/`、`blog/`、`post/` 与 `widget/` 之外的路径更可能是内部实现。技术上可以按路径覆盖，但它们的 props 与职责稳定性较低。

## 3. 自定义 Shiki 配置

创建：

```text
app/shiki.config.ts
```

示例：

```ts
export default defineConfig({
	themes: {
		light: () => import('shiki/themes/github-light.mjs'),
		dark: () => import('shiki/themes/one-dark-pro.mjs'),
	},
})
```

该文件存在时，Clarity 会用它取代主题回退。除非你的色彩模式配置刻意禁用其中一个，否则请同时保留 light 与 dark 主题。

Shiki 代码转换器与语言注册属于主题 Markdown 管线。使用方的 Shiki 主题文件只改变主题数据；它不是注册重复 Markdown 插件的地方。如果你的构建环境限制远程导入，请显式测试，因为当前 Shiki 加载可能访问远程模块主机。

## 4. CSS 覆盖

创建使用方样式表，例如：

```text
app/assets/css/site.scss
```

在 `nuxt.config.ts` 中注册：

```ts
export default defineNuxtConfig({
	extends: ['clarity-theme'],
	css: ['~/assets/css/site.scss'],
})
```

使用小而精准的规则，而不是复制并编辑完整主题样式表。使用方 CSS 追加在 Layer CSS 之后，因此同等特异性的后置规则可以覆盖主题样式。

主题色彩 token 包括：

```css
:root {
	--hue-theme: 220deg;
	--c-primary: hsl(var(--hue-theme) 100% 55%);
	--c-text-1: hsl(var(--hue-theme) 0% 20%);
	--c-bg: hsl(var(--hue-theme) 20% 98%);
	--c-border: hsl(var(--hue-theme) 10% 91%);
}
```

修改颜色时同时覆盖 light 与 dark 作用域：

```scss
:root,
.light {
	--hue-theme: 260deg;
}

.dark {
	--hue-theme: 260deg;
}
```

`src/assets/css/_variable.scss` 中的 SCSS 变量与 mixin 是内部构建细节。自定义属性与可见选择器是更安全的自定义点，但重大视觉变更应使用组件覆盖加显式测试。

## 5. 自定义页面、布局、插件与模块

使用方自有的 Nuxt 文件与 Layer 共存：

```text
app/layouts/
app/pages/
app/plugins/
app/composables/
modules/
```

- 使用方同路径的页面或布局覆盖 Layer 路由/布局。
- 在使用方 `nuxt.config.ts` 中添加自定义插件与模块。
- 避免重复添加 Clarity 已提供的模块与钩子；只配置你的额外行为。
- 自定义 composables 与插件应使用 Clarity 的公共 composables，而不是导入私有内部实现。

如果你覆盖了 `app/error.vue`、`app/app.vue` 或某个页面，该文件未来的变更由你负责。记录原因，并在升级期间重新审查。

## 6. 自定义服务端路由与路由规则

Clarity 提供：

```text
src/server/api/stats.get.ts
src/server/routes/atom.xml.get.ts
src/server/routes/subscriptions.opml.get.ts
```

你的项目可以添加：

```text
server/api/**
server/routes/**
server/middleware/**
server/plugins/**
```

认证、API、webhook、图片代理、搜索端点与其他站点能力保留在使用方。如果使用方路由与 Clarity 路由冲突，不要依赖偶然的优先级：审查两边的实现，选择唯一的归属方，并添加回归测试。

自定义 `routeRules`、重定向、缓存、头、安全策略、平台变换与部署行为请使用使用方的 `nuxt.config.ts`。重定向数据始终由站点持有：

```ts
import { mapValues } from 'es-toolkit/object'
import redirectList from './redirects.json'

export default defineNuxtConfig({
	extends: ['clarity-theme'],
	routeRules: {
		...mapValues(redirectList, to => ({ redirect: { to, statusCode: 308 } })),
	},
})
```

## 7. 公共资源与内容

站点自有的文件保存在：

```text
content/
public/
```

主题只提供通用字体、Atom XSLT/CSS 与其他通用公共资源。你的 favicon、头像、图片、下载文件、service worker、验证文件与部署元数据仍然属于使用方文件。

不要把私钥或环境相关的凭据放在公共资源或任何客户端可见的配置中。

## 8. 测试自定义内容

对每个覆盖，至少测试：

1. light 与 dark 模式下的自定义 UI；
2. 移动端与桌面端布局；
3. SSR HTML 与客户端水合；
4. 相关的 Markdown/MDC 内容；
5. 适用时的功能关闭分支；
6. 自定义服务端路由与路由规则；
7. 静态生成与你的部署预览。

运行：

```bash
pnpm typecheck
pnpm generate
```

然后运行你项目自己的集成与部署测试。完整清单见[迁移指南 → 验证](../getting-started/migration-from-blog-v3.zh-CN.md#7-验证)。

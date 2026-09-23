# 集成

[English](./integrations.md) | **简体中文**

Clarity 只通过配置集成第三方服务——它不运行后端、不打包服务凭据、不携带统计标识。事实来源：`src/config/schema.ts` 中的 `clarityIntegrationsSchema` / `clarityFeaturesSchema`、`src/modules/clarity-config/index.ts` 中的注入代码，以及运行时的 `src/components/post/Comment.vue` 与 `src/modules/clarity-config/anti-mirror-client.ts`。

## Twikoo 评论

```ts
export default defineClarityConfig({
	site: { /* … */ },
	integrations: {
		twikoo: {
			envId: 'https://twikoo.example.com/',
			preload: 'https://twikoo.example.com/',
		},
		scripts: [
			{ src: 'https://twikoo.example.com/', defer: true },
		],
	},
})
```

- 只有存在 `integrations.twikoo.envId` 时才渲染评论区；`preload` 可选，默认使用 `envId`。
- Theme 不打包 Twikoo——请把它的 loader 脚本保留在 `integrations.scripts` 中。
- `twikoo.*` 属于客户端可见配置，不得包含私有凭据。Twikoo 部署密钥属于你的 Twikoo 后端，而不是 Clarity 配置。
- 检查文章页面是否包含 `#twikoo`，以及 CSP/网络策略是否放行 loader。

## Head 脚本

```ts
export default defineClarityConfig({
	site: { /* … */ },
	integrations: {
		scripts: [
			{ src: 'https://analytics.example.com/script.js', defer: true },
		],
	},
})
```

每个条目是 HTML 属性（`src`、`defer`、`async`、`data-*`……）组成的 record。模块在构建期把它们注入 `<head>`；会出现在生成的页面 HTML 中，但永远不会进入 appConfig。绝不要在这里放私有 token——只允许统计标识与公共端点。环境相关值属于消费方 `runtimeConfig` 和你自己的注入代码。

## 反镜像

```ts
export default defineClarityConfig({
	site: { /* … */ },
	features: {
		antiMirror: { blacklist: ['mirror.example.com'] },
	},
})
```

- 默认为 `false`。Theme **不携带任何默认黑名单**——镜像域名后缀必须显式提供。
- `antiMirror: true` 等价于空黑名单：会跳过注入并输出构建 WARN。请改用 `{ blacklist: [...] }`。
- 黑名单与从 `site.url` 派生的规范 URL 会以 base64 内联进一个小型客户端脚本，把访问者从镜像主机导航回规范主机。
- 迁移时不要在没有用户明确确认的情况下复制旧的私有域名列表。

## 功能输出

`features.atom`、`features.opml` 与 `features.stats` 切换 Theme 自身的服务端输出（`/atom.xml`、`/subscriptions.opml`、`/api/stats`）。关闭某项会移除它的 prerender 规则与 head 接线，**并且**让该路由在 dev/SSR 运行时返回 404。见[路由与输出](../reference/routes-and-outputs.zh-CN.md)。

## Theme 不提供的内容

Clarity 不运行、也不打包：评论后端、统计服务、图片代理、搜索索引、CMS/数据库层或部署平台。自定义端点留在你的 `server/` 目录中，由你负责。

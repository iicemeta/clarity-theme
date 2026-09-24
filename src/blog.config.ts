/**
 * 上游 `blog.config.ts` 兼容适配层（Layer 边界的唯一转换点）。
 *
 * blog-v3 的组件与 server 路由通过 `~~/blog.config` 直接读取站点配置；
 * Clarity 的消费项目使用 `clarity.config.ts`（嵌套 schema），
 * 因此由 src/modules/clarity-config 注入 `~~/blog.config` 别名指向本文件，
 * 将 clarity.config.ts 机械映射回上游的扁平配置形状（含 myFeed 导出）。
 * 上游同步文件因此可以保持 byte-identical，不再逐文件改写。
 */
import type { FeedEntry } from './types/feed'
import config from '#clarity/config'

const { site, article, feed, stats, integrations } = config

const blogConfig = {
	title: site.title,
	subtitle: site.subtitle ?? '',
	description: site.description,
	author: {
		name: site.author.name,
		avatar: site.author.avatar ?? '',
		email: site.author.email ?? '',
		homepage: site.author.homepage ?? '/',
	},
	copyright: site.copyright ?? { abbr: '', name: '', url: '' },
	favicon: site.favicon,
	language: site.language,
	timeEstablished: site.established ?? '',
	timeZone: site.timezone,
	url: site.url,
	defaultCategory: article.defaultCategory,

	article: {
		categories: article.categories,
		types: article.types,
		order: article.order,
		/** 仅供上游 pnpm new 脚本使用，Layer 消费场景不涉及 */
		useRandomPremalat: false,
		hidePostPrefix: article.hidePostPrefix,
		robotsNotIndex: article.robotsNotIndex,
	},

	/** 博客 Atom 订阅源 */
	feed,

	/** 向 <head> 中添加脚本 */
	scripts: integrations.scripts,

	/** 文章统计配置 */
	stats,

	/** 自己部署的 Twikoo 服务 */
	twikoo: integrations.twikoo ?? { envId: '', preload: '' },
}

/** 用于生成 OPML 和友链页面配置（与上游 blog.config.ts 的导出保持一致） */
export const myFeed: FeedEntry = {
	author: blogConfig.author.name,
	sitenick: blogConfig.title,
	title: blogConfig.title,
	desc: blogConfig.subtitle || blogConfig.description,
	link: blogConfig.url,
	feed: new URL('/atom.xml', blogConfig.url).toString(),
	icon: blogConfig.favicon,
	avatar: blogConfig.author.avatar,
	archs: ['Nuxt'],
	date: blogConfig.timeEstablished,
	comment: '这是我自己',
}

export default blogConfig

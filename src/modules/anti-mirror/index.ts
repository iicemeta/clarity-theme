import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { defineNuxtModule } from 'nuxt/kit'
import { minifySync } from 'oxc-minify'
import handleMirror from './runtime/client'

const blacklist = [
	'dgjlx.com', // blog.revincx.icu
	'dgvhqt.com', // blog.zhilu.cyou
	'hcmsla.com', // thyuu.com
	'wmlop.com', // xaoxuu.com
	'yswjxs.com', // blog.zhilu.cyou
]

export default defineNuxtModule({
	meta: {
		name: 'anti-mirror',
	},
	async setup(_options, nuxt) {
		// 生成的数据模块由 clarity-config（先于本模块注册）在 setup 阶段写入
		// <buildDir>/clarity/；静态相对路径会命中安装包内部位置（穿透 pnpm
		// 硬链接污染 store），改用基于 buildDir 的 file URL 动态导入，jiti 与
		// Node 原生加载均可解析。
		const buildInfoUrl = pathToFileURL(join(nuxt.options.buildDir, 'clarity', 'blog.config.mjs')).href
		const { default: blogConfig } = await import(buildInfoUrl)
		nuxt.options.app.head.script ??= []
		nuxt.options.app.head.script.push({
			innerHTML: toIifeString(handleMirror, blacklist.map(btoa), btoa(blogConfig.url)),
		})
	},
})

function toIifeString<T extends unknown[]>(fn: (...args: T) => void, ...args: T) {
	const fnString = fn.toString()
	const argsString = JSON.stringify(args).slice(1, -1)
	const minified = minifySync('', `(${fnString})(${argsString})`)
	return minified.code
}

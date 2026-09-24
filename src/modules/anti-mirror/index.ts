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
	async setup(options, nuxt) {
		// 生成的数据模块由 clarity-config 在 setup 阶段写入，静态 import 会在
		// 模块加载阶段读到上一次构建的旧值，因此改为 setup 内动态 import。
		const { default: blogConfig } = await import('../../generated/blog.config.mjs')
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

import { defineNuxtModule } from 'nuxt/kit'
import { minify } from 'oxc-minify'
import handleMirror from './runtime/client'

export interface ModuleOptions {
	/** 需要跳转回源站的镜像站域名后缀 */
	blacklist: string[]
	/** 源站规范 URL */
	target: string
}

/**
 * 可选功能：检测常见镜像站域名并跳转回源站。
 * 由 clarity-config 模块根据 features.antiMirror 配置按需安装。
 */
export default defineNuxtModule<ModuleOptions>({
	meta: {
		name: 'anti-mirror',
	},
	setup(options, nuxt) {
		const blacklist = [...defaultMirrorBlacklist, ...options.blacklist]
		;(nuxt.options.app.head.script ??= []).push({
			innerHTML: toIifeString(handleMirror, blacklist.map(btoa), btoa(options.target)),
		})
	},
})

/** 默认镜像站域名黑名单（可被配置扩展） */
const defaultMirrorBlacklist = [
	'dgjlx.com',
	'dgvhqt.com',
	'hcmsla.com',
	'wmlop.com',
	'yswjxs.com',
]

function toIifeString<T extends unknown[]>(fn: (...args: T) => void, ...args: T) {
	const fnString = fn.toString()
	const argsString = JSON.stringify(args).slice(1, -1)
	const minified = minify('', `(${fnString})(${argsString})`)
	return minified.code
}

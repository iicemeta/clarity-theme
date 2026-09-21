#!/usr/bin/env node
/**
 * Clarity Theme 提纯验证（sync:verify 的一部分）
 *
 * 检查 Theme 中不存在：
 * 1. 上游作者个人信息（域名、统计 ID、评论服务、社交账号等）
 * 2. 站点内容文件（content/、feeds 数据、redirects 等）
 * 3. 错误的 Layer 路径（~~/blog.config、~/feeds 等消费项目路径）
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { extname, join, relative } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const themeDir = fileURLToPath(new URL('..', import.meta.url))

const forbiddenFiles = [
	'content',
	'app/feeds.ts',
	'blog.config.ts',
	'content.config.ts',
	'redirects.json',
	'edgeone.json',
]

const forbiddenPatterns = [
	[/zhilu\.(site|cyou)/, '上游作者域名'],
	[/L33Z22L11/, '上游作者账号'],
	[/169994096/, '上游交流群号'],
	[/a1997c81-a42b-46f6-8d1d-8fbd67a8ef41/, '上游统计 ID'],
	[/97a4fe32ed8240ac8284e9bffaf03962/, '上游 Insights Token'],
	[/weavatar\.com/, '上游头像服务'],
	[/twikoo\.zhilu\.site/, '上游评论服务'],
	[/陕ICP备/, '上游备案号'],
]

const forbiddenImportPatterns = [
	[/['"]~~?\/blog\.config['"]/, 'blog.config 引用'],
	[/['"]~~?\/feeds['"]/, 'feeds 数据引用'],
	[/['"]~~?\/content\.config['"]/, 'content.config 引用'],
	[/['"]~~?\/redirects\.json['"]/, 'redirects 引用'],
]

/** 允许出现上游标识的文件（署名、同步元数据与检测规则本体） */
const attributionAllowList = new Set([
	'LICENSE',
	'README.md',
	'package.json',
	'sync-manifest.json',
	'scripts/verify-theme.mjs',
])

const ignoredDirs = new Set(['node_modules', '.git', '.nuxt', '.output', '.data', 'dist'])
const sourceExtensions = new Set(['.ts', '.mts', '.js', '.mjs', '.vue', '.scss', '.css', '.json', '.md', '.svg'])
const errors = []

for (const file of forbiddenFiles) {
	if (exists(join(themeDir, file))) {
		errors.push(`站点文件泄漏：${file}`)
	}
}

walk(themeDir)

if (errors.length) {
	console.error(`✖ clarity-theme 验证失败（${errors.length} 个问题）：`)
	for (const error of errors) {
		console.error(`  - ${error}`)
	}
	process.exit(1)
}
console.log('✔ clarity-theme 提纯验证通过：无作者信息泄漏、无站点文件、无跨项目路径引用')

function walk(dir) {
	for (const entry of readdirSync(dir)) {
		if (ignoredDirs.has(entry)) {
			continue
		}
		const fullPath = join(dir, entry)
		if (statSync(fullPath).isDirectory()) {
			walk(fullPath)
			continue
		}
		if (!sourceExtensions.has(extname(entry))) {
			continue
		}
		const relPath = relative(themeDir, fullPath).replaceAll('\\', '/')
		const content = readFileSync(fullPath, 'utf8')

		if (!attributionAllowList.has(relPath)) {
			for (const [pattern, label] of forbiddenPatterns) {
				if (pattern.test(content)) {
					errors.push(`${relPath} 含${label} ${pattern}`)
				}
			}
		}
		for (const [pattern, label] of forbiddenImportPatterns) {
			if (pattern.test(content)) {
				errors.push(`${relPath} 含跨项目路径引用（${label}）`)
			}
		}
	}
}

function exists(path) {
	try {
		statSync(path)
		return true
	}
	catch {
		return false
	}
}

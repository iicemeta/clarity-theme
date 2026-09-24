#!/usr/bin/env node
/**
 * Clarity Theme 提纯验证（sync:verify 的一部分）
 *
 * 边界原则（2026-09 upstream parity reset 后）：
 * 1. 上游同步面（identical / mechanical / bugfix，见 tests/upstream-parity.manifest.json
 *    与 pnpm test:upstream-parity）中的上游作者硬编码内容（交流群、更新日志、
 *    反镜像黑名单等）由 parity 门禁保证与上游一致，不在本脚本重复检查；
 * 2. Theme 自有边界文件（boundary：config / modules / 兼容层）不得出现上游个人信息；
 * 3. 站点内容文件（content/、feeds 数据、redirects 等）与根目录消费项目文件不得进入仓库；
 * 4. Theme 基础设施（src/config、clarity-config / clarity-source-layout 模块）不得
 *    直接引用消费项目路径（~~/blog.config 等），必须经由别名与适配层。
 */
import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { extname, join, relative } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const themeDir = fileURLToPath(new URL('..', import.meta.url))

const parityClasses = JSON.parse(execFileSync(
	process.execPath,
	[join(themeDir, 'scripts/test-upstream-parity.mjs'), '--list-json'],
	{ encoding: 'utf8', maxBuffer: 1024 * 1024 * 16 },
))

const forbiddenFiles = [
	'content',
	'src/feeds.ts',
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

/** Theme 基础设施中不允许出现消费项目路径引用（上游同步面除外） */
const infraImportPatterns = [
	[/['"]~~?\/blog\.config['"]/, 'blog.config 引用'],
	[/['"]~~?\/feeds['"]/, 'feeds 数据引用'],
	[/['"]~~?\/content\.config['"]/, 'content.config 引用'],
	[/['"]~~?\/redirects\.json['"]/, 'redirects 引用'],
]

const infraPathPrefixes = [
	'src/config/',
	'src/img/',
	'src/modules/clarity-config/',
	'src/modules/clarity-source-layout/',
	'nuxt.config.ts',
]

/** 允许出现上游标识的文件（署名、同步元数据与检测规则本体）；其 *.zh-CN.md 译本同样允许携带署名 */
const attributionAllowList = new Set([
	'LICENSE',
	'README.md',
	'CHANGELOG.md',
	'docs/',
	'package.json',
	'sync-manifest.json',
	'skills/',
	'scripts/test-consumer.mjs',
	'scripts/release-check.mjs',
	'scripts/verify-theme.mjs',
	'tests/',
])

const ignoredDirs = new Set(['node_modules', '.git', '.nuxt', '.output', '.data', 'dist', '.test-consumer'])
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
console.log('✔ clarity-theme 提纯验证通过：边界文件无作者信息泄漏、无站点文件、Theme 基础设施无跨项目路径引用')

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

		// 将 <name>.zh-CN.md 译本归一化为对应英文原文路径：
		// 译文与原文携带相同的合法署名，不应因语言版本不同而失败。
		const attributionPath = relPath.replace(/\.zh-CN\.md$/, '.md')
		const isAttributionAllowed = [...attributionAllowList].some(allowed =>
			attributionPath === allowed || attributionPath.startsWith(allowed),
		)
		const parityClass = parityClasses[relPath]
		const isUpstreamSynced = parityClass === 'identical' || parityClass === 'mechanical' || parityClass === 'bugfix'

		if (!isAttributionAllowed && !isUpstreamSynced) {
			for (const [pattern, label] of forbiddenPatterns) {
				if (pattern.test(content)) {
					errors.push(`${relPath} 含${label} ${pattern}`)
				}
			}
		}
		// clarity-config 模块本身就是别名注册点（~~/blog.config / ~/feeds 的键名），
		// 其内容由 upstream parity boundary hash 锁定，这里不重复检查。
		const isAliasRegistrar = relPath === 'src/modules/clarity-config/index.ts'
		if (!isAliasRegistrar && infraPathPrefixes.some(prefix => relPath.startsWith(prefix) || relPath === prefix)) {
			for (const [pattern, label] of infraImportPatterns) {
				if (pattern.test(content)) {
					errors.push(`${relPath} 含跨项目路径引用（${label}）；Theme 基础设施必须经由 #clarity/* 别名或 src/blog.config.ts 适配层`)
				}
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

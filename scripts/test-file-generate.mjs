#!/usr/bin/env node
/**
 * File-install Static Generation Test（repair phase 2 回归）
 *
 * 覆盖与 test:consumer（tarball 安装）互补的第三种安装形态：
 *
 *   clarity-theme 源目录 → pnpm file: 目录安装 → nuxt generate → 页面级断言
 *
 * 背景：审计期在 file: consumer 上观察到「generate exit 0 但无预渲染页面」。
 * 该症状在受控环境中未复现（根因见 docs/history/repair-phase-2），但必须
 * 用回归测试把契约钉死：真实 file: 安装的静态生成必须产出实际页面，
 * 且构建期生成数据只写入 buildDir、绝不写入安装包内部（pnpm store 污染源）。
 */
import { Buffer } from 'node:buffer'
import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const themeDir = fileURLToPath(new URL('..', import.meta.url))
const keep = process.argv.includes('--keep')
const workDir = keep
	? resolve(themeDir, '.test-file-generate')
	: join(tmpdir(), `clarity-file-gen-${Date.now()}`)
const failures = []

function assert(label, ok, detail = '') {
	if (ok) {
		console.log(`  ✓ ${label}`)
	}
	else {
		failures.push(label)
		console.error(`  ✕ ${label}${detail ? `（${detail}）` : ''}`)
	}
}

function run(label, cwd, args, env = {}) {
	const command = [label, ...args].map(a => /[\s"^]/.test(a) ? `"${a.replaceAll('"', '""')}"` : a).join(' ')
	execSync(command, {
		cwd,
		stdio: 'inherit',
		env: { ...process.env, NUXT_TELEMETRY_DISABLED: '1', ...env },
	})
}

function writeConsumerProject(dir) {
	const files = {
		'package.json': JSON.stringify({
			name: 'clarity-file-generate-consumer',
			private: true,
			type: 'module',
			packageManager: 'pnpm@12.4.1',
			scripts: { generate: 'nuxt generate' },
			devDependencies: {
				'clarity-theme': `file:${themeDir.replaceAll('\\', '/')}`,
				'nuxt': '^4.5.2',
				'typescript': '^6.0.3',
				'vue': '^3.5.42',
				'vue-router': '^5.3.1',
				'@nuxt/content': '^3.16.0',
				'zod': '^4.5.4',
			},
		}, null, '\t'),
		'pnpm-workspace.yaml': [
			'allowBuilds:',
			'  \'@parcel/watcher\': true',
			'  esbuild: true',
			'  oxc-resolver: true',
			'  rolldown: true',
			'  sharp: true',
			'  unrs-resolver: true',
		].join('\n'),
		'tsconfig.json': JSON.stringify({
			references: [
				{ path: './.nuxt/tsconfig.app.json' },
				{ path: './.nuxt/tsconfig.server.json' },
				{ path: './.nuxt/tsconfig.shared.json' },
				{ path: './.nuxt/tsconfig.node.json' },
			],
			files: [],
		}, null, '	'),
		'nuxt.config.ts': 'export default defineNuxtConfig({ extends: [\'clarity-theme\'] })\n',
		'clarity.config.ts': [
			'import { defineClarityConfig } from \'clarity-theme/config\'',
			'',
			'export default defineClarityConfig({',
			'\tsite: {',
			'\t\ttitle: \'File Generate Consumer\',',
			'\t\tdescription: \'file: install static generation regression.\',',
			'\t\turl: \'https://file-gen.clarity-test.example/\',',
			'\t\tlanguage: \'zh-CN\',',
			'\t\ttimezone: \'Asia/Shanghai\',',
			'\t\testablished: \'2026-09-24\',',
			'\t\tauthor: { name: \'FileGen\' },',
			'\t},',
			'})',
			'',
		].join('\n'),
		'content.config.ts': [
			'import { createClarityContentConfig } from \'clarity-theme/content\'',
			'import clarityConfig from \'./clarity.config\'',
			'',
			'export default createClarityContentConfig(clarityConfig)',
			'',
		].join('\n'),
		'content/posts/hello.md': [
			'---',
			'title: Hello File Generate',
			'description: Article route for prerender assertions.',
			'date: 2026-09-24 09:00',
			'tags:',
			'  - regression',
			'type: tech',
			'---',
			'',
			'Article body for the file: install generate regression.',
			'',
		].join('\n'),
		'public/favicon.svg': readFileSync(join(themeDir, 'playground/public/favicon.svg'), 'utf8'),
	}
	for (const [path, content] of Object.entries(files)) {
		const abs = join(dir, path)
		mkdirSync(resolve(abs, '..'), { recursive: true })
		writeFileSync(abs, content)
	}
}

async function main() {
	console.log(`▶ File-install Static Generation Test\n  工作目录：${workDir}\n`)

	try {
		// [1] 组装 consumer 并以 file: 目录安装（不经 pnpm pack，直接目录引用）
		mkdirSync(workDir, { recursive: true })
		writeConsumerProject(workDir)
		run('pnpm', workDir, ['install', '--no-frozen-lockfile'])
		const themeInstallDir = join(workDir, 'node_modules', 'clarity-theme')
		assert('file: 安装主题可解析', existsSync(join(themeInstallDir, 'nuxt.config.ts')))

		// [2] 静态生成（Phase 2 主体）
		run('pnpm', workDir, ['generate'])

		// [3] 页面级断言：不是 exit code，而是真实 HTML 产物
		const publicDir = join(workDir, '.output', 'public')
		assert('generate 产出 .output/public', existsSync(publicDir) && statSync(publicDir).isDirectory())
		const htmlCount = collectHtml(publicDir).length
		assert('HTML 页面数量 > 5', htmlCount > 5, `实际 ${htmlCount}`)
		// GITHUB_ACTIONS 等平台下上游 nitro 配置启用 autoSubfolderIndex: false，
		// 页面产物为扁平 X.html 而非 X/index.html，两种布局都视为合法
		for (const [label, route] of [
			['首页 /', ''],
			['/link', 'link'],
			['/archive', 'archive'],
			['文章页', 'hello'],
		]) {
			assert(`${label} 存在静态 HTML`, pageExists(publicDir, route))
		}
		assert('200.html 存在', existsSync(join(publicDir, '200.html')))
		assert('404.html 存在', existsSync(join(publicDir, '404.html')))
		const index = existsSync(join(publicDir, 'index.html'))
			? readFileSync(join(publicDir, 'index.html'), 'utf8')
			: ''
		assert('首页注入站点标题', index.includes('File Generate Consumer'))
		assert('首页注入 anti-mirror 黑名单（blog.config 数据模块经 buildDir 生效）', index.includes(Buffer.from('dgjlx.com').toString('base64')))
		assert('atom.xml 生成', existsSync(join(publicDir, 'atom.xml')))
		assert('api/stats 生成', existsSync(join(publicDir, 'api/stats')) || existsSync(join(publicDir, 'api/stats.json')))

		// [4] 包边界断言：构建期生成数据绝不写入安装包内部（store 污染源）
		assert('安装包内部无 generated 写入', !existsSync(join(themeInstallDir, 'src', 'generated')))
		assert('生成模块位于 buildDir（.nuxt 或 node_modules/.cache/nuxt 形态）', existsSync(join(workDir, '.nuxt/clarity/package-json.mjs')) || existsSync(join(workDir, 'node_modules/.cache/nuxt/.nuxt/clarity/package-json.mjs')))

		console.log(failures.length ? `\n✖ File-install generate 失败` : '\n✔ File-install generate 通过')
		if (failures.length) {
			process.exitCode = 1
		}
	}
	catch (error) {
		console.error('\n✖ File-install generate 失败')
		console.error(error)
		process.exitCode = 1
	}
	finally {
		if (!keep && process.exitCode !== 1) {
			try {
				rmSync(workDir, { recursive: true, force: true })
			}
			catch {
				console.warn(`清理临时目录失败（已忽略）：${workDir}`)
			}
		}
		else if (process.exitCode === 1) {
			console.error(`调试目录已保留：${workDir}`)
		}
	}
}

function pageExists(publicDir, route) {
	return existsSync(join(publicDir, route, 'index.html'))
		|| existsSync(join(publicDir, `${route}.html`))
		|| (route === '' && existsSync(join(publicDir, 'index.html')))
}

function collectHtml(dir, acc = []) {
	if (!existsSync(dir)) {
		return acc
	}
	for (const name of readdirSync(dir)) {
		const abs = join(dir, name)
		if (statSync(abs).isDirectory()) {
			if (name === '_nuxt') {
				continue
			}
			collectHtml(abs, acc)
		}
		else if (name.endsWith('.html')) {
			acc.push(abs)
		}
	}
	return acc
}

await main()

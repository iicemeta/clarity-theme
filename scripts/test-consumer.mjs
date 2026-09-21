#!/usr/bin/env node
/**
 * Real Consumer Test（devdoc2.0 §16 / Phase D）
 *
 * 验证 clarity-theme 作为真实 npm 包（tarball）可被独立消费项目安装并 generate：
 *
 *   clarity-theme → pnpm pack → <tmp>/consumer → pnpm add .tgz → nuxt generate
 *
 * 与 playground（workspace 链接）互补，专门暴露 npm 包层面的问题：
 * files 字段缺失、依赖声明缺失（如 sass）、exports 路径错误等。
 */
import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const themeDir = fileURLToPath(new URL('..', import.meta.url))
const keep = process.argv.includes('--keep')
const workDir = keep
	? resolve(themeDir, '.test-consumer')
	: join(tmpdir(), `clarity-consumer-${Date.now()}`)

console.log(`▶ Real Consumer Test\n  工作目录：${workDir}\n`)

try {
	// ---- 1. 打包 ----
	console.log('▶ [1/5] pnpm pack')
	const tarball = execSync('pnpm pack --pack-destination .', { cwd: themeDir, encoding: 'utf8' }).trim().split('\n').pop()
	const tarballPath = resolve(themeDir, tarball)
	console.log(`  ✓ ${tarball}`)

	mkdirSync(workDir, { recursive: true })
	const consumerDir = join(workDir, 'consumer')
	mkdirSync(consumerDir)

	// ---- 2. 最小消费项目 ----
	console.log('▶ [2/5] 生成最小消费项目')
	writeFiles(consumerDir, {
		'package.json': JSON.stringify({
			name: 'clarity-consumer-test',
			private: true,
			type: 'module',
			scripts: { generate: 'nuxt generate' },
			devDependencies: {
				'clarity-theme': `file:${tarballPath.replaceAll('\\', '/')}`,
				'nuxt': '^4.5.2',
				'vue': '^3.5.42',
			},
		}, null, '\t'),

		// pnpm 需要放行构建脚本（与真实站点一致）
		'pnpm-workspace.yaml': [
			'allowBuilds:',
			'  \'@parcel/watcher\': true',
			'  esbuild: true',
			'  oxc-resolver: true',
			'  rolldown: true',
			'  sharp: true',
			'  unrs-resolver: true',
			'  vue-demi: true',
		].join('\n'),

		'nuxt.config.ts': `export default defineNuxtConfig({
	extends: ['clarity-theme'],
})`,

		'clarity.config.ts': `import { defineClarityConfig } from 'clarity-theme/config'

export default defineClarityConfig({
	site: {
		title: 'Consumer Test',
		description: 'Real npm package consumer verification.',
		url: 'https://consumer.example.com/',
		established: '2026-09-21',
		favicon: '/favicon.svg',
		author: { name: 'Consumer' },
	},
	article: {
		categories: {
			技术: { icon: 'tabler:code' },
		},
	},
})`,

		'content.config.ts': `import { createClarityContentConfig } from 'clarity-theme/content'
import clarityConfig from './clarity.config'

export default createClarityContentConfig(clarityConfig)`,

		'feeds.ts': `export default []`,

		'app/app.config.ts': `export default defineAppConfig({
	clarity: {
		header: { emojiTail: ['🧪'] },
	},
})`,

		'content/posts/first.md': `---
title: Consumer 首篇文章
description: 验证 npm tarball 安装后的内容渲染。
date: 2026-09-21 10:00
categories: [技术]
---

行内代码 \`clarity.config.ts\` 与 fenced code：

\`\`\`ts
const answer = 42
\`\`\`
`,

		'public/favicon.svg': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><rect width="16" height="16" fill="#41b883"/></svg>\n',
	})
	console.log('  ✓ clarity.config.ts / content.config.ts / feeds.ts / 文章 / UI 覆盖')

	// ---- 3. 安装 ----
	console.log('▶ [3/5] pnpm install（独立目录，非 workspace）')
	execSync('pnpm install --no-frozen-lockfile', { cwd: consumerDir, stdio: 'inherit' })

	// ---- 4. 生成 ----
	console.log('▶ [4/5] nuxt generate')
	execSync('pnpm exec nuxt generate', { cwd: consumerDir, stdio: 'inherit' })

	// ---- 5. 断言 ----
	console.log('▶ [5/5] 输出断言')
	const output = join(consumerDir, '.output', 'public')
	const index = readFileSync(join(output, 'index.html'), 'utf8')
	const post = readFileSync(join(output, 'first', 'index.html'), 'utf8')
	const atom = readFileSync(join(output, 'atom.xml'), 'utf8')

	assert('站点标题注入', index.includes('Consumer Test'))
	assert('inline code 渲染', post.includes('clarity.config.ts'))
	assert('文章路由生成', existsSync(join(output, 'first', 'index.html')))
	assert('atom.xml 站点配置', atom.includes('https://consumer.example.com/'))
	assert('atom.xml 文章标题', atom.includes('Consumer 首篇文章'))
	assert('UI 覆盖生效（emojiTail）', index.includes('🧪'))

	console.log('\n✔ Real Consumer Test 通过：npm tarball 可安装、可 generate、渲染正常')
}
catch (error) {
	console.error('\n✖ Real Consumer Test 失败')
	console.error(`  调试目录已保留：${workDir}`)
	process.exitCode = 1
	throw error
}
finally {
	// 清理仓库根目录中的 tarball
	for (const file of execSync('pnpm pack --pack-destination . --dry-run 2>&1 || true', { cwd: themeDir, encoding: 'utf8' }).match(/clarity-theme-[\d.]+\.tgz/g) ?? []) {
		rmSync(resolve(themeDir, file), { force: true })
	}
	if (!keep && process.exitCode !== 1) {
		rmSync(workDir, { recursive: true, force: true })
	}
}

function writeFiles(dir, files) {
	for (const [path, content] of Object.entries(files)) {
		const fullPath = join(dir, path)
		mkdirSync(join(fullPath, '..'), { recursive: true })
		writeFileSync(fullPath, content)
	}
}

function assert(name, ok) {
	if (!ok) {
		throw new Error(`断言失败：${name}`)
	}
	console.log(`  ✓ ${name}`)
}

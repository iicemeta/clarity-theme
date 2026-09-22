#!/usr/bin/env node
/**
 * Registry Consumer Test（仅在 npm 发布成功后运行）
 *
 * 与 test:consumer 的区别：
 * - 不使用本地 tarball，直接从 npm registry 安装 clarity-theme@<version>
 * - 验证 Workspace → Tarball → Registry 三层消费链路的最后一环
 *
 * 用法：
 *   pnpm test:registry-consumer                  # 使用 package.json 中的版本
 *   pnpm test:registry-consumer -- 0.1.0         # 显式指定已发布版本
 */
import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const themeDir = fileURLToPath(new URL('..', import.meta.url))
const themePkg = JSON.parse(readFileSync(join(themeDir, 'package.json'), 'utf8'))
const versionArg = process.argv.find(arg => /^\d+\.\d+\.\d+/.test(arg))
const version = versionArg ?? themePkg.version
const spec = `clarity-theme@${version}`
const workDir = join(tmpdir(), `clarity-registry-consumer-${Date.now()}`)

function run(command, cwd) {
	console.log(`  $ ${command}`)
	execSync(command, {
		cwd,
		stdio: 'inherit',
		env: { ...process.env, NUXT_TELEMETRY_DISABLED: '1' },
	})
}

function assert(name, ok, detail = '') {
	if (!ok)
		throw new Error(`断言失败：${name}${detail ? `（${detail}）` : ''}`)
	console.log(`  ✓ ${name}${detail ? `（${detail}）` : ''}`)
}

console.log(`▶ Registry Consumer Test\n  包：${spec}\n  工作目录：${workDir}\n`)

try {
	// [1] registry 中确实存在该版本
	const published = JSON.parse(execSync(`npm view ${spec} --json`, { encoding: 'utf8' }))
	assert('npm registry 存在该版本', published.version === version, `${published.name}@${published.version}`)
	assert('tarball 来源为 registry', String(published.dist.tarball).startsWith('https://registry.npmjs.org/'))

	// [2] 独立 consumer 项目（不含本地 tarball）
	mkdirSync(workDir, { recursive: true })
	writeConsumerProject(workDir)

	// [3] 从 registry 安装
	run('pnpm install --no-frozen-lockfile', workDir)
	const lockfile = readFileSync(join(workDir, 'pnpm-lock.yaml'), 'utf8')
	const lockEntry = lockfile.split('\n').find(line => line.trim().startsWith('clarity-theme@'))
	assert(
		'安装来自 registry（lockfile 记录 registry integrity 而非 file:/link: 引用）',
		Boolean(lockEntry?.includes(`clarity-theme@${version}:`)) && !lockfile.includes('clarity-theme@file:') && !lockfile.includes('clarity-theme@link:'),
		lockEntry?.trim() ?? '(lockfile 未记录 clarity-theme)',
	)

	// [4] exports 冒烟
	run('node exports-smoke.mjs', workDir)

	// [5] 类型检查
	run('pnpm exec nuxt typecheck', workDir)

	// [6] 静态生成
	run('pnpm exec nuxt generate', workDir)

	// [7] 产物断言
	const output = join(workDir, '.output', 'public')
	assert('generate 产出 .output/public', existsSync(output))
	const index = readFileSync(join(output, 'index.html'), 'utf8')
	assert('站点标题渲染', index.includes('Registry Consumer'))
	assert('Layer 组件渲染', index.includes('blog-root') || index.includes('article'))
	const atom = readFileSync(join(output, 'atom.xml'), 'utf8')
	assert('Atom 输出', atom.includes('https://registry-consumer.example.com/'))
	assert('Atom 使用 registry 包版本', atom.includes(themePkg.name))
	const stats = JSON.parse(readFileSync(join(output, 'api/stats'), 'utf8'))
	assert('Stats 输出', stats.total?.posts === 1, `posts=${stats.total?.posts}`)

	console.log(`\n✔ Registry Consumer Test 通过：${spec} 可从 npm registry 安装、构建并渲染`)
}
catch (error) {
	console.error('\n✖ Registry Consumer Test 失败')
	console.error(`  调试目录已保留：${workDir}`)
	console.error(error)
	process.exitCode = 1
}
finally {
	if (!process.exitCode) {
		rmSync(workDir, { recursive: true, force: true })
	}
}

function writeConsumerProject(dir) {
	writeFile(join(dir, 'package.json'), JSON.stringify({
		name: 'clarity-registry-consumer',
		private: true,
		type: 'module',
		scripts: {
			typecheck: 'nuxt typecheck',
			generate: 'nuxt generate',
		},
		devDependencies: {
			'@nuxt/content': '^3.16.0',
			'nuxt': '^4.5.2',
			'typescript': '^6.0.3',
			'vue': '^3.5.42',
			'vue-router': '^5.3.1',
			'vue-tsc': '^3.1.4',
			'zod': '^4.5.4',
		},
		dependencies: {
			'clarity-theme': version,
		},
	}, null, '\t'))

	writeFile(join(dir, 'pnpm-workspace.yaml'), [
		'allowBuilds:',
		'  \'@parcel/watcher\': true',
		'  esbuild: true',
		'  oxc-resolver: true',
		'  rolldown: true',
		'  sharp: true',
		'  unrs-resolver: true',
		'  vue-demi: true',
	].join('\n'))

	writeFile(join(dir, 'nuxt.config.ts'), `export default defineNuxtConfig({
extends: ['clarity-theme'],
})
`)

	// nuxt typecheck 需要根 tsconfig 指向 .nuxt 生成的 project references
	writeFile(join(dir, 'tsconfig.json'), JSON.stringify({
		files: [],
		references: [
			{ path: './.nuxt/tsconfig.app.json' },
			{ path: './.nuxt/tsconfig.server.json' },
			{ path: './.nuxt/tsconfig.shared.json' },
			{ path: './.nuxt/tsconfig.node.json' },
		],
	}, null, '\t'))

	writeFile(join(dir, 'clarity.config.ts'), `import { defineClarityConfig } from 'clarity-theme/config'

export default defineClarityConfig({
	site: {
		title: 'Registry Consumer',
		description: 'Clarity Theme npm registry consumer verification.',
		url: 'https://registry-consumer.example.com/',
		author: { name: 'Registry Consumer' },
	},
})
`)

	writeFile(join(dir, 'content.config.ts'), `import { createClarityContentConfig } from 'clarity-theme/content'
import clarityConfig from './clarity.config'

export default createClarityContentConfig(clarityConfig)
`)

	writeFile(join(dir, 'feeds.ts'), `import type { FeedGroup } from 'clarity-theme/config'

const feeds: FeedGroup[] = []

export default feeds
`)

	writeFile(join(dir, 'content/posts/first.md'), `---
title: Registry Consumer 基准
description: 验证 registry 安装的真实包。
date: 2026-09-22 10:00
categories: [技术]
---

来自 npm registry 的 Clarity Theme 渲染基准。
`)

	writeFile(join(dir, 'exports-smoke.mjs'), `import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const failures = []
for (const spec of ['clarity-theme', 'clarity-theme/config', 'clarity-theme/content', 'clarity-theme/schema', 'clarity-theme/img']) {
	try {
		const resolved = import.meta.resolve(spec)
		const ok = resolved.startsWith('file://') && existsSync(fileURLToPath(resolved))
		console.log(\`  \${ok ? '✓' : '✕'} \${spec} 可解析\`)
		if (!ok) failures.push(spec)
	}
catch {
		console.log(\`  ✕ \${spec} 可解析\`)
		failures.push(spec)
	}
}
if (failures.length) {
	console.error(\`exports smoke 失败：\${failures.join('、')}\`)
	process.exit(1)
}
console.log('exports smoke 全部通过')
`)
}

function writeFile(path, content) {
	mkdirSync(join(path, '..'), { recursive: true })
	writeFileSync(path, content)
}

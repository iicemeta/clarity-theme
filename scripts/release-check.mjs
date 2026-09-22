#!/usr/bin/env node
/**
 * Release Check（npm 发布前最终门禁）
 *
 * 串行检查：
 *  1. package.json 存在且 name/version 合法（SemVer）
 *  2. 当前 Git tag 与 package.version 一致（v${version}；不一致直接非零退出）
 *  3. README / CHANGELOG 含当前 release 信息
 *  4. exports / files / engines / peerDependencies 契约完整
 *  5. pnpm pack 成功，tarball 边界与 test-consumer 的发布白名单一致
 *  6. 不包含内容目录 / 开发资产 / 站点配置 / secrets / 上游私密标识
 *
 * 用法：
 *   node scripts/release-check.mjs                    # 发布 tag 检出（要求 tag 匹配）
 *   node scripts/release-check.mjs --allow-untagged   # 发布前本地验证（未打 tag 时显式放行 tag 检查）
 */
import { execSync, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const themeDir = fileURLToPath(new URL('..', import.meta.url))
const pkgPath = join(themeDir, 'package.json')
const allowUntagged = process.argv.includes('--allow-untagged')

const failures = []
const notes = []

function check(name, ok, detail = '') {
	if (ok) {
		console.log(`  ✓ ${name}${detail ? `（${detail}）` : ''}`)
	}
	else {
		failures.push(name)
		console.error(`  ✕ ${name}${detail ? `（${detail}）` : ''}`)
	}
}

function git(args) {
	return spawnSync('git', args, { cwd: themeDir, encoding: 'utf8' }).stdout?.trim() ?? ''
}

/** 与 scripts/test-consumer.mjs 保持同一发布边界口径 */
const allowedRootFiles = new Set([
	'LICENSE',
	'README.md',
	'README.zh-CN.md',
	'package.json',
	'nuxt.config.ts',
])
const allowedDirs = ['app/', 'config/', 'img/', 'modules/', 'public/', 'remark-plugins/', 'server/', 'shared/']

const requiredFiles = [
	'LICENSE',
	'README.md',
	'package.json',
	'nuxt.config.ts',
	'app/shiki.config.ts',
	'config/index.ts',
	'config/index.d.mts',
	'config/index.mjs',
	'config/define.ts',
	'config/define.mjs',
	'config/content.ts',
	'config/content.d.mts',
	'config/content.mjs',
	'config/schema.ts',
	'config/schema.d.mts',
	'config/schema.mjs',
	'config/server.ts',
	'img/index.ts',
	'img/index.d.mts',
	'img/index.mjs',
	'modules/clarity-config/index.ts',
	'remark-plugins/remark-code-component.mjs',
	'remark-plugins/rehype-meta-slots.mjs',
	'public/assets/atom.xsl',
	'public/assets/atom.css',
	'public/fonts/AlimamaFangYuanTi.woff2',
	'server/api/stats.get.ts',
	'server/utils/clarity.ts',
	'server/routes/atom.xml.get.ts',
	'server/routes/subscriptions.opml.get.ts',
]

const forbiddenPathRules = [
	[/^content\//, '内容目录'],
	[/^playground\//, 'playground 示例'],
	[/^docs\/|^tests\/|^scripts\/|^\.github\/|^\.agents\//, '开发资产'],
	[/^clarity\.config\.(ts|mjs|js)$/, '站点配置'],
	[/^feeds\.(ts|mjs|js)$/, '友链数据'],
	[/^(redirects\.json|edgeone\.json|sync-manifest\.json)$/, '站点/同步配置'],
	[/\.env/i, '环境变量文件'],
	[/\.(pem|key)$/i, '私钥文件'],
	[/[\w-]*(?:secret|token|credential|password)[\w-]*\.(?:json|ya?ml|txt|env|pem|key|ts|mts|cts|mjs|cjs|js)$/i, '疑似密钥文件'],
	[/\.(sqlite\d?|db)$/, '内容数据库'],
	[/^\.data\//, '内容数据库目录'],
	[/\/?(node_modules|\.git|\.nuxt|\.output|dist)\//, '构建/依赖目录'],
	[/\.tgz$/, '嵌套 tarball'],
	[/^(pnpm-lock\.yaml|pnpm-workspace\.yaml)$/, 'Theme 开发环境文件'],
]

const forbiddenContentRules = [
	[/zhilu\.(site|cyou)/, '上游作者域名'],
	[/L33Z22L11/, '上游作者账号'],
	[/169994096/, '上游交流群号'],
	[/a1997c81-a42b-46f6-8d1d-8fbd67a8ef41/, '上游统计 ID'],
	[/97a4fe32ed8240ac8284e9bffaf03962/, '上游 Insights Token'],
	[/twikoo\.zhilu\.site/, '上游评论服务'],
	[/陕ICP备/, '上游备案号'],
]

const attributionAllowList = new Set(['LICENSE', 'README.md', 'README.zh-CN.md', 'package.json'])
const auditableExtensions = new Set(['.ts', '.mts', '.cts', '.mjs', '.cjs', '.js', '.json', '.md', '.vue', '.scss', '.css', '.svg', '.xsl', '.xml', '.html', '.txt'])

console.log('▶ Release Check（npm 发布门禁）\n')

// ---------------------------------------------------------------------------
// [1] package.json 基础契约
// ---------------------------------------------------------------------------
console.log('[1/6] package.json 契约')
check('package.json 存在', existsSync(pkgPath))
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
check('npm package name 非空', typeof pkg.name === 'string' && pkg.name.length > 0, pkg.name)
check('package.name = clarity-theme', pkg.name === 'clarity-theme')

const semver = /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-(?:0|[1-9]\d*|\d*[a-z-][0-9a-z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-z-][0-9a-z-]*))*)?(?:\+[0-9a-z-]+(?:\.[0-9a-z-]+)*)?$/i
check('package.version 是合法 SemVer', semver.test(pkg.version ?? ''), pkg.version)
check('type = module', pkg.type === 'module')
check('main = ./nuxt.config.ts', pkg.main === './nuxt.config.ts')
check('publishConfig.access = public', pkg.publishConfig?.access === 'public')
check('engines.node 已声明', typeof pkg.engines?.node === 'string' && pkg.engines.node.length > 0, pkg.engines?.node)
check(
	'peerDependencies 覆盖 nuxt 与 vue',
	Boolean(pkg.peerDependencies?.nuxt) && Boolean(pkg.peerDependencies?.vue),
	`nuxt ${pkg.peerDependencies?.nuxt} / vue ${pkg.peerDependencies?.vue}`,
)
check('packageManager 已声明（pnpm）', /^pnpm@\d/.test(pkg.packageManager ?? ''), pkg.packageManager)

// ---------------------------------------------------------------------------
// [2] Git tag / version 契约（tag/version mismatch 直接拒绝）
// ---------------------------------------------------------------------------
console.log('[2/6] Git tag / version 契约')
const expectedTag = `v${pkg.version}`
const headTags = git(['tag', '--points-at', 'HEAD']).split('\n').filter(Boolean)
if (headTags.length > 0) {
	check(
		`HEAD tag 与 package.version 一致（${expectedTag}）`,
		headTags.includes(expectedTag),
		`HEAD tags: ${headTags.join(', ')}`,
	)
}
else if (allowUntagged) {
	notes.push(`HEAD 未打 tag：以 --allow-untagged 运行，正式发布前必须在发布 commit 上打 ${expectedTag}`)
	console.log(`  ⚠ HEAD 未打 tag（--allow-untagged 已放行；发布前必须为该 commit 打 ${expectedTag}）`)
}
else {
	check(`HEAD 已打 ${expectedTag}`, false, '当前 commit 没有 tag（发布前验证可使用 --allow-untagged）')
}

// ---------------------------------------------------------------------------
// [3] README / CHANGELOG release 信息
// ---------------------------------------------------------------------------
console.log('[3/6] Release 文档')
const changelogPath = join(themeDir, 'CHANGELOG.md')
check('CHANGELOG.md 存在', existsSync(changelogPath))
if (existsSync(changelogPath)) {
	const changelog = readFileSync(changelogPath, 'utf8')
	check(`CHANGELOG 含 ${pkg.version} 条目`, changelog.includes(`## ${pkg.version}`))
}
const readmePath = join(themeDir, 'README.md')
check('README.md 存在', existsSync(readmePath))
if (existsSync(readmePath)) {
	const readme = readFileSync(readmePath, 'utf8')
	check(
		'README 以 npm 包为正式安装方式',
		readme.includes(`pnpm add ${pkg.name}`) || readme.includes(`npm install ${pkg.name}`),
	)
}

// ---------------------------------------------------------------------------
// [4] exports / files 契约（工作区层面）
// ---------------------------------------------------------------------------
console.log('[4/6] exports / files 契约')
const expectedExports = ['.', './config', './content', './img', './schema']
check('exports 五个入口齐全', expectedExports.every(key => key in (pkg.exports ?? {})), expectedExports.join(' '))
for (const [key, entry] of Object.entries(pkg.exports ?? {})) {
	const conditions = typeof entry === 'string' ? { default: entry } : entry
	for (const [condition, target] of Object.entries(conditions)) {
		const file = target.replace(/^\.\//, '')
		check(`exports ${key} (${condition}) 指向的文件存在`, existsSync(join(themeDir, file)), file)
	}
}
for (const file of pkg.files ?? []) {
	const fullPath = join(themeDir, file)
	check(`files 条目存在：${file}`, existsSync(fullPath))
}

// ---------------------------------------------------------------------------
// [5] pnpm pack + [6] tarball 审计
// ---------------------------------------------------------------------------
console.log('[5/6] pnpm pack')
const workDir = join(tmpdir(), `clarity-release-check-${Date.now()}`)
mkdirSync(workDir, { recursive: true })
try {
	// pack 输出到临时目录，避免污染仓库根目录
	const packed = packTo(workDir)
	check('pnpm pack 生成 tarball', Boolean(packed), packed)

	console.log('[6/6] tarball 审计')
	const packageDir = join(workDir, 'package')
	execSync(`tar -xzf ${JSON.stringify(join(workDir, packed))} -C ${JSON.stringify(workDir)}`, { stdio: 'ignore' })
	const files = listFiles(packageDir).map(file => file.replaceAll('\\', '/')).sort()
	auditTarball(files, packageDir)

	notes.push(`tarball：${packed}（${files.length} 个文件）`)
}
finally {
	if (failures.length === 0)
		rmSync(workDir, { recursive: true, force: true })
	else
		notes.push(`审计目录已保留：${workDir}`)
}

console.log('\n──────────────────────────────')
if (failures.length > 0) {
	console.error(`✖ Release Check 失败（${failures.length} 项）：`)
	for (const failure of failures)
		console.error(`  - ${failure}`)
	process.exit(1)
}
console.log(`✔ Release Check 通过${pkg.version ? `：${pkg.name}@${pkg.version}` : ''}`)
for (const note of notes)
	console.log(`  · ${note}`)

// ---------------------------------------------------------------------------
// 工具函数
// ---------------------------------------------------------------------------

function packTo(destination) {
	execSync(`pnpm pack --pack-destination ${JSON.stringify(destination)}`, {
		cwd: themeDir,
		stdio: ['ignore', 'pipe', 'pipe'],
		env: { ...process.env, NUXT_TELEMETRY_DISABLED: '1' },
	})
	return readdirSync(destination).find(file => /^clarity-theme-.*\.tgz$/.test(file)) ?? ''
}

function auditTarball(files, packageDir) {
	let boundaryErrors = 0
	for (const file of files) {
		const inAllowedDir = allowedDirs.some(dir => file.startsWith(dir))
		if (!allowedRootFiles.has(file) && !inAllowedDir) {
			console.error(`  ✕ 越界文件：${file}`)
			boundaryErrors++
		}
		for (const [pattern, label] of forbiddenPathRules) {
			if (pattern.test(file)) {
				console.error(`  ✕ 禁止发布（${label}）：${file}`)
				boundaryErrors++
			}
		}
	}
	check('tarball 无越界 / 私密路径', boundaryErrors === 0, `${files.length} 个文件`)

	const missing = requiredFiles.filter(file => !files.includes(file))
	check('发布必需文件齐全', missing.length === 0, missing.length ? `缺失：${missing.join(', ')}` : `${requiredFiles.length} 个必需文件`)

	let leakErrors = 0
	for (const file of files) {
		const ext = file.slice(file.lastIndexOf('.'))
		if (!auditableExtensions.has(ext) || attributionAllowList.has(file))
			continue
		const content = stripComments(readFileSync(join(packageDir, file), 'utf8'))
		for (const [pattern, label] of forbiddenContentRules) {
			if (pattern.test(content)) {
				console.error(`  ✕ ${file} 含${label}`)
				leakErrors++
			}
		}
	}
	check('tarball 无上游私密标识', leakErrors === 0)
	check('tarball 不包含用户内容', !files.some(file => file.startsWith('content/') || file.startsWith('playground/')))
	check(
		'tarball 不包含用户站点配置',
		!files.some(file => /^clarity\.config\./.test(file) || /\.env/i.test(file) || /\.(?:pem|key)$/i.test(file)),
	)

	const tarballPkg = JSON.parse(readFileSync(join(packageDir, 'package.json'), 'utf8'))
	check('tarball package.name 一致', tarballPkg.name === pkg.name, tarballPkg.name)
	check('tarball package.version 一致', tarballPkg.version === pkg.version, tarballPkg.version)
	check(
		'tarball 依赖声明完整（runtime dependencies 非空）',
		Object.keys(tarballPkg.dependencies ?? {}).length > 0,
		`${Object.keys(tarballPkg.dependencies ?? {}).length} 个 runtime dependencies`,
	)
}

function stripComments(code) {
	return code
		.replace(/\/\*[\s\S]*?\*\//g, '')
		.replace(/^[ \t]*\/\/.*$/gm, '')
}

function listFiles(dir, base = dir) {
	const files = []
	for (const entry of readdirSync(dir)) {
		const fullPath = join(dir, entry)
		if (statSync(fullPath).isDirectory())
			files.push(...listFiles(fullPath, base))
		else
			files.push(fullPath.slice(base.length + 1))
	}
	return files
}

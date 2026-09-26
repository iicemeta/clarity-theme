#!/usr/bin/env node
/**
 * 上游同步器（devdoc2.0 Phase F）
 *
 * 模式：
 * - check   检查 upstream/main 是否有新 commit
 * - diff    对比基线与最新 commit 的文件变化，按 include / transform / manual 分类
 * - apply   将 include 类变更安全地应用到 Theme：
 *     · 上游新文件 → 复制
 *     · 本地文件与基线一致（未被 Theme 适配）→ 快进更新
 *     · 本地文件已被 Theme 适配（与基线有差异）→ 标记冲突，跳过并报告
 *     · 上游删除且本地未适配 → 删除；本地已适配 / 已删除 → 冲突
 *     · transform / manual 文件 → 永不自动覆盖，仅报告
 *     · 先应用并 verify，全部成功后才更新 sync-manifest.json 的基线
 * - verify  校验 manifest 基线状态 + 运行提纯验证
 *
 * 分类优先级：exclude > transform > manual > include > unknown。
 * 未知（unknown）变更会阻止 apply，避免未声明文件让基线静默前进。
 * apply 前要求 Theme 工作树干净（避免覆盖未提交修改）。
 *
 * 演练目标 ref：`--ref <branch>` 覆盖 manifest 的 upstream.branch，让一次演练可以
 * 针对任意上游 ref 运行（例如上游 dev 领先 main 时预演下一次 main 更新）。
 * 不传时行为与旧版完全一致。
 *
 * 与 parity manifest 的关系（tests/upstream-parity.manifest.json，单一事实来源）：
 * - `mechanical` 记录声明的机械替换在同步时**同样适用**：本地文件的期望内容 =
 *   上游基线内容 + 该记录声明的替换。只有本地正好等于这个期望内容才允许快进，
 *   写入时也把替换应用到上游新内容上。否则仍按冲突处理。
 *   没有这一步，任何声明过的机械文件只要上游一改就会被判为「本地已适配」而
 *   让整次 apply 全部回滚——这正是 Phase 6 演练发现的缺陷。
 * - `boundary` / `bugfix` 记录（带 upstream 字段者）单独报告为边界变更：既不自动
 *   覆盖也不静默忽略，仍然阻止基线前进，保留人工对照上游重构的机会。
 *
 * 路径映射：manifest.pathMap（upstream 前缀 → 本地前缀）在写入/比对本地文件时生效；
 * upstream app/* 对应本地 src/*（扁平化），modules/server/shared/public/remark-plugins
 * 对应 src/ 下同名目录。分类 glob 始终描述 upstream 路径，不因映射而改写。
 */
import { Buffer } from 'node:buffer'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, isAbsolute, join, relative, sep } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const themeDir = fileURLToPath(new URL('..', import.meta.url))
const manifestPath = join(themeDir, 'sync-manifest.json')
const parityPath = join(themeDir, 'tests', 'upstream-parity.manifest.json')
const manifest = readManifest(manifestPath)
const parityRecords = readParityRecords(parityPath)
const targetBranch = readArgValue('--ref') ?? manifest.upstream.branch
const modes = new Set(['check', 'diff', 'apply', 'verify'])
const mode = process.argv[2] ?? 'check'
const globRegexCache = new Map()

if (!modes.has(mode)) {
	console.error(`未知模式：${mode}（支持 check / diff / apply / verify）`)
	process.exit(1)
}

try {
	if (mode === 'verify') {
		if (!verify()) {
			process.exitCode = 1
		}
	}
	else {
		sync()
	}
}
catch (error) {
	console.error(`✖ 同步失败：${error.message}`)
	process.exitCode = 1
}

function sync() {
	const { repo } = manifest.upstream
	const baselineCommit = manifest.upstream.commit
	const head = remoteHead(repo, targetBranch)

	if (head === baselineCommit) {
		console.log(`✔ 上游已是最新：${short(baselineCommit)}`)
		return
	}

	console.log(`⚠ 上游有新提交：${short(baselineCommit)} → ${short(head)}`)

	if (mode === 'check') {
		// CI 中用 --fail-on-update 让「有更新」以非零码退出，便于 workflow 判断
		if (process.argv.includes('--fail-on-update')) {
			process.exitCode = 1
			return
		}
		console.log('运行 `node scripts/sync-upstream.mjs diff` 查看变更明细，或 `apply` 应用同步。')
		return
	}

	if (mode === 'apply' && git(['status', '--porcelain', '--untracked-files=all'], { cwd: themeDir, encoding: 'utf8' }).trim()) {
		throw new Error('apply 要求 Theme 工作树干净，请先提交或暂存（stash）本地修改。')
	}

	const tempDir = mkdtempSync(join(tmpdir(), 'clarity-sync-'))
	try {
		cloneAtCommit(repo, head, tempDir)
		assertCommitExists(baselineCommit, tempDir)

		const changes = parseNameStatus(git([
			'diff',
			'--find-renames',
			'--name-status',
			'-z',
			baselineCommit,
			head,
		], { cwd: tempDir }))
		const buckets = bucketChanges(changes)

		printSection('可直接同步（include）', buckets.include)
		printSection('派生文件（transform，需按上游变更重构 Theme 版本）', buckets.transform)
		printSection('需人工审查（manual）', buckets.manual)
		printSection('边界文件（boundary / bugfix，需人工对照上游，绝不自动覆盖）', buckets.boundary)
		printSection('已排除（exclude，忽略）', buckets.exclude)
		printSection('未分类（请更新 sync-manifest.json）', buckets.unknown)
		console.log(`\n共 ${changes.length} 个文件变更。`)

		if (mode === 'diff') {
			return
		}

		if (buckets.unknown.length) {
			throw new Error(`存在 ${buckets.unknown.length} 个未分类文件；请先更新 sync-manifest.json，基线保持 ${short(baselineCommit)}。`)
		}

		if (buckets.boundary.length) {
			throw new Error(`存在 ${buckets.boundary.length} 个边界文件的上游变更；请先人工对照上游重构 Theme 版本，基线保持 ${short(baselineCommit)}。`)
		}

		const { operations, conflicts } = buildOperations(changes, tempDir, head)
		if (conflicts.length) {
			console.error(`\n⚠ ${conflicts.length} 个文件被 Theme 适配过、上游又有变更，需手动合并（基线 ${short(baselineCommit)} → ${short(head)}）：`)
			for (const { path, reason } of conflicts) {
				console.error(`  ! ${path}${reason ? `（${reason}）` : ''}`)
			}
			console.error(`✖ 存在冲突，未应用任何 include 变更，基线保持 ${short(baselineCommit)}。`)
			process.exitCode = 1
			return
		}

		const applied = applyTransactionally(operations, () => commitManifest(head))
		printApplied(applied)

		console.log('✔ 同步后提纯验证通过')

		console.log(`\n✔ sync-manifest.json 基线已更新为 ${short(head)}`)
		console.log('\n后续请手动执行：')
		console.log('  pnpm lint && pnpm typecheck && pnpm generate && pnpm verify')
		console.log('  （transform / manual 文件如有变更，需先对照上游重构）')
	}
	finally {
		rmSync(tempDir, { recursive: true, force: true })
	}
}

function verify() {
	console.log('▶ 提纯验证（上游私密数据 / 站点文件 / 跨项目路径）')
	verifyTheme()

	console.log('▶ manifest 基线状态')
	const { repo, commit } = manifest.upstream
	const head = remoteHead(repo, targetBranch)
	if (head !== commit) {
		console.error(`✖ 基线 ${short(commit)} 落后于 ${targetBranch} 最新提交 ${short(head)}；请运行 apply 同步。`)
		return false
	}

	console.log(`✔ 基线 ${short(commit)} 即 ${targetBranch} 最新提交`)
	return true
}

function verifyTheme() {
	execFileSync(
		process.execPath,
		[join(themeDir, 'scripts', 'verify-theme.mjs')],
		{ cwd: themeDir, stdio: 'inherit' },
	)
}

function commitManifest(commit) {
	const previousManifest = readFileSync(manifestPath)
	try {
		manifest.upstream.commit = commit
		manifest.upstream.syncedAt = new Date().toISOString()
		writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
	}
	catch (error) {
		writeFileSync(manifestPath, previousManifest)
		throw error
	}
}

function remoteHead(repo, branch) {
	const output = git(['ls-remote', repo, `refs/heads/${branch}`], { encoding: 'utf8' })
	const head = output.split('\t')[0]?.trim()
	if (!/^[0-9a-f]{40}$/i.test(head ?? '')) {
		throw new Error(`无法读取 ${repo} 的 refs/heads/${branch}`)
	}
	return head
}

function cloneAtCommit(repo, commit, directory) {
	git(['clone', '--quiet', '--no-checkout', repo, directory])
	git(['checkout', '--quiet', commit], { cwd: directory })
}

function assertCommitExists(commit, directory) {
	git(['cat-file', '-e', `${commit}^{commit}`], { cwd: directory })
}

function git(args, options = {}) {
	// Windows 下 git 子进程继承调用方 stdin 句柄会偶发 `spawnSync git EBUSY`；
	// 同步工具只读取 git 的 stdout，一律忽略 stdin 以保证宿主无关。
	const stdio = options.stdio === 'inherit' ? ['ignore', 'inherit', 'inherit'] : options.stdio
	return execFileSync('git', args, {
		encoding: options.encoding ?? 'buffer',
		cwd: options.cwd,
		stdio: stdio ?? ['ignore', 'pipe', 'pipe'],
		maxBuffer: 1024 * 1024 * 128,
	})
}

function parseNameStatus(output) {
	const fields = output.toString('utf8').split('\0')
	const changes = []
	let index = 0

	while (index < fields.length) {
		if (!fields[index]) {
			index += 1
			continue
		}

		const rawStatus = fields[index++]
		const oldPath = fields[index++]
		if (!oldPath) {
			throw new Error(`无法解析 git diff 输出：${rawStatus}`)
		}

		const status = rawStatus[0]
		const renameOrCopy = status === 'R' || status === 'C'
		const newPath = renameOrCopy ? fields[index++] : oldPath
		if (!newPath) {
			throw new Error(`无法解析 ${rawStatus} 变更路径`)
		}

		validateGitPath(oldPath)
		validateGitPath(newPath)
		if (!'ACDMRT'.includes(status)) {
			throw new Error(`暂不支持的 git diff 状态：${rawStatus}`)
		}

		changes.push({ status, path: newPath, oldPath: renameOrCopy ? oldPath : undefined })
	}

	return changes
}

function bucketChanges(changes) {
	const buckets = { include: [], transform: [], manual: [], boundary: [], exclude: [], unknown: [] }
	for (const change of changes) {
		buckets[bucketFor(change.path)].push(change)
	}
	return buckets
}

/**
 * 路径分类 + parity 边界记录提升。
 * 路径落在 include 内、但 parity manifest 把对应 Theme 文件登记为 boundary / bugfix 时，
 * 提升为 boundary：它既不是「未分类」（manifest 已经声明过），也不能自动同步。
 */
function bucketFor(path) {
	const bucket = classify(path)
	if (bucket !== 'include') {
		return bucket
	}
	const record = parityRecords[mapUpstreamPath(path)]
	if (record && (record.class === 'boundary' || record.class === 'bugfix')) {
		return 'boundary'
	}
	return bucket
}

/**
 * 本地文件在该记录下允许被快进时，唯一被接受的 sha。
 * 无机械声明的文件直接复用上游基线 blob sha（常态路径，无需读取内容）；
 * 有机械声明的文件才计算「基线内容 + 替换」的 blob sha。
 */
function expectedLocalShas(changes, baselineTree, upstreamDir) {
	const expected = new Map()
	for (const change of changes) {
		for (const path of [change.path, change.oldPath].filter(Boolean)) {
			if (classify(path) !== 'include' || expected.has(mapUpstreamPath(path))) {
				continue
			}
			const localThemePath = mapUpstreamPath(path)
			const baseline = baselineState(path, baselineTree)
			if (baseline.kind !== 'file') {
				expected.set(localThemePath, null)
				continue
			}
			const replacements = mechanicalReplacements(localThemePath)
			expected.set(
				localThemePath,
				replacements ? gitBlobSha(transformUpstreamContent(localThemePath, readBlob(baseline.sha, upstreamDir))) : baseline.sha,
			)
		}
	}
	return expected
}

/** 该 Theme 文件声明的机械替换；未声明返回 null。 */
function mechanicalReplacements(localThemePath) {
	const record = parityRecords[localThemePath]
	if (!record || record.class !== 'mechanical' || !Array.isArray(record.replacements)) {
		return null
	}
	return record.replacements
}

function transformUpstreamContent(localThemePath, content) {
	const replacements = mechanicalReplacements(localThemePath)
	if (!replacements || replacements.length === 0) {
		return content
	}
	let text = content.toString('utf8')
	for (const [from, to] of replacements) {
		if (!text.includes(from)) {
			throw new Error(`${localThemePath}: 上游内容中找不到声明的机械替换片段 ${JSON.stringify(from)}；parity manifest 需要更新`)
		}
		text = text.split(from).join(to)
	}
	return Buffer.from(text, 'utf8')
}

function readBlob(sha, upstreamDir) {
	return git(['show', sha], { cwd: upstreamDir, encoding: 'buffer' })
}

/** git blob 对象的 sha：`sha1("blob <len>\\0" + content)`，与 ls-tree 输出同一命名空间 */
function gitBlobSha(content) {
	const hash = createHash('sha1')
	hash.update(`blob ${content.length}\0`, 'utf8')
	hash.update(content)
	return hash.digest('hex')
}

function buildOperations(changes, upstreamDir, targetCommit) {
	const operations = []
	const conflicts = []
	const virtual = new Map()
	const baselineTree = upstreamTree(manifest.upstream.commit, upstreamDir)
	const headTree = upstreamTree(targetCommit, upstreamDir)
	const themeTree = themeTrackedTree()
	const expectedSha = expectedLocalShas(changes, baselineTree, upstreamDir)

	const planDelete = (path) => {
		const baseline = baselineState(path, baselineTree)
		const local = localState(path, virtual, themeTree)
		const expected = expectedSha.get(mapUpstreamPath(path))

		if (baseline.kind === 'missing') {
			if (local.kind === 'missing') {
				return
			}
			conflicts.push({ path, reason: '基线不存在但本地存在' })
			return
		}

		if (local.kind === 'file' && baseline.kind === 'file' && expected !== undefined && local.sha === expected) {
			operations.push({ type: 'delete', path })
			virtual.set(path, { kind: 'missing' })
			return
		}

		conflicts.push({
			path,
			reason: local.kind === 'missing'
				? '基线存在但本地已删除'
				: '本地内容已偏离基线（含声明的机械替换）',
		})
	}

	const planWrite = (path) => {
		const localThemePath = mapUpstreamPath(path)
		const baseline = baselineState(path, baselineTree)
		const local = localState(path, virtual, themeTree)
		const upstream = upstreamState(path, headTree, upstreamDir)
		const expected = expectedSha.get(localThemePath)

		if (upstream.kind !== 'file') {
			conflicts.push({ path, reason: `上游最新状态不是普通文件（${upstream.kind}）` })
			return
		}

		const localIsBaseline = baseline.kind === 'file' && local.kind === 'file' && expected !== undefined && local.sha === expected
		const canCreate = baseline.kind === 'missing' && local.kind === 'missing'
		if (!localIsBaseline && !canCreate) {
			conflicts.push({
				path,
				reason: baseline.kind === 'missing'
					? '上游新增但本地已存在'
					: '本地内容已偏离基线（含声明的机械替换）',
			})
			return
		}

		const data = canCreate ? upstream.data : transformUpstreamContent(localThemePath, upstream.data)
		operations.push({ type: 'write', path, data })
		virtual.set(path, { kind: 'file', sha: gitBlobSha(data) })
	}

	for (const change of changes) {
		if (change.status === 'R' && classify(change.oldPath) === 'include') {
			planDelete(change.oldPath)
		}

		if (classify(change.path) !== 'include') {
			continue
		}

		if (change.status === 'D') {
			planDelete(change.path)
		}
		else if (change.status === 'A' || change.status === 'C' || change.status === 'M' || change.status === 'R' || change.status === 'T') {
			planWrite(change.path)
		}
		else if (change.status !== 'R') {
			throw new Error(`暂不支持的变更状态：${change.status}`)
		}
	}

	return { operations, conflicts }
}

function upstreamTree(commit, upstreamDir) {
	const output = git(['ls-tree', '-r', '-z', commit], { cwd: upstreamDir, encoding: 'buffer' })
	const entries = new Map()
	for (const entry of output.toString('utf8').split('\0')) {
		if (!entry) {
			continue
		}
		const header = entry.slice(0, entry.indexOf('\t'))
		const path = entry.slice(header.length + 1)
		const [mode, type, sha] = header.split(' ')
		entries.set(path, { mode, type, sha })
	}
	return entries
}

function baselineState(path, tree) {
	const entry = tree.get(path)
	if (!entry || entry.type !== 'blob') {
		return { kind: entry ? entry.type : 'missing' }
	}
	return {
		kind: 'file',
		sha: entry.sha,
	}
}

function localState(path, virtual, themeTree) {
	if (virtual.has(path)) {
		return virtual.get(path)
	}

	const localThemePath = mapUpstreamPath(path)
	const localPath = safeThemePath(localThemePath)
	let stats
	try {
		stats = lstatSync(localPath)
	}
	catch (error) {
		if (error.code === 'ENOENT') {
			return { kind: 'missing' }
		}
		throw error
	}

	if (stats.isSymbolicLink()) {
		return { kind: 'symlink' }
	}
	if (stats.isDirectory()) {
		return { kind: 'directory' }
	}
	if (!stats.isFile()) {
		return { kind: 'special' }
	}
	const tracked = themeTree.get(localThemePath)
	if (!tracked || tracked.type !== 'blob') {
		return { kind: 'file', sha: null }
	}
	return { kind: 'file', sha: tracked.sha }
}

function themeTrackedTree() {
	const output = git(['ls-tree', '-r', '-z', 'HEAD'], { cwd: themeDir, encoding: 'buffer' })
	const entries = new Map()
	for (const entry of output.toString('utf8').split('\0')) {
		if (!entry) {
			continue
		}
		const header = entry.slice(0, entry.indexOf('\t'))
		const path = entry.slice(header.length + 1)
		const [mode, type, sha] = header.split(' ')
		entries.set(path, { mode, type, sha })
	}
	return entries
}

function upstreamState(path, tree, upstreamDir) {
	const entry = tree.get(path)
	if (!entry || entry.type !== 'blob') {
		return { kind: entry ? entry.type : 'missing' }
	}
	return {
		kind: 'file',
		sha: entry.sha,
		data: git(['show', entry.sha], { cwd: upstreamDir }),
	}
}

function applyTransactionally(operations, commit) {
	const backups = new Map()
	const createdDirectories = []

	const backup = (path) => {
		const localPath = localPathFor(path)
		const stats = lstatSync(localPath)
		if (!stats.isFile()) {
			throw new Error(`无法安全应用 ${path}：本地不是普通文件`)
		}
		return { data: readFileSync(localPath), mode: stats.mode & 0o777 }
	}

	for (const operation of operations) {
		const stats = lstatSync(localPathFor(operation.path), { throwIfNoEntry: false })
		backups.set(operation, stats?.isFile() ? backup(operation.path) : null)
	}

	const rollback = () => {
		for (const operation of [...operations].reverse()) {
			const previous = backups.get(operation)
			const localPath = localPathFor(operation.path)
			if (previous) {
				mkdirSync(dirname(localPath), { recursive: true })
				writeFileSync(localPath, previous.data, { mode: previous.mode })
			}
			else if (lstatSync(localPath, { throwIfNoEntry: false })) {
				unlinkSync(localPath)
			}
		}
		for (const directory of createdDirectories.reverse()) {
			try {
				rmSync(directory, { recursive: false, force: true })
			}
			catch {
				// 目录非空说明还有其他文件，保留即可。
			}
		}
	}

	try {
		for (const operation of operations) {
			const localPath = localPathFor(operation.path)
			if (operation.type === 'delete') {
				unlinkSync(localPath)
			}
			else {
				createdDirectories.push(...mkdirInsideTheme(dirname(mapUpstreamPath(operation.path))))
				writeFileSync(localPath, operation.data)
			}
		}

		verifyTheme()
		commit()
		return summarize(operations)
	}
	catch (error) {
		rollback()
		error.message = `同步提交失败，已回滚全部文件变更：${error.message}`
		throw error
	}
}

function localPathFor(path) {
	return safeThemePath(mapUpstreamPath(path))
}

function summarize(operations) {
	const copied = operations.filter(operation => operation.type === 'write').map(operation => mapUpstreamPath(operation.path))
	const deletions = operations.filter(operation => operation.type === 'delete').map(operation => mapUpstreamPath(operation.path))
	return { copied, deletions }
}

function printApplied({ copied, deletions }) {
	console.log(`\n✔ 已快进更新 ${copied.length} 个文件：`)
	for (const path of copied) {
		console.log(`  + ${path}`)
	}
	if (deletions.length) {
		console.log(`\n✔ 已删除 ${deletions.length} 个上游删除且本地未适配的文件：`)
		for (const path of deletions) {
			console.log(`  - ${path}`)
		}
	}
}

function classify(path) {
	if (manifest.exclude.some(glob => matchGlob(glob, path))) {
		return 'exclude'
	}
	if (manifest.transform?.some(glob => matchGlob(glob, path))) {
		return 'transform'
	}
	if (manifest.manual.some(glob => matchGlob(glob, path))) {
		return 'manual'
	}
	if (manifest.include.some(glob => matchGlob(glob, path))) {
		return 'include'
	}
	return 'unknown'
}

/**
 * upstream（blog-v3）路径 → 本地 Theme 源码路径的前缀映射。
 * `app/*` 扁平化进 `src/*`，其余同步目录保留层级（详见 sync-manifest.json 的 pathMap）；
 * 未命中前缀的路径保持原样，manifest 未声明 pathMap 时行为与旧版完全一致。
 */
function mapUpstreamPath(path) {
	for (const [from, to] of Object.entries(manifest.pathMap ?? {})) {
		if (path.startsWith(from)) {
			return `${to}${path.slice(from.length)}`
		}
	}
	return path
}

function matchGlob(glob, path) {
	let regex = globRegexCache.get(glob)
	if (!regex) {
		regex = new RegExp(`^${globToRegExpSource(glob)}$`)
		globRegexCache.set(glob, regex)
	}
	return regex.test(path)
}

function globToRegExpSource(glob) {
	let source = ''
	let index = 0

	while (index < glob.length) {
		if (glob.startsWith('**/', index)) {
			source += '(?:[^/]+/)*'
			index += 3
		}
		else if (glob.startsWith('**', index)) {
			source += '.*'
			index += 2
		}
		else if (glob[index] === '*') {
			source += '[^/]*'
			index += 1
		}
		else {
			source += glob[index].replace(/[.+^${}()|[\]\\]/g, '\\$&')
			index += 1
		}
	}

	return source
}

function readManifest(path) {
	const manifest = JSON.parse(readFileSync(path, 'utf8'))
	const upstream = manifest.upstream
	if (!upstream?.repo || !upstream?.branch || !/^[0-9a-f]{40}$/i.test(upstream.commit ?? '')) {
		throw new Error('sync-manifest.json 的 upstream.repo / branch / commit 无效')
	}
	for (const key of ['include', 'exclude', 'manual']) {
		if (!Array.isArray(manifest[key]) || manifest[key].some(glob => typeof glob !== 'string')) {
			throw new Error(`sync-manifest.json 的 ${key} 必须是字符串数组`)
		}
	}
	if (manifest.transform !== undefined && (!Array.isArray(manifest.transform) || manifest.transform.some(glob => typeof glob !== 'string'))) {
		throw new Error('sync-manifest.json 的 transform 必须是字符串数组')
	}
	if (manifest.pathMap !== undefined) {
		if (typeof manifest.pathMap !== 'object' || manifest.pathMap === null || Array.isArray(manifest.pathMap)) {
			throw new Error('sync-manifest.json 的 pathMap 必须是「upstream 前缀 → 本地前缀」对象')
		}
		for (const [from, to] of Object.entries(manifest.pathMap)) {
			validatePathPrefix(from, 'pathMap 键（upstream 前缀）')
			validatePathPrefix(to, `pathMap 值（${from} 的本地前缀）`)
		}
	}
	return manifest
}

function validatePathPrefix(prefix, label) {
	const safePrefix = /^[^\\/]+(?:\/[^\\/]+)*\/$/
	if (typeof prefix !== 'string' || !safePrefix.test(prefix) || prefix.split('/').includes('..')) {
		throw new Error(`sync-manifest.json 的 ${label} 必须是安全的相对目录前缀（以 / 结尾）：${JSON.stringify(prefix)}`)
	}
}

function validateGitPath(path) {
	if (!path || path === '.' || path.startsWith('/') || path.includes('\\') || path.includes('\0') || path.includes(':')
		|| path.split('/').some(segment => !segment || segment === '.' || segment === '..' || segment === '.git')) {
		throw new Error(`不安全的上游路径：${JSON.stringify(path)}`)
	}
}

function safeThemePath(path) {
	return safeJoin(themeDir, path)
}

function safeJoin(root, path) {
	validateGitPath(path)
	const fullPath = join(root, path)
	const relativePath = relative(root, fullPath)
	if (!relativePath || isAbsolute(relativePath) || relativePath.startsWith(`..${sep}`) || relativePath === '..' || relativePath.split(sep).includes('.git')) {
		throw new Error(`路径越界：${path}`)
	}
	return fullPath
}

function mkdirInsideTheme(directory) {
	const created = []
	let current = themeDir
	for (const segment of directory.split('/')) {
		if (!segment || segment === '.') {
			continue
		}
		current = join(current, segment)
		if (existsSync(current)) {
			const stats = lstatSync(current)
			if (!stats.isDirectory() || stats.isSymbolicLink()) {
				throw new Error(`目标父目录不安全：${relative(themeDir, current)}`)
			}
			continue
		}
		mkdirSync(current)
		created.push(current)
	}
	return created
}

function printSection(title, changes) {
	if (!changes.length) {
		return
	}

	console.log(`\n${title}（${changes.length}）：`)
	for (const { status, path, oldPath } of changes) {
		console.log(`  ${status}\t${oldPath ? `${oldPath} -> ${path}` : path}`)
	}
}

function short(sha) {
	return sha.slice(0, 7)
}

/** 读取 `--name value` / `--name=value`；未提供返回 undefined。 */
function readArgValue(name) {
	const argv = process.argv.slice(2)
	for (const [index, arg] of argv.entries()) {
		if (arg === name) {
			const value = argv[index + 1]
			return value && !value.startsWith('--') ? value : undefined
		}
		if (arg.startsWith(`${name}=`)) {
			return arg.slice(name.length + 1) || undefined
		}
	}
	return undefined
}

/**
 * parity manifest 是边界与机械替换的单一事实来源；Theme 独立仓库/发布包中可能不存在
 * （例如 sync 测试 fixture），缺失时退化为「无声明替换 / 无边界记录」的旧行为。
 */
function readParityRecords(path) {
	if (!existsSync(path)) {
		return {}
	}
	const parsed = JSON.parse(readFileSync(path, 'utf8'))
	return parsed?.records && typeof parsed.records === 'object' ? parsed.records : {}
}

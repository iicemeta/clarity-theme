#!/usr/bin/env node
import { spawn, spawnSync } from 'node:child_process'
import { existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { basename, dirname, isAbsolute, join, relative, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { createPrompts, PromptCancelledError } from './prompts.mjs'
import { detectTimezone, isValidTimezone } from './timezone.mjs'

const packageRoot = fileURLToPath(new URL('..', import.meta.url))
const templateRoot = join(packageRoot, 'templates', 'default')
const ownPackage = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8'))

// npm rewrites `.gitignore` to `.npmignore` when it installs a package, so
// templates must ship the file without the leading dot (the create-vite
// pattern) and the CLI renames it while generating the project.
const renamedTemplateFiles = new Map([
	['gitignore', '.gitignore'],
])

const valueOptions = new Map([
	['--title', 'title'],
	['--description', 'description'],
	['--url', 'url'],
	['--author', 'author'],
	['--language', 'language'],
	['--timezone', 'timezone'],
	['--package-manager', 'packageManager'],
	['--pm', 'packageManager'],
])

const help = `Clarity Theme project creator (${ownPackage.version})

Usage:
  create-clarity-theme [project-directory]
  pnpm create clarity-theme my-blog
  npx create-clarity-theme@latest my-blog

Options:
  --title <title>             Site title
  --description <description> Site description
  --url <url>                 Canonical site URL (http or https)
  --author <name>             Author name
  --language <tag>            Site language, for example zh-CN
  --timezone <zone>           IANA timezone, for example Asia/Tokyo
  --package-manager <name>    Must be pnpm (also --pm); generated projects are pnpm-based
  --no-install                Skip dependency installation entirely
  --install                   Install dependencies without asking
  --yes, -y                   Accept defaults; still refuses non-empty directories
  --version, -v               Print the CLI version
  --help, -h                  Show this help

The CLI asks only for values Clarity needs on first launch. All other Theme
configuration uses the documented defaults.

Every prompt shows its editable default value; press Enter to accept it. The
timezone default is detected from the system and falls back to UTC only when
detection fails.`

async function main() {
	try {
		const args = parseArguments(process.argv.slice(2))
		if (args.help) {
			process.stdout.write(`${help}\n`)
			return
		}
		if (args.version) {
			process.stdout.write(`${ownPackage.version}\n`)
			return
		}

		await createProject(args)
	}
	catch (error) {
		if (error instanceof PromptCancelledError) {
			process.stderr.write(`\n✖ ${error.message}\n`)
			process.exitCode = 1
			return
		}
		process.stderr.write(`\n✖ ${error instanceof Error ? error.message : String(error)}\n`)
		process.exitCode = 1
	}
}

function parseArguments(argv) {
	const positional = []
	const options = {
		help: false,
		version: false,
		yes: false,
		install: undefined,
	}

	for (let index = 0; index < argv.length; index++) {
		const argument = argv[index]

		if (argument === '--help' || argument === '-h') {
			options.help = true
			continue
		}
		if (argument === '--version' || argument === '-v') {
			options.version = true
			continue
		}
		if (argument === '--yes' || argument === '-y') {
			options.yes = true
			continue
		}
		if (argument === '--no-install') {
			options.install = false
			continue
		}
		if (argument === '--install') {
			options.install = true
			continue
		}

		if (argument.startsWith('--')) {
			const equals = argument.indexOf('=')
			const name = equals === -1 ? argument : argument.slice(0, equals)
			const inlineValue = equals === -1 ? undefined : argument.slice(equals + 1)
			const propertyName = valueOptions.get(name)

			if (!propertyName) {
				throw new Error(`Unknown option: ${name}. Run with --help for available options.`)
			}

			const value = inlineValue ?? argv[++index]
			if (value === undefined || value === '') {
				throw new Error(`${name} requires a non-empty value.`)
			}
			options[propertyName] = value
			continue
		}

		if (argument.startsWith('-') && argument !== '-') {
			throw new Error(`Unknown option: ${argument}. Run with --help for available options.`)
		}
		positional.push(argument)
	}

	if (positional.length > 1) {
		throw new Error('Provide only one project directory.')
	}
	options.projectDirectory = positional[0]
	return options
}

async function createProject(options) {
	if (options.yes && options.projectDirectory) {
		process.stdout.write('\n◆ Clarity Theme\n\n')
		return createProjectWithPrompts(options, undefined)
	}

	const prompts = createPrompts()
	try {
		prompts.intro('Clarity Theme')
		return await createProjectWithPrompts(options, prompts)
	}
	finally {
		prompts.close()
	}
}

async function createProjectWithPrompts(options, prompts) {
	if (!options.projectDirectory) {
		if (options.yes) {
			throw new Error('A project directory is required when --yes is used.')
		}
		options.projectDirectory = await prompts.text({
			message: 'Project name',
			initialValue: 'my-blog',
			validate: validateProjectDirectory,
		})
	}

	const target = resolveTargetDirectory(options.projectDirectory)
	await assertSafeTarget(target, prompts, options.yes)

	const defaults = createDefaults(target)
	const siteTitle = await askOptionOrPrompt(options, prompts, 'title', 'Site title', defaults.siteTitle, validateText)
	const description = await askOptionOrPrompt(options, prompts, 'description', 'Site description', defaults.description, validateText)
	const url = await askOptionOrPrompt(options, prompts, 'url', 'Site URL', defaults.url, validateUrl)
	const author = await askOptionOrPrompt(options, prompts, 'author', 'Author name', defaults.author, validateText)
	const language = await askOptionOrPrompt(options, prompts, 'language', 'Language', defaults.language, validateLanguage)
	const timezone = await askOptionOrPrompt(options, prompts, 'timezone', 'Timezone', defaults.timezone, validateTimezone, 'Detected from your system')
	resolvePackageManager(options.packageManager)

	const values = {
		PROJECT_NAME: createPackageName(basename(target)),
		SITE_TITLE: siteTitle,
		SITE_DESCRIPTION: description,
		SITE_URL: url,
		AUTHOR_NAME: author,
		LANGUAGE: language,
		TIMEZONE: timezone,
		SITE_ESTABLISHED: createEstablishedDate(timezone),
	}

	console.log('\n◆ Creating project...')
	copyTemplate(target, values)
	finalizePackageJson(target)
	assertGeneratedProject(target)
	console.log('✔ Creating project')
	console.log('✔ Writing configuration')
	console.log('✔ Generating welcome article')

	if (options.install === undefined && prompts) {
		options.install = await prompts.confirm({ message: 'Install dependencies with pnpm now?', initialValue: true })
	}

	if (options.install) {
		if (isPnpmAvailable()) {
			console.log('◆ Installing dependencies...')
			await installDependencies(target)
			console.log('✔ Installing dependencies')
		}
		else {
			console.log('· pnpm was not found; dependency installation skipped.')
			console.log('  Enable it with `corepack enable` (bundled with Node.js) or install it from https://pnpm.io/installation, then run `pnpm install`.')
			options.install = false
		}
	}
	else {
		console.log(`· Dependency installation skipped${options.install === false ? ' (--no-install)' : ''}`)
	}

	printNextSteps(target, options.install)
	printUpstreamContentNotice()
	prompts?.outro('Project ready')
}

async function askOptionOrPrompt(options, prompts, propertyName, label, defaultValue, validate, hint) {
	if (options[propertyName] !== undefined) {
		return normalizeValue(propertyName, options[propertyName], validate)
	}
	if (options.yes) {
		return normalizeValue(propertyName, defaultValue, validate)
	}
	return prompts.text({ message: label, initialValue: defaultValue, validate, hint })
}

function normalizeValue(propertyName, value, validate) {
	if (typeof value !== 'string') {
		throw new TypeError(`--${propertyName} must be a string.`)
	}
	return validate(value.trim())
}

function validateProjectDirectory(value) {
	const text = validateText(value, 'Project name')
	if (text === '.' || text === '..' || text.includes('\0')) {
		throw new Error('Project name must be a usable directory name.')
	}
	return text
}

function validateText(value, label = 'Value') {
	const text = value.trim()
	if (!text) {
		throw new Error(`${label} cannot be empty.`)
	}
	if (text.length > 300) {
		throw new Error(`${label} is too long.`)
	}
	// eslint-disable-next-line no-control-regex -- rejecting control characters is the purpose of this check
	if (/[\0-\x08\v\f\x0E-\x1F]/.test(text) || /\{\{\w+\}\}/.test(text)) {
		throw new Error(`${label} contains unsupported characters.`)
	}
	return text
}

function validateUrl(value) {
	let parsed
	try {
		parsed = new URL(value.trim())
	}
	catch {
		throw new Error('Site URL must be a valid URL, for example https://example.com/.')
	}
	if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
		throw new Error('Site URL must use http or https.')
	}
	if (!parsed.hostname || parsed.username || parsed.password) {
		throw new Error('Site URL must have a hostname and cannot contain credentials.')
	}
	if (parsed.hash) {
		throw new Error('Site URL cannot contain a fragment.')
	}
	return `${parsed.origin}${parsed.pathname === '/' ? '/' : `${parsed.pathname.replace(/\/?$/, '/')}`}${parsed.search}`
}

function validateLanguage(value) {
	const text = validateText(value, 'Language')
	if (!/^[A-Z]{2,3}(?:-[A-Z0-9]{1,8})*$/i.test(text)) {
		throw new Error('Language must be a BCP 47 style tag, for example zh-CN or en.')
	}
	return text
}

function validateTimezone(value) {
	const text = validateText(value, 'Timezone')
	if (!isValidTimezone(text)) {
		throw new Error('Timezone must be a valid IANA timezone, for example Asia/Tokyo.')
	}
	return text
}

function resolveTargetDirectory(input) {
	const currentDirectory = process.cwd()
	const target = resolve(currentDirectory, validateProjectDirectory(input))
	const relativePath = relative(currentDirectory, target)

	if (!relativePath || relativePath === '.' || relativePath.startsWith('..') || isAbsolute(relativePath)) {
		throw new Error('Project directory must be a new path inside the current directory.')
	}
	// eslint-disable-next-line no-control-regex -- rejecting control characters is the purpose of this check
	if (/[\0-\x1F]/.test(target)) {
		throw new Error('Project directory contains unsupported characters.')
	}
	return target
}

async function assertSafeTarget(target, prompts, assumeYes) {
	const templateFiles = listTemplateFiles()

	if (existsSync(target)) {
		if (!statSync(target).isDirectory()) {
			throw new Error('Project destination exists and is not a directory.')
		}

		const entries = readdirSync(target)
		const criticalFiles = entries.filter(isCriticalProjectFile)
		if (criticalFiles.length > 0) {
			throw new Error(`Refusing to overwrite an existing project (found ${criticalFiles.join(', ')}).`)
		}

		const conflicts = templateFiles
			.map(file => join(target, file))
			.filter(existsSync)
			.map(file => relative(target, file))
		if (conflicts.length > 0) {
			throw new Error(`Refusing to overwrite existing files: ${conflicts.join(', ')}.`)
		}

		if (entries.length > 0) {
			if (assumeYes) {
				throw new Error('Refusing to use a non-empty directory with --yes. Review it manually or choose an empty directory.')
			}
			const confirmed = await prompts.confirm({
				message: `Directory ${target} is not empty. Continue without touching existing files?`,
				initialValue: false,
			})
			if (!confirmed) {
				throw new Error('Project creation cancelled.')
			}
		}
	}
}

main()

function isCriticalProjectFile(entry) {
	return entry === 'package.json'
		|| entry === 'content'
		|| /^nuxt\.config\.(?:ts|js|mjs)$/.test(entry)
		|| /^clarity\.config\.(?:ts|js|mjs)$/.test(entry)
}

function listTemplateFiles(base = templateRoot) {
	const files = []
	if (!existsSync(templateRoot) || !statSync(templateRoot).isDirectory()) {
		throw new Error('The bundled default template is missing.')
	}

	for (const entry of readdirSync(base)) {
		const fullPath = join(base, entry)
		const stats = lstatSync(fullPath)
		if (stats.isSymbolicLink()) {
			throw new Error('Template symlinks are not supported.')
		}
		if (stats.isDirectory()) {
			files.push(...listTemplateFiles(fullPath))
			continue
		}
		if (!stats.isFile()) {
			throw new Error(`Unsupported template entry: ${entry}`)
		}
		const relativePath = relative(templateRoot, fullPath)
		if (!relativePath || relativePath.startsWith('..') || isAbsolute(relativePath)) {
			throw new Error('Template path escaped the template directory.')
		}
		files.push(relativePath.replaceAll('\\', '/'))
	}
	return files.sort()
}

function copyTemplate(target, values) {
	mkdirSync(target, { recursive: true })
	for (const relativePath of listTemplateFiles()) {
		const source = join(templateRoot, relativePath)
		const destinationPath = renamedTemplateFiles.get(relativePath) ?? relativePath
		const destination = join(target, destinationPath)
		if (existsSync(destination)) {
			throw new Error(`Refusing to overwrite existing file: ${destinationPath}`)
		}
		mkdirSync(dirname(destination), { recursive: true })

		const rendered = renderTemplate(readFileSync(source, 'utf8'), values, relativePath.endsWith('.ts'))
		writeFileSync(destination, rendered, { encoding: 'utf8', flag: 'wx' })
	}
}

function renderTemplate(content, values, escapeTypeScript) {
	const rendered = content.replace(/\{\{(\w+)\}\}/g, (match, key) => (
		Object.hasOwn(values, key)
			? (escapeTypeScript ? escapeTypeScriptValue(values[key]) : values[key])
			: match
	))
	const leftover = rendered.match(/\{\{[A-Z][A-Z0-9_]*\}\}/)
	if (leftover) {
		throw new Error(`Template variable was not replaced: ${leftover[0]}`)
	}
	return rendered
}

function escapeTypeScriptValue(value) {
	return value.replace(/[\\'"]/g, character => (
		character === '\\' ? '\\\\' : `\\${character}`
	))
}

function finalizePackageJson(target) {
	const packagePath = join(target, 'package.json')
	const pkg = JSON.parse(readFileSync(packagePath, 'utf8'))
	if (typeof pkg.name !== 'string' || !/^(?:@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(pkg.name)) {
		throw new Error('Generated package.json has an invalid name.')
	}
	writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`, { encoding: 'utf8' })
}

function assertGeneratedProject(target) {
	const required = [
		'app/app.config.ts',
		'content/posts/welcome.md',
		'scripts/new-blog.mjs',
		'public/favicon.svg',
		'clarity.config.ts',
		'content.config.ts',
		'feeds.ts',
		'nuxt.config.ts',
		'package.json',
		'pnpm-workspace.yaml',
		'tsconfig.json',
		'.gitignore',
	]
	const missing = required.filter(file => !existsSync(join(target, file)))
	if (missing.length > 0) {
		throw new Error(`Generated project is incomplete; missing ${missing.join(', ')}.`)
	}

	const root = resolve(target)
	for (const file of listGeneratedFiles(target)) {
		const fullPath = join(target, file)
		const relativePath = relative(root, resolve(fullPath))
		if (!relativePath || relativePath.startsWith('..') || isAbsolute(relativePath)) {
			throw new Error(`Generated path escaped the project directory: ${file}`)
		}
	}
	const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
	if (pkg.scripts?.['new-blog'] !== 'node scripts/new-blog.mjs') {
		throw new Error('Generated project is missing the new-blog authoring script.')
	}
}

function listGeneratedFiles(base, root = base) {
	const files = []
	for (const entry of readdirSync(base)) {
		const fullPath = join(base, entry)
		if (lstatSync(fullPath).isDirectory()) {
			files.push(...listGeneratedFiles(fullPath, root))
		}
		else {
			files.push(relative(root, fullPath).replaceAll('\\', '/'))
		}
	}
	return files
}

function createDefaults(target) {
	const projectName = basename(target)
	return {
		siteTitle: humanizeProjectName(projectName),
		description: 'My personal blog built with Clarity Theme',
		url: 'https://example.com/',
		author: 'Your Name',
		language: 'zh-CN',
		timezone: detectTimezone(),
	}
}

function createEstablishedDate(timezone) {
	return new Intl.DateTimeFormat('en-CA', {
		timeZone: timezone,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	}).format(new Date())
}

function humanizeProjectName(value) {
	const words = value.replace(/[-_.]+/g, ' ').trim()
	if (!words) {
		return 'My Blog'
	}
	return words
		.split(' ')
		.map(word => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ')
}

function createPackageName(value) {
	const packageName = value
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9-_]+/g, '-')
		.replace(/^[-.]+|-+$/g, '')
	return packageName || 'clarity-blog'
}

function resolvePackageManager(requested) {
	// The generated project ships pnpm-workspace.yaml patchedDependencies and
	// a pnpm packageManager field; npm/yarn would skip the patches entirely.
	const packageManager = requested ?? 'pnpm'
	if (packageManager !== 'pnpm') {
		throw new Error('Generated Clarity projects install with pnpm only (the template registers pnpm patchedDependencies). Pass --no-install to skip installation.')
	}
	return packageManager
}

function isPnpmAvailable() {
	const result = spawnSync('pnpm --version', {
		encoding: 'utf8',
		shell: true,
		env: { ...process.env, NO_COLOR: process.env.NO_COLOR ?? '1' },
	})
	return result.status === 0
}

function installDependencies(target) {
	// Single fixed command string: an args array combined with `shell: true`
	// triggers Node DEP0190, and this command has no dynamic parts.
	const command = 'pnpm install'
	return new Promise((resolvePromise, rejectPromise) => {
		const child = spawn(command, {
			cwd: target,
			stdio: 'inherit',
			env: { ...process.env, NUXT_TELEMETRY_DISABLED: '1', NO_COLOR: process.env.NO_COLOR ?? '1' },
			shell: true,
		})
		child.once('error', rejectPromise)
		child.once('exit', code => (code === 0 ? resolvePromise() : rejectPromise(new Error(`pnpm install failed with exit code ${code}.`))))
	})
}

function printNextSteps(target, installed) {
	const displayedPath = relative(process.cwd(), target) || '.'
	console.log('\nDone!\n\nNext steps:\n')
	console.log(`  cd ${displayedPath.replaceAll('\\', '/')}`)
	if (!installed) {
		console.log('  pnpm install')
	}
	console.log('  pnpm dev\n')
}

function printUpstreamContentNotice() {
	console.log([
		'Upstream example content',
		'───────────────────────',
		'Clarity is extracted from blog-v3 and intentionally keeps a few public',
		'examples from the upstream author in the Layer (the same content the',
		'upstream author\'s own init-project script leaves as a reference). Review',
		'them and replace whatever does not belong to your site:',
		'',
		'1. CommGroup widget — QQ group 169994096, its group avatar, and the',
		'   "纸网接入点" label. It renders when an article sets `aside:',
		'   [comm-group]` in frontmatter. Override it by creating',
		'   app/components/widget/CommGroup.vue in your project.',
		'',
		'2. BlogLog widget — the upstream site history (framework migrations and',
		'   the zhilu.site / zhilu.cyou domains). It renders in the sidebar of',
		'   non-article / 404 pages. Override it by creating',
		'   app/components/widget/BlogLog.vue with your own history.',
		'',
		'3. No action needed: the unused zi:zhilu icon asset, the internal',
		'   anti-mirror blacklist, and the Atom feed generator URI that credits',
		'   blog-v3 are not rendered as your site content.',
		'',
	].join('\n'))
}

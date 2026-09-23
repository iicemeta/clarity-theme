#!/usr/bin/env node
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import {
	cancel as cancelWithClack,
	intro,
	isCancel,
	log,
	outro,
	select,
	text as textWithClack,
} from '@clack/prompts'

const projectRoot = fileURLToPath(new URL('..', import.meta.url))
const postsRoot = join(projectRoot, 'content', 'posts')
const fallbackTimezone = 'UTC'
const defaultCategory = '未分类'
const defaultType = 'tech'

const help = `New Clarity blog article

Usage:
  pnpm new-blog
  pnpm new-blog "文章标题"
  pnpm new-blog "文章标题" --yes

Options:
  --yes, -y    Accept defaults for category, tags, and layout
  --help, -h   Show this help

Articles are created under content/posts/<year>/ and never overwrite an
existing file; a numeric suffix is appended when the generated filename is
already taken.`

async function main() {
	const args = parseArguments(process.argv.slice(2))
	if (args.help) {
		process.stdout.write(`${help}\n`)
		return
	}
	if (args.yes && !args.title) {
		throw new Error('A title is required with --yes, for example: pnpm new-blog "我的新文章" --yes')
	}

	const timezone = detectTimezone()
	const now = readClock(timezone)
	const interactive = process.stdin.isTTY === true && process.stdout.isTTY === true
	const prompts = createPrompts(interactive)

	try {
		if (interactive) {
			intro('New blog post')
			log.info(`Timezone: ${timezone} (detected from your system)`)
		}
		else {
			process.stdout.write('\n◆ New blog post\n\n')
		}

		const title = args.title ?? await prompts.text({
			message: 'Title',
			initialValue: '我的新文章',
			validate: validateTitle,
		})
		const category = args.yes
			? defaultCategory
			: await prompts.text({
					message: 'Category',
					initialValue: defaultCategory,
					validate: validateText,
				})
		const tagsInput = args.yes
			? ''
			: await prompts.text({
					message: 'Tags (comma or space separated)',
					initialValue: '',
					validate: validateTagsInput,
				})
		const type = args.yes
			? defaultType
			: await prompts.type({
					message: 'Type / layout',
					initialValue: defaultType,
					validate: validateText,
				})
		const tags = parseTags(tagsInput)
		const article = createArticle({
			title,
			category,
			tags,
			type,
			now,
		})

		writeArticle(article)
		const displayedPath = article.relativePath.replaceAll('\\', '/')
		if (interactive) {
			log.success(`Created: ${displayedPath}`)
			if (article.suffixed) {
				log.warn('The generated filename already existed, so a numeric suffix was added.')
			}
			outro('Start writing!')
		}
		else {
			process.stdout.write(`\n✔ Created: ${displayedPath}\n`)
			if (article.suffixed) {
				process.stdout.write('· A numeric suffix was added because the filename already existed.\n')
			}
			process.stdout.write('◆ Ready to write\n')
		}
	}
	finally {
		prompts.close()
	}
}

function parseArguments(argv) {
	const positional = []
	const options = { help: false, yes: false }

	for (let index = 0; index < argv.length; index++) {
		const argument = argv[index]
		if (argument === '--help' || argument === '-h') {
			options.help = true
			continue
		}
		if (argument === '--yes' || argument === '-y') {
			options.yes = true
			continue
		}
		if (argument.startsWith('-') && argument !== '-') {
			throw new Error(`Unknown option: ${argument}. Run with --help for available options.`)
		}
		positional.push(argument)
	}

	if (positional.length > 1) {
		throw new Error('Provide only one article title.')
	}
	options.title = positional[0]?.trim() || undefined
	if (options.title) {
		validateTitle(options.title)
	}
	return options
}

function createPrompts(interactive) {
	if (interactive) {
		return {
			async text({ message, initialValue, validate }) {
				const answer = await textWithClack({
					message,
					initialValue,
					defaultValue: initialValue,
					validate: (value) => {
						const candidate = typeof value === 'string' && value.trim() ? value : initialValue
						try {
							validate(candidate)
							return undefined
						}
						catch (error) {
							return error instanceof Error ? error.message : String(error)
						}
					},
				})
				return assertNotCancelled(answer, validate)
			},
			async type({ message, initialValue, validate }) {
				const selected = await select({
					message,
					initialValue,
					options: [
						{ value: defaultType, label: `${defaultType} (default)` },
						{ value: 'custom', label: 'custom' },
					],
				})
				if (isCancel(selected)) {
					cancelWithClack('Cancelled.')
					process.exit(0)
				}
				if (selected !== 'custom') {
					return selected
				}
				const custom = await textWithClack({
					message: 'Custom type',
					placeholder: 'must be declared in article.types',
					validate: (value) => {
						try {
							validate(value ?? '')
							return undefined
						}
						catch (error) {
							return error instanceof Error ? error.message : String(error)
						}
					},
				})
				log.warn('Custom layouts must be declared in article.types in clarity.config.ts.')
				return assertNotCancelled(custom, validate)
			},
			close() {},
		}
	}

	const reader = new LineReader()
	return {
		async text({ message, initialValue, validate }) {
			while (true) {
				const answer = await reader.question(`? ${message} › ${initialValue}`)
				const value = answer.trim() || initialValue
				try {
					return validate(value)
				}
				catch (error) {
					process.stdout.write(`  ✖ ${error instanceof Error ? error.message : String(error)}\n`)
				}
			}
		},
		async type({ message, initialValue, validate }) {
			while (true) {
				const answer = await reader.question(`? ${message} › ${initialValue}`)
				const value = answer.trim() || initialValue
				if (value === 'custom') {
					process.stdout.write('  · Custom layouts must be declared in article.types in clarity.config.ts.\n')
				}
				try {
					return validate(value)
				}
				catch (error) {
					process.stdout.write(`  ✖ ${error instanceof Error ? error.message : String(error)}\n`)
				}
			}
		},
		close() {
			reader.close()
		},
	}
}

function assertNotCancelled(value, validate) {
	if (isCancel(value)) {
		cancelWithClack('Cancelled.')
		process.exit(0)
	}
	return validate(value)
}

class LineReader {
	constructor() {
		this.buffer = ''
		this.lines = []
		this.pending = null
		this.ended = false
		this.onData = this.onData.bind(this)
		this.onEnd = this.onEnd.bind(this)
		process.stdin.setEncoding('utf8')
		process.stdin.on('data', this.onData)
		process.stdin.on('end', this.onEnd)
	}

	question(prompt) {
		process.stdout.write(prompt)
		if (this.pending) {
			return Promise.reject(new Error('Another prompt is already waiting for input.'))
		}
		if (this.lines.length > 0) {
			return Promise.resolve(this.lines.shift())
		}
		if (this.ended) {
			return Promise.resolve('')
		}
		return new Promise((resolve, reject) => {
			this.pending = { resolve, reject }
		})
	}

	close() {
		process.stdin.off('data', this.onData)
		process.stdin.off('end', this.onEnd)
		if (typeof process.stdin.pause === 'function') {
			process.stdin.pause()
		}
	}

	onData(chunk) {
		if (chunk.includes('\x03')) {
			this.lines = []
			this.buffer = ''
			this.ended = true
			if (this.pending) {
				const { reject } = this.pending
				this.pending = null
				reject(new Error('Cancelled.'))
			}
			return
		}
		this.buffer += chunk
		while (true) {
			const newline = this.buffer.indexOf('\n')
			if (newline === -1) {
				break
			}
			this.lines.push(this.buffer.slice(0, newline).replaceAll('\r', ''))
			this.buffer = this.buffer.slice(newline + 1)
		}
		this.drain()
	}

	onEnd() {
		this.ended = true
		if (this.buffer) {
			this.lines.push(this.buffer.replaceAll('\r', ''))
			this.buffer = ''
		}
		this.drain()
	}

	drain() {
		if (this.pending && this.lines.length > 0) {
			const { resolve } = this.pending
			this.pending = null
			resolve(this.lines.shift())
		}
		else if (this.pending && this.ended) {
			const { resolve } = this.pending
			this.pending = null
			resolve('')
		}
	}
}

function detectTimezone() {
	try {
		const timezone = new Intl.DateTimeFormat().resolvedOptions().timeZone
		if (!timezone) {
			return fallbackTimezone
		}
		new Intl.DateTimeFormat('en-US', { timeZone: timezone }).format(new Date())
		return timezone
	}
	catch {
		return fallbackTimezone
	}
}

function readClock(timezone) {
	const parts = new Intl.DateTimeFormat('en-CA', {
		timeZone: timezone,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		hour12: false,
	}).formatToParts(new Date())
	const values = Object.fromEntries(parts.map(part => [part.type, part.value]))
	const year = values.year
	const month = values.month
	const day = values.day
	const hour = values.hour === '24' ? '00' : values.hour
	const minute = values.minute
	return {
		year,
		stamp: `${year}-${month}-${day} ${hour}:${minute}`,
		compact: `${year}${month}${day}-${hour}${minute}`,
	}
}

function createArticle({ title, category, tags, type, now }) {
	const directory = join(postsRoot, now.year)
	const baseSlug = createSlug(title, now.compact)
	let slug = baseSlug
	let suffix = 1

	while (existsSync(join(directory, `${slug}.md`))) {
		suffix += 1
		slug = `${baseSlug}-${suffix}`
	}

	const relativePath = join('content', 'posts', now.year, `${slug}.md`)
	return {
		path: join(directory, `${slug}.md`),
		relativePath,
		suffixed: slug !== baseSlug,
		content: renderArticle({ title, category, tags, type, now }),
	}
}

function createSlug(title, fallback) {
	const slug = title
		.trim()
		.toLowerCase()
		.normalize('NFKD')
		.replace(/[\u0300-\u036F]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 64)
		.replace(/-+$/g, '')
	return slug || `post-${fallback}`
}

function renderArticle({ title, category, tags, type, now }) {
	const frontmatter = [
		`title: ${yamlScalar(title)}`,
		`date: ${now.stamp}`,
		`updated: ${now.stamp}`,
		'draft: false',
		'categories:',
		`  - ${yamlScalar(category)}`,
		`tags:${tags.length > 0 ? `\n${tags.map(tag => `  - ${yamlScalar(tag)}`).join('\n')}` : ' []'}`,
		`type: ${yamlScalar(type)}`,
	]

	return [
		'---',
		...frontmatter,
		'---',
		'',
		'Write your article here.',
		'',
		'<!-- Optional frontmatter: description, image, recommend, references, permalink. -->',
		'<!-- Move this file to content/previews/ while you want it excluded from the home list. -->',
		'',
	].join('\n')
}

function yamlScalar(value) {
	const text = String(value)
	if (/^\w[\w ./-]*$/.test(text) && text.length <= 120) {
		return text
	}
	return JSON.stringify(text)
}

function writeArticle(article) {
	mkdirSync(dirname(article.path), { recursive: true })
	writeFileSync(article.path, article.content, { encoding: 'utf8', flag: 'wx' })
}

function validateTitle(value) {
	return validateText(value, 'Title')
}

function validateText(value, label = 'Value') {
	const text = value.trim()
	if (!text) {
		throw new Error(`${label} cannot be empty.`)
	}
	// eslint-disable-next-line no-control-regex -- rejecting control characters is the purpose of this check
	if (text.length > 300 || /[\0-\x1F]/.test(text)) {
		throw new Error(`${label} contains unsupported characters or is too long.`)
	}
	return text
}

function validateTagsInput(value) {
	const text = value.trim()
	// eslint-disable-next-line no-control-regex -- rejecting control characters is the purpose of this check
	if (/[\0-\x1F]/.test(text)) {
		throw new Error('Tags contain unsupported characters.')
	}
	return text
}

function parseTags(value) {
	return value
		.split(/[\s,，、]+/)
		.map(tag => tag.trim())
		.filter(Boolean)
		.slice(0, 20)
}

main().catch((error) => {
	process.stderr.write(`\n✖ ${error instanceof Error ? error.message : String(error)}\n`)
	process.exitCode = 1
})

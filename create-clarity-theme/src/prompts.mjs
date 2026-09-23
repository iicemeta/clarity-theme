import process from 'node:process'
import {
	cancel as cancelWithClack,
	confirm as confirmWithClack,
	intro as introWithClack,
	isCancel,
	log,
	outro as outroWithClack,
	text as textWithClack,
} from '@clack/prompts'

export class PromptCancelledError extends Error {
	constructor(message = 'Prompt cancelled.') {
		super(message)
		this.name = 'PromptCancelledError'
	}
}

/**
 * Use the full @clack/prompts interface for real terminals, and a predictable
 * line-based interface for piped/CI stdin. Both interfaces display the default
 * value and accept an empty line as “use this default”.
 */
export function createPrompts({ input = process.stdin, output = process.stdout } = {}) {
	return input.isTTY && output.isTTY
		? createClackPrompts({ input, output })
		: createLinePrompts({ input, output })
}

function createClackPrompts({ input, output }) {
	const streams = { input, output }
	function assertNotCancelled(value) {
		if (isCancel(value)) {
			cancelWithClack('Cancelled.', streams)
			throw new PromptCancelledError()
		}
		return value
	}

	return {
		intro(title) {
			introWithClack(title, streams)
		},
		outro(message) {
			outroWithClack(message, streams)
		},
		info(message) {
			log.info(message, streams)
		},
		async text({ message, initialValue, validate, hint }) {
			if (hint) {
				log.info(hint, streams)
			}
			const answer = await textWithClack({
				...streams,
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
			return validate(assertNotCancelled(answer))
		},
		async confirm({ message, initialValue = false }) {
			const answer = await confirmWithClack({ ...streams, message, initialValue })
			return assertNotCancelled(answer)
		},
		close() {},
	}
}

function createLinePrompts({ input, output }) {
	const reader = new LineReader(input, output)

	function write(text) {
		output.write(text)
	}

	return {
		intro(title) {
			write(`\n◆ ${title}\n\n`)
		},
		outro(message) {
			write(`\n◆ ${message}\n`)
		},
		info(message) {
			write(`  ${message}\n`)
		},
		async text({ message, initialValue, validate, hint }) {
			if (hint) {
				write(`  ${hint}\n`)
			}
			while (true) {
				const answer = await reader.question(`? ${message} › ${initialValue}`)
				const value = answer.trim() || initialValue
				try {
					return validate(value)
				}
				catch (error) {
					write(`  ✖ ${error instanceof Error ? error.message : String(error)}\n`)
				}
			}
		},
		async confirm({ message, initialValue = false }) {
			const answer = (await reader.question(`? ${message} (${initialValue ? 'Y/n' : 'y/N'}) › `)).trim().toLowerCase()
			if (!answer) {
				return initialValue
			}
			return answer === 'y' || answer === 'yes'
		},
		close() {
			reader.close()
		},
	}
}

class LineReader {
	constructor(stream, output) {
		this.stream = stream
		this.output = output
		this.buffer = ''
		this.lines = []
		this.pending = null
		this.ended = false
		this.onData = this.onData.bind(this)
		this.onEnd = this.onEnd.bind(this)
		stream.setEncoding('utf8')
		stream.on('data', this.onData)
		stream.on('end', this.onEnd)
	}

	question(prompt) {
		this.output.write(prompt)
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
		this.stream.off('data', this.onData)
		this.stream.off('end', this.onEnd)
		if (typeof this.stream.pause === 'function') {
			this.stream.pause()
		}
	}

	onData(chunk) {
		// Piped input cannot deliver a real SIGINT, so treat the Ctrl+C byte as
		// an explicit cancellation request.
		if (chunk.includes('\x03')) {
			this.cancel()
			return
		}
		this.buffer += chunk
		while (true) {
			const newline = this.buffer.indexOf('\n')
			if (newline === -1) {
				break
			}
			const line = this.buffer.slice(0, newline).replaceAll('\r', '')
			this.buffer = this.buffer.slice(newline + 1)
			this.lines.push(line)
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

	cancel() {
		this.lines = []
		this.buffer = ''
		this.ended = true
		if (this.pending) {
			const { reject } = this.pending
			this.pending = null
			reject(new PromptCancelledError())
		}
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

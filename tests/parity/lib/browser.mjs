/**
 * 原生 CDP 浏览器控制（从 audit parity-lab 原型提取的正式实现）
 *
 * 无 puppeteer/playwright 依赖：spawn 系统 Chromium 系浏览器
 * （--remote-debugging-port=0），经 /json 拿 page target 的 WebSocket，
 * 直接说 CDP 协议。浏览器发现顺序：PARITY_BROWSER 环境变量 →
 * 平台惯例路径（Windows Edge/Chrome、Linux chrome/chromium、macOS）。
 */
import { spawn } from 'node:child_process'
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import process from 'node:process'

const BROWSER_CANDIDATES = [
	process.env.PARITY_BROWSER,
	// Windows
	'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
	'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
	'C:/Program Files/Google/Chrome/Application/chrome.exe',
	'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
	// Linux（GitHub Actions ubuntu-latest 预装 google-chrome stable）
	'/usr/bin/google-chrome',
	'/usr/bin/google-chrome-stable',
	'/usr/bin/chromium-browser',
	'/usr/bin/chromium',
	'/snap/bin/chromium',
	// macOS
	'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
	'/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
].filter(Boolean)

export function findBrowser() {
	const found = BROWSER_CANDIDATES.find(path => existsSync(path))
	if (!found) {
		throw new Error(
			'未找到 Chromium 系浏览器。请安装 Chrome/Edge，或设置 PARITY_BROWSER 指向可执行文件。',
		)
	}
	return found
}

export class Browser {
	#child
	#seq = 0
	#pending = new Map()
	session = null

	static executable = ''

	/** 启动 headless 浏览器并连接初始 about:blank page target */
	static async launch() {
		const executable = findBrowser()
		Browser.executable = executable
		const browser = new Browser()
		const userDataDir = mkdtempSync(join(tmpdir(), 'clarity-parity-browser-'))
		browser.#child = spawn(executable, [
			'--headless=new',
			'--remote-debugging-port=0',
			`--user-data-dir=${userDataDir}`,
			'--no-first-run',
			'--no-default-browser-check',
			'--disable-gpu',
			'--hide-scrollbars',
			'--disable-extensions',
			'--disable-background-networking',
			'--window-size=1440,900',
			'about:blank',
		], { stdio: ['ignore', 'pipe', 'pipe'] })

		const endpoint = await new Promise((resolve, reject) => {
			let buffer = ''
			let settled = false
			const onData = (chunk) => {
				if (settled) {
					return
				}
				buffer += chunk.toString()
				const match = buffer.match(/DevTools listening on (ws:\/\/\S+)/)
				if (match) {
					settled = true
					resolve(match[1])
				}
			}
			browser.#child.stderr.on('data', onData)
			browser.#child.stdout.on('data', onData)
			browser.#child.on('exit', () => {
				if (!settled) {
					settled = true
					reject(new Error('浏览器进程提前退出'))
				}
			})
			setTimeout(() => {
				if (!settled) {
					settled = true
					reject(new Error('等待 DevTools endpoint 超时'))
				}
			}, 15000)
		})

		const host = new URL(endpoint).host
		const targets = await fetch(`http://${host}/json`).then(r => r.json())
		const page = targets.find(t => t.type === 'page')
		if (!page) {
			throw new Error('未找到可用的 page target')
		}
		browser.session = new CdpSession(page.webSocketDebuggerUrl)
		await browser.session.open()
		browser.userDataDir = userDataDir
		return browser
	}

	async close() {
		this.session?.close()
		this.#child?.kill()
		if (this.userDataDir) {
			try {
				rmSync(this.userDataDir, { recursive: true, force: true })
			}
			catch {
				// Windows 下浏览器进程尚未完全退出时临时目录短暂占用，留给系统回收
			}
		}
		await new Promise(resolve => setTimeout(resolve, 300))
	}
}

class CdpSession {
	#ws
	#seq = 0
	#pending = new Map()
	#events = new Map()

	constructor(url) {
		this.url = url
	}

	open() {
		this.#ws = new WebSocket(this.url)
		return new Promise((resolve, reject) => {
			this.#ws.onopen = () => resolve()
			this.#ws.onerror = error => reject(new Error(`WebSocket 连接失败: ${error.message ?? error}`))
			this.#ws.onmessage = (event) => {
				const msg = JSON.parse(event.data)
				if (msg.id && this.#pending.has(msg.id)) {
					const { resolve: res, reject: rej } = this.#pending.get(msg.id)
					this.#pending.delete(msg.id)
					if (msg.error) {
						rej(new Error(`${msg.error.message} (${msg.error.code})`))
					}
					else {
						res(msg.result)
					}
				}
				else if (msg.method) {
					for (const handler of this.#events.get(msg.method) ?? []) {
						handler(msg.params)
					}
				}
			}
		})
	}

	on(method, handler) {
		if (!this.#events.has(method)) {
			this.#events.set(method, new Set())
		}
		this.#events.get(method).add(handler)
	}

	send(method, params = {}) {
		return new Promise((resolve, reject) => {
			const id = ++this.#seq
			const timer = setTimeout(() => {
				this.#pending.delete(id)
				reject(new Error(`CDP ${method} 超时`))
			}, 45000)
			this.#pending.set(id, {
				resolve: (value) => {
					clearTimeout(timer)
					resolve(value)
				},
				reject: (error) => {
					clearTimeout(timer)
					reject(error)
				},
			})
			this.#ws.send(JSON.stringify({ id, method, params }))
		})
	}

	/** 在页面主世界执行表达式（async 支持），返回 JSON 值 */
	async evaluate(expression) {
		const result = await this.send('Runtime.evaluate', {
			expression,
			awaitPromise: true,
			returnByValue: true,
		})
		if (result.exceptionDetails) {
			const detail = result.exceptionDetails.exception?.description
				?? result.exceptionDetails.text
				?? 'unknown'
			throw new Error(`页面执行失败: ${detail}`)
		}
		return result.result?.value
	}

	close() {
		try {
			this.#ws?.close()
		}
		catch {
			// 忽略关闭错误
		}
	}
}

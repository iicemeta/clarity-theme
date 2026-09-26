/**
 * Runtime/Visual Parity 矩阵引擎
 *
 * 页面矩阵：/ 、/link?shuffle=false（确定性开关）、/archive、/hello-parity（文章）
 * 视口矩阵：1440×900（desktop）、390×844（mobile）
 * 模式矩阵：light、dark（localStorage 预设 + prefers-color-scheme 模拟）
 * 每个组合在 upstream 与 clarity 两个真实 consumer 上分别加载、稳定、采集、比较。
 */
import { Buffer } from 'node:buffer'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { criticalSelectors } from '../fixtures/site.mjs'
import { Browser } from './browser.mjs'
import { compareCase, visualDiff, writeDiff } from './compare.mjs'
import { collectionScript, openPage } from './page-script.mjs'
import { prepareConsumers } from './prepare.mjs'
import { serveStatic } from './server.mjs'

const themeDir = resolve(fileURLToPath(new URL('../../..', import.meta.url)))
const artifactsDir = join(themeDir, 'tests/parity/artifacts')

/** computed style 比较属性（任务 §13；只比较实际存在的属性） */
export const STYLE_PROPS = [
	'font-family',
	'font-size',
	'font-weight',
	'line-height',
	'letter-spacing',
	'color',
	'background-color',
	'border-top-width',
	'border-top-style',
	'border-top-color',
	'border-top-left-radius',
	'display',
	'position',
	'margin',
	'padding',
	'gap',
]

const PAGES = [
	{ id: 'home', path: '/' },
	{ id: 'link', path: '/link?shuffle=false' },
	{ id: 'archive', path: '/archive' },
	{ id: 'article', path: '/hello-parity' },
]

const VIEWPORTS = [
	{ id: 'desktop', width: 1440, height: 900, mobile: false },
	{ id: 'mobile', width: 390, height: 844, mobile: true },
]

const MODES = ['light', 'dark']

export async function runParity({ visual = false, fresh = false } = {}) {
	const consumers = await prepareConsumers({ fresh })
	const upstreamServer = await serveStatic(join(consumers.upstream, '.output/public'))
	const clarityServer = await serveStatic(join(consumers.clarity, '.output/public'))
	console.log(`  · upstream: ${upstreamServer.url}`)
	console.log(`  · clarity : ${clarityServer.url}`)

	if (visual) {
		mkdirSync(artifactsDir, { recursive: true })
	}

	const browser = await Browser.launch()
	console.log(`  · browser: ${Browser.executable}`)

	const allFailures = []
	const allNotes = []
	const visualStats = []
	try {
		for (const viewport of VIEWPORTS) {
			for (const mode of MODES) {
				for (const page of PAGES) {
					const caseCtx = { page: page.id, viewport, mode }
					process.stdout.write(`  · ${page.id} ${viewport.width}x${viewport.height} ${mode} … `)
					const upstream = await collectOne(browser, upstreamServer.url, page.path, viewport, mode)
					const clarity = await collectOne(browser, clarityServer.url, page.path, viewport, mode)

					if (visual) {
						const base = `${page.id}-${viewport.id}-${mode}`
						await screenshot(browser, upstreamServer.url + page.path, viewport, mode, join(artifactsDir, `${base}.upstream.png`))
						await screenshot(browser, clarityServer.url + page.path, viewport, mode, join(artifactsDir, `${base}.clarity.png`))
						const diff = visualDiff(
							await readPng(join(artifactsDir, `${base}.upstream.png`)),
							await readPng(join(artifactsDir, `${base}.clarity.png`)),
						)
						if (diff.sizeMismatch) {
							console.log('截图尺寸不一致')
							allNotes.push({ ...caseCtx, kind: 'screenshot', detail: '截图尺寸不一致（页面高度不同）' })
						}
						else {
							writeDiff(join(artifactsDir, `${base}.diff.png`), diff)
							visualStats.push({ ...caseCtx, viewport: `${viewport.width}x${viewport.height}`, ratio: Math.round(diff.ratio * 10000) / 100, diffPixels: diff.diffPixels })
							process.stdout.write(`pixdiff ${Math.round(diff.ratio * 10000) / 100}%  `)
						}
					}

					const { failures, notes } = compareCase({ upstream, clarity }, caseCtx)
					allFailures.push(...failures)
					allNotes.push(...notes)
					console.log(failures.length ? `✕ ${failures.length} 项不一致` : '✓ 一致')
				}
			}
		}
	}
	finally {
		await browser.close()
		await upstreamServer.close()
		await clarityServer.close()
	}

	const report = {
		generatedAt: new Date().toISOString(),
		matrix: { pages: PAGES.map(p => p.id), viewports: VIEWPORTS.map(v => `${v.width}x${v.height}`), modes: MODES },
		failures: allFailures,
		notes: allNotes,
		visual: visualStats,
	}
	mkdirSync(artifactsDir, { recursive: true })
	writeFileSync(join(artifactsDir, 'parity-report.json'), JSON.stringify(report, null, 2))

	return report
}

async function collectOne(browser, origin, path, viewport, mode) {
	const session = browser.session
	await openPage(browser, { url: origin + path, viewport, colorMode: mode })
	return await session.evaluate(collectionScript(criticalSelectors, STYLE_PROPS))
}

async function screenshot(browser, url, viewport, mode, outPath) {
	const session = browser.session
	await openPage(browser, { url, viewport, colorMode: mode })
	const shot = await session.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
	writeFileSync(outPath, Buffer.from(shot.data, 'base64'))
}

async function readPng(path) {
	const { decodePng } = await import('./png.mjs')
	return decodePng(path)
}

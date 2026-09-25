import { statSync } from 'node:fs'
/** 极简静态文件服务器（generate 产物服务；127.0.0.1 随机端口） */
import { createServer } from 'node:http'
import { join, normalize, resolve } from 'node:path'

const MIME = {
	'.html': 'text/html; charset=utf-8',
	'.js': 'text/javascript',
	'.mjs': 'text/javascript',
	'.css': 'text/css',
	'.json': 'application/json',
	'.svg': 'image/svg+xml',
	'.png': 'image/png',
	'.webp': 'image/webp',
	'.avif': 'image/avif',
	'.ico': 'image/x-icon',
	'.txt': 'text/plain',
	'.xml': 'application/xml',
	'.woff2': 'font/woff2',
	'.map': 'application/json',
}

export function serveStatic(rootDir) {
	const root = resolve(rootDir)
	const server = createServer((req, res) => {
		const urlPath = decodeURIComponent((req.url ?? '/').split('?')[0])
		let filePath = normalize(join(root, urlPath))
		if (!filePath.startsWith(root)) {
			res.writeHead(403)
			return res.end('forbidden')
		}
		const tryPaths = [
			filePath,
			join(filePath, 'index.html'),
			`${filePath}.html`,
		]
		const found = tryPaths.find(p => exists(p))
		if (!found) {
			res.writeHead(404)
			return res.end('not found')
		}
		filePath = found
		const ext = join(filePath).split('.').pop()
		res.writeHead(200, { 'content-type': MIME[`.${ext}`] ?? 'application/octet-stream' })
		// statSync/createReadStream 经动态 import 避免 ESM 顶层混乱
		import('node:fs').then(fs => fs.createReadStream(filePath).pipe(res))
	})
	return new Promise((resolveStart) => {
		server.listen(0, '127.0.0.1', () => {
			const { port } = server.address()
			resolveStart({ url: `http://127.0.0.1:${port}`, close: () => new Promise(r => server.close(r)) })
		})
	})
}

function exists(path) {
	try {
		return statSync(path).isFile()
	}
	catch {
		return false
	}
}

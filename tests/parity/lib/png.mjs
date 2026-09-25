/**
 * 纯 Node PNG 解码 + 像素差异（从 audit parity-lab/pixdiff.mjs 提取的正式实现）
 *
 * 仅支持 8-bit 非隔行 PNG（Chromium captureScreenshot 的输出即为此格式）。
 * diff 使用逐通道容差，输出标记差异像素的 diff 图。
 */
import { Buffer } from 'node:buffer'
import { readFileSync, writeFileSync } from 'node:fs'
import { inflateSync } from 'node:zlib'

export function decodePng(file) {
	const buf = readBuf(file)
	if (buf.readUInt32BE(0) !== 0x89504E47) {
		throw new Error(`${file}: 不是 PNG`)
	}
	let pos = 8
	let width = 0
	let height = 0
	let bitDepth = 0
	let colorType = 0
	const idat = []
	while (pos < buf.length) {
		const len = buf.readUInt32BE(pos)
		const type = buf.toString('ascii', pos + 4, pos + 8)
		const data = buf.subarray(pos + 8, pos + 8 + len)
		if (type === 'IHDR') {
			width = data.readUInt32BE(0)
			height = data.readUInt32BE(4)
			bitDepth = data[8]
			colorType = data[9]
			if (bitDepth !== 8) {
				throw new Error(`${file}: 仅支持 8-bit`)
			}
			if (data[12] !== 0) {
				throw new Error(`${file}: 不支持隔行 PNG`)
			}
		}
		else if (type === 'IDAT') {
			idat.push(data)
		}
		else if (type === 'IEND') {
			break
		}
		pos += 12 + len
	}

	const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[colorType]
	const raw = inflateSync(Buffer.concat(idat))
	const stride = width * channels
	const pixels = Buffer.alloc(width * height * 4)
	let prev = Buffer.alloc(stride)
	let ptr = 0
	for (let y = 0; y < height; y++) {
		const filter = raw[ptr++]
		const line = raw.subarray(ptr, ptr + stride)
		ptr += stride
		const cur = Buffer.from(line)
		for (let x = 0; x < stride; x++) {
			const left = x >= channels ? cur[x - channels] : 0
			const up = prev[x]
			const upLeft = x >= channels ? prev[x - channels] : 0
			switch (filter) {
				case 1: {
					cur[x] = (cur[x] + left) & 0xFF
					break
				}
				case 2: {
					cur[x] = (cur[x] + up) & 0xFF
					break
				}
				case 3: {
					cur[x] = (cur[x] + ((left + up) >> 1)) & 0xFF
					break
				}
				case 4: {
					const p = left + up - upLeft
					const pa = Math.abs(p - left)
					const pb = Math.abs(p - up)
					const pc = Math.abs(p - upLeft)
					cur[x] = (cur[x] + (pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft)) & 0xFF
					break
				}
			}
		}
		for (let x = 0; x < width; x++) {
			const o = (y * width + x) * 4
			switch (colorType) {
				case 6: {
					pixels.set(cur.subarray(x * 4, x * 4 + 4), o)
					break
				}
				case 2: {
					pixels[o] = cur[x * 3]
					pixels[o + 1] = cur[x * 3 + 1]
					pixels[o + 2] = cur[x * 3 + 2]
					pixels[o + 3] = 255
					break
				}
				case 0: {
					pixels[o] = cur[x]
					pixels[o + 1] = cur[x]
					pixels[o + 2] = cur[x]
					pixels[o + 3] = 255
					break
				}
				case 4: {
					pixels[o] = cur[x * 2]
					pixels[o + 1] = cur[x * 2]
					pixels[o + 2] = cur[x * 2]
					pixels[o + 3] = cur[(x * 2) + 1]
					break
				}
				case 3: {
					const idx = cur[x]
					for (let c = 0; c < 3; c++) {
						pixels[o + c] = paletteAt(buf, pos, (idx * 3) + c)
					}
					pixels[o + 3] = 255
					break
				}
			}
		}
		prev = cur
	}
	return { width, height, pixels }
}

/** 逐通道容差像素 diff；返回差异像素数、比例与 diff PNG Buffer（差异标红） */
export function diffPng(a, b, { tolerance = 8 } = {}) {
	if (a.width !== b.width || a.height !== b.height) {
		return { width: 0, height: 0, diffPixels: -1, ratio: 1, diffPng: null, sizeMismatch: true }
	}
	const { width, height } = a
	const diff = Buffer.alloc(width * height * 4)
	let diffPixels = 0
	for (let i = 0; i < width * height * 4; i += 4) {
		const delta = Math.max(
			Math.abs(a.pixels[i] - b.pixels[i]),
			Math.abs(a.pixels[i + 1] - b.pixels[i + 1]),
			Math.abs(a.pixels[i + 2] - b.pixels[i + 2]),
		)
		if (delta > tolerance) {
			diffPixels++
			diff[i] = 255
			diff[i + 3] = 255
		}
		else {
			// 保留灰度化的背景以便人工定位
			const gray = (a.pixels[i] + a.pixels[i + 1] + a.pixels[i + 2]) / 3 / 3
			diff[i] = gray
			diff[i + 1] = gray
			diff[i + 2] = gray
			diff[i + 3] = 255
		}
	}
	return {
		width,
		height,
		diffPixels,
		ratio: diffPixels / (width * height),
		diffPng: encodePng(width, height, diff),
		sizeMismatch: false,
	}
}

export function writeDiff(path, diffResult) {
	if (diffResult.diffPng) {
		writeFileSync(path, diffResult.diffPng)
	}
}

// ---------------------------------------------------------------------------
// PNG 编码（无压缩 zlib stored blocks，简单可靠）
// ---------------------------------------------------------------------------

function crc32(buf) {
	let c
	const table = crc32.table ??= (() => {
		const t = new Int32Array(256)
		for (let n = 0; n < 256; n++) {
			c = n
			for (let k = 0; k < 8; k++) {
				c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1
			}
			t[n] = c
		}
		return t
	})()
	c = 0xFFFFFFFF
	for (const byte of buf) {
		c = table[(c ^ byte) & 0xFF] ^ (c >>> 8)
	}
	return (c ^ 0xFFFFFFFF) >>> 0
}

function chunk(type, data) {
	const len = Buffer.alloc(4)
	len.writeUInt32BE(data.length)
	const typeBuf = Buffer.from(type, 'ascii')
	const crc = Buffer.alloc(4)
	crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])))
	return Buffer.concat([len, typeBuf, data, crc])
}

function adler32(buf) {
	let a = 1
	let b = 0
	for (const byte of buf) {
		a = (a + byte) % 65521
		b = (b + a) % 65521
	}
	const out = Buffer.alloc(4)
	out.writeUInt32BE(((b << 16) | a) >>> 0)
	return out
}

export function encodePng(width, height, rgba) {
	const stride = width * 4
	const raw = Buffer.alloc((stride + 1) * height)
	for (let y = 0; y < height; y++) {
		raw[y * (stride + 1)] = 0
		rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride)
	}
	// zlib stored blocks（每块 <= 65535 字节；LEN/NLEN 为小端，NLEN = ~LEN）
	const blocks = []
	for (let off = 0; off < raw.length; off += 65535) {
		const slice = raw.subarray(off, Math.min(off + 65535, raw.length))
		const len = slice.length
		const nlen = len ^ 0xFFFF
		const header = Buffer.from([
			off + 65535 >= raw.length ? 1 : 0,
			len & 0xFF,
			(len >> 8) & 0xFF,
			nlen & 0xFF,
			(nlen >> 8) & 0xFF,
		])
		blocks.push(header, slice)
	}
	const idat = Buffer.concat([
		Buffer.from([0x78, 0x01]),
		...blocks,
		adler32(raw),
	])
	const ihdr = Buffer.alloc(13)
	ihdr.writeUInt32BE(width, 0)
	ihdr.writeUInt32BE(height, 4)
	ihdr[8] = 8
	ihdr[9] = 6
	return Buffer.concat([
		Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
		chunk('IHDR', ihdr),
		chunk('IDAT', idat),
		chunk('IEND', Buffer.alloc(0)),
	])
}

function readBuf(file) {
	return readFileSync(file)
}

function paletteAt(_buf, _pos, _index) {
	// palette 使用场景不会出现（Chromium 输出 RGBA）；保留占位避免误用
	return 0
}

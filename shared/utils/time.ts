import { Temporal } from 'temporal-polyfill'

export function isSameUnit(date1: string, date2: string, unit: Temporal.DateTimeUnit, timeZone = 'UTC') {
	try {
		const p1 = toZonedTemporal(date1, timeZone).toPlainDateTime()
		const p2 = toZonedTemporal(date2, timeZone).toPlainDateTime()
		return p1.until(p2, {
			largestUnit: unit,
			smallestUnit: unit,
			roundingMode: 'trunc',
		}).blank
	}
	catch {
		return false
	}
}

/** 检查两个时间相对现在是否相差显著 */
export function isTimeDiffSignificant(
	date1?: string,
	date2?: string,
	timeZone = 'UTC',
	/** 对于时间差的敏感程度，0~1 之间，1:不同则认为显著，>1:始终认为显著 */
	threshold = 0.6,
) {
	if (!date1 || !date2 || threshold <= 0)
		return false
	if (threshold > 1)
		return true
	try {
		const now = Temporal.Now.instant().epochMilliseconds
		const diff1 = now - toZonedTemporal(date1, timeZone).epochMilliseconds
		const diff2 = now - toZonedTemporal(date2, timeZone).epochMilliseconds
		return diff1 / diff2 < threshold || diff2 / diff1 < threshold
	}
	catch {
		return true
	}
}

const timeIntervals = [
	{ label: '世纪', threshold: 60 * 60 * 24 * 365.2422 * 100 },
	{ label: '年', threshold: 60 * 60 * 24 * 365.2422 },
	{ label: '个月', threshold: 60 * 60 * 24 * 30.44 },
	{ label: '天', threshold: 60 * 60 * 24 },
	{ label: '小时', threshold: 60 * 60 },
	{ label: '分', threshold: 60 },
	{ label: '秒', threshold: 1 },
]

export function timeElapse(date: string | Temporal.PlainDateTime, maxDepth = 2) {
	let timeString = ''
	let secRemained = Temporal.Now.plainDateTimeISO().since(date, { largestUnit: 'second' }).seconds
	for (const interval of timeIntervals) {
		const count = Math.floor(secRemained / interval.threshold)
		if (count <= 0)
			continue
		timeString += `${count}${interval.label}`
		secRemained -= count * interval.threshold
		if (--maxDepth <= 0)
			break
	}
	return timeString || '刚刚'
}

export function toInstantString(date: string | Temporal.ZonedDateTime, timeZone = 'UTC') {
	return (typeof date === 'string' ? toZonedTemporal(date, timeZone) : date).toInstant().toString()
}

/**
 * 将日期字符串解析为带时区的 Temporal 对象
 * @param timeZone 无时区信息时使用的默认时区（来自站点配置）
 */
export function toZonedTemporal(date: string, timeZone = 'UTC') {
	try {
		return Temporal.ZonedDateTime.from(date)
	}
	catch {
		try {
			return Temporal.Instant.from(date).toZonedDateTimeISO(timeZone)
		}
		catch {
			return Temporal.PlainDateTime.from(date).toZonedDateTime(timeZone)
		}
	}
}

export const dateTimeFormat = {
	date: {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	},
	monthDay: {
		month: '2-digit',
		day: '2-digit',
	},
	full: {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		weekday: 'long',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		timeZoneName: 'long',
	},
} satisfies Record<string, Intl.DateTimeFormatOptions>

export type dateTimeFormatOptions = keyof typeof dateTimeFormat | Intl.DateTimeFormatOptions

export function toZdtLocaleString(date: string | Temporal.ZonedDateTime, format: dateTimeFormatOptions = 'full', timeZone = 'UTC') {
	return (typeof date === 'string' ? toZonedTemporal(date, timeZone) : date)
		.toLocaleString(undefined, typeof format === 'string' ? dateTimeFormat[format] : format)
}

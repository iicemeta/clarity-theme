export const FALLBACK_TIMEZONE = 'UTC'

/**
 * Validate a timezone with the same ICU database Node uses at runtime.
 * This intentionally accepts IANA links such as Asia/Taipei and rejects
 * fixed-offset spellings that Intl does not support.
 */
export function isValidTimezone(value) {
	if (typeof value !== 'string') {
		return false
	}
	const timezone = value.trim()
	// eslint-disable-next-line no-control-regex -- rejecting control characters is the purpose of this check
	if (!timezone || timezone.length > 200 || /[\0-\x1F]/.test(timezone)) {
		return false
	}
	try {
		new Intl.DateTimeFormat('en-US', { timeZone: timezone }).format(new Date())
		return true
	}
	catch {
		return false
	}
}

/**
 * Resolve the creator timezone priority:
 *
 *   explicit CLI option > detected system timezone > UTC fallback
 *
 * `resolveSystemTimezone` is injectable so tests can verify every branch without
 * depending on the machine running the test suite.
 */
export function detectTimezone(resolveSystemTimezone = readSystemTimezone) {
	let detected
	try {
		detected = resolveSystemTimezone()
	}
	catch {
		return FALLBACK_TIMEZONE
	}
	return isValidTimezone(detected) ? detected : FALLBACK_TIMEZONE
}

function readSystemTimezone() {
	return new Intl.DateTimeFormat().resolvedOptions().timeZone
}

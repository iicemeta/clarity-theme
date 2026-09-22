export default (sourcesEncoded: string[], targetEncoded: string) => {
	const sources = sourcesEncoded.map(atob)
	const canonicalHost = new URL(atob(targetEncoded)).host
	const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
	const isBadMirror = sources.some(domain => location.hostname.endsWith(domain))
	if (isBadMirror) {
		if (canonical)
			canonical.href = canonical.href.replace(location.host, canonicalHost)
		location.host = canonicalHost
	}
}

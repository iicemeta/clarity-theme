import { defineClarityConfig } from 'clarity-theme/config'

export default defineClarityConfig({
	site: {
		title: '{{SITE_TITLE}}',
		description: '{{SITE_DESCRIPTION}}',
		url: '{{SITE_URL}}',
		language: '{{LANGUAGE}}',
		timezone: '{{TIMEZONE}}',
		author: {
			name: '{{AUTHOR_NAME}}',
		},
	},
})

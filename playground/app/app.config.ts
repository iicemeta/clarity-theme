export default defineAppConfig({
	clarity: {
		header: {
			emojiTail: ['📝', '✨', '🌱'],
		},
		// 兼容性矩阵：把分页压到 1 页 1 篇，让 /?page=2 成为可断言的分页分支
		pagination: {
			perPage: 1,
		},
	},
})

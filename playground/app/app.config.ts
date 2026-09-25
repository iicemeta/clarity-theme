export default defineAppConfig({
	// 兼容性矩阵：把分页压到 1 页 1 篇，让 /?page=2 成为可断言的分页分支。
	// header 等其余 UI 走 Theme 注入默认值（与旧 clarity.header 覆盖等效）。
	pagination: {
		perPage: 1,
		sortOrder: 'date',
		allowAscending: false,
	},
})

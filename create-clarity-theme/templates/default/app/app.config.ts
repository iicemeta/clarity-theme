// 按上游扁平形状覆盖 Theme 的 UI 默认值（与 blog-v3 的 app/app.config.ts 一致）。
// 可覆盖的键：component / footer / header / link / nav / pagination / themes。
// 注意：覆盖某个键时必须给出**完整对象**（例如 header 需要 logo、showTitle、
// subtitle、emojiTail 四个字段），字段不全无法通过类型检查。
// 例：
//   header: { logo: '/favicon.svg', showTitle: true, subtitle: '', emojiTail: ['📝'] }
//   pagination: { perPage: 10, sortOrder: 'date', allowAscending: false }
export default defineAppConfig({})

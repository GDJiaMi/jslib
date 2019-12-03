/**
 * 字符串操作相关函数
 */

const _MATCH_HTML = /[&<>'"]/g
const _ENCODE_HTML_RULES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&#34;',
  "'": '&#39;',
}
function encode_char(c: string) {
  return _ENCODE_HTML_RULES[c] || c
}

/**
 * 转译HTML，将string中的 "&", "<", ">", '"', "'" 进行转义，注入html中
 *
 * @param markup html 字符串
 *
 * @returns 转义后的字符串
 *
 * @example
 *
 * ```js
 * escapeHTML('<div>123</div>') // => '&lt;div&gt;123&lt;/div&gt;'
 * ```
 */
export function escapeHTML(markup: string) {
  return markup == null ? '' : String(markup).replace(_MATCH_HTML, encode_char)
}

/**
 * 获取本地图片文件的预览地址
 *
 * @param file 图片文件
 *
 * @example
 *
 * ```
 * setupLocalPreviewUrl(file) // => 'blob:https://localhost:8080/1fac6c73-4fb8-48fd-84d0-bac9e109564f'
 * ```
 */
export function setupLocalPreviewUrl(file: File) {
  // @ts-ignore
  if (window.createObjectURL != null) {
    // @ts-ignore
    return window.createObjectURL(file)
  }
  return URL.createObjectURL(file)
}

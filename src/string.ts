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

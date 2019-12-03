/**
 * 时间相关的帮助方法
 */

/**
 * 数字截取后两位，处理时间转换‘0’占位
 */
function formatValue(d: number) {
  return `0${d}`.slice(-2)
}

/**
 * 时间或时间戳转换成 YYYY-mm-DD HH:MM:SS
 * @param date 时间
 * @param options showTime: 是否显示时间；showSec: 是否显示秒数
 *
 * @example
 * ```js
 * formatDate(1575370479028) // => '2019-12-03'
 * formatDate(1575370479028,{ showTime: true }) // => '2019-12-03 18:54'
 * ```
 */
export function formatDate(
  date: number | Date,
  options?: { showTime?: boolean; showSec?: boolean },
) {
  if (!date) {
    return ''
  }
  const d = new Date(date)
  const year = d.getFullYear()
  const month = formatValue(d.getMonth() + 1)
  const day = formatValue(d.getDate())
  const hour = formatValue(d.getHours())
  const minute = formatValue(d.getMinutes())
  const seconds = formatValue(d.getSeconds())
  return (
    `${year}-${month}-${day}` +
    (options && options.showTime
      ? ` ${hour}:${minute}` + (options.showSec ? `:${seconds}` : '')
      : '')
  )
}

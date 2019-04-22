/**
 * 字符串格式化
 */

export const TB = 2 ** 40
export const GB = 2 ** 30
export const MB = 2 ** 20
export const KB = 2 ** 10

/**
 * 格式化文件长度
 */
export function formatSize(size: number) {
  let s: number = size
  let unit = 'KB'
  if ((s = size / TB) >= 1) {
    unit = 'TB'
  } else if ((s = size / GB) >= 1) {
    unit = 'GB'
  } else if ((s = size / MB) >= 1) {
    unit = 'MB'
  } else {
    s = size / KB
  }

  return `${s.toFixed(2)}${unit}`
}

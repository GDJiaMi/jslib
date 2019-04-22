/**
 * 函数相关工具函数
 */

/**
 * 空函数，一般用于占位
 */
export const noop = (...args: any): any => {}

/**
 * 空函数，一般用于占位. 可以提供一个警告信息
 */
export const noopWithWarn = (message: string) => (...args: any): any => {
  console.warn(message)
}

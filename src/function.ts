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

/**
 * 销毁器队列，存储多个销毁器，在组件卸载时调用 clear 方法
 *
 * @example
 *
 * ```js
 * useEffect(() => {
 *   const d = disposer()
 *   d.add(() => {
 *    ...
 *    return () => {
 *      // 销毁
 *      ...
 *    }
 *   })
 *   return d.clear
 * })
 *
 * ```
 */
export function disposer() {
  let list: Function[] = []
  return {
    add: (i: Function) => list.push(i),
    clear: () => {
      list.forEach(i => i())
      list = []
    },
  }
}

/**
 * 返回disposer的 setTimeout
 *
 * @param callback 延时操作方法
 * @param time 延时时长
 *
 * @example
 * ```js
 * timeout(() => { ... }, 1000)
 * ```
 */
export function timeout(callback: () => void, time: number) {
  const timer = setTimeout(callback, time)
  return () => {
    clearTimeout(timer)
  }
}

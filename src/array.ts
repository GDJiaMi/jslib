/**
 * 数组对象相关函数操作
 * 包括数组间隔插入数据
 */

/**
 * 将指定数据间隔插入数组中，返回新数组，不改变原数组
 *
 * @param arr 原数组
 * @param data 插入数据
 *
 * @example
 * ```js
 * arrayJoin([{a: 1}, {b: 1}, {c: 1}], {x: 0})
 * // => [{a: 1}, {x: 0}, {b: 1}, {x: 0}, {c: 1}]
 * ```
 */
export function arrayJoin<R>(arr: R[], data: R) {
  if (arr.length <= 1) {
    return arr
  }
  let temp = []
  for (let i = 0; i < arr.length; i = i + 1) {
    temp.push(arr[i])
    if (i < arr.length - 1) {
      temp.push(data)
    }
  }
  return temp
}

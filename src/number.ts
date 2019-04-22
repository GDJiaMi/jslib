/**
 * 数字相关的操作
 */

let uid = 0

/**
 * 遍历n次
 * @param time
 * @param it
 */
export function times<T>(time: number, it: (index: number) => T): T[] {
  const arr: T[] = []
  for (let i = 0; i < time; i++) {
    arr.push(it(i))
  }
  return arr
}

/**
 * 获取指定范围整数随机数, 不包括max
 * @param min
 * @param max
 */
export function getRandomInt(min: number, max: number) {
  const _min = Math.ceil(min)
  const _max = Math.floor(max)
  return Math.floor(Math.random() * (_max - _min)) + _min
}

/**
 * 获取简单的随机数
 */
export function getUid() {
  return (uid = uid + (1 % (Number.MAX_SAFE_INTEGER - 1)))
}

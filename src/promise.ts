/**
 * promise相关的工具函数
 */
export type PromiseResolver<T> = (val: T) => void
export type PromiseReject = (reason: any) => void
export type PromiseCallback<T> = (
  res: PromiseResolver<T>,
  rej: PromiseReject,
) => void

/**
 * 延迟指定毫秒
 */
export async function delay(ms: number) {
  return new Promise(res => setTimeout(res, ms))
}

/**
 * 增加超时机制的promise
 */
export async function promiseWithTimeout<T>(
  prom: PromiseCallback<T>,
  timeout: number,
) {
  return new Promise<T>((resolve, reject) => {
    let resolved: boolean
    const resolver = (val: T) => {
      if (resolved) {
        return
      }

      resolved = true
      resolve(val)
    }

    const rejector = (reason: any) => {
      if (resolved) {
        return
      }

      resolved = true
      reject(reason)
    }

    setTimeout(() => rejector(new Error('timeout')), timeout)
    prom(resolver, rejector)
  })
}

/**
 * 可重试的promise, 出现异常时进行重试
 * @param prom
 * @param time 重试的次数
 * @param duration 重试的间隔
 */
export async function retryablePromise<T>(
  prom: () => Promise<T>,
  time: number = 1,
  duration: number = 0,
) {
  for (let i = 0; i < time; i++) {
    try {
      const rt = await prom()
      return rt
    } catch (err) {
      if (i < time) {
        await delay(duration)
        continue
      }

      throw err
    }
  }
  return undefined
}

/**
 * 抽取出promise的Resolve和Reject函数, 可以在外部进行使用
 */
export async function extraPromise<T>() {
  let resolve: PromiseResolver<T>
  let reject: PromiseReject
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })

  await delay(0)

  return {
    promise,
    reject: reject!,
    resolve: resolve!,
  }
}

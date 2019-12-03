/**
 * HTTP 请求相关函数
 */
import qs from 'qs'
import { getUid } from './number'
import { noop } from './function'

const JSONP_PREFIX = '__jp'

/**
 * 解析查询字符串
 *
 * @example
 * ```js
 * getSearch('?id=1&name=a')
 * ```
 *
 * @param search 查询字符串
 *
 * @returns 格式化后对象
 */
export function getSearch(search: string) {
  search = search.startsWith('?') ? search.slice(1) : search
  return qs.parse(search)
}

/**
 * 格式化对象为查询字符串, 不包含‘?’前缀
 *
 * @example
 * ```js
 * searchStringify({id: 1, name: 'a'})
 * ```
 *
 * @param obj 格式化对象
 *
 * @returns 格式化后字符串
 */
export function searchStringify(obj: object) {
  return qs.stringify(obj)
}

/**
 * 追加查询字符串到url上
 *
 * @example
 * ```js
 * appendQuery('xxx.html?id=1', { name: 'a' })
 * ```
 *
 * @returns 追加后的 url
 */
export function appendQuery(url: string, obj: object) {
  const params = searchStringify(obj)
  return url + (url.indexOf('?') === -1 ? '?' : '&') + params
}

/**
 * JSONP 请求
 * @param url 请求地址
 * @param params 请求参数
 * @param options 设置，可配置回调函数及超时时间
 */
export default async function jsonp<T>(
  url: string,
  params: object,
  options: {
    callback?: string
    timeout?: number
  } = {},
) {
  const finalOptions = {
    callback: 'callback',
    timeout: 10000,
    ...options,
  }

  const prefix = `${JSONP_PREFIX}_${getUid}`
  const finalParams = {
    [finalOptions.callback]: prefix,
    ...params,
  }
  const finalUrl = appendQuery(url, finalParams)
  const target = document.getElementsByTagName('script')[0] || document.head
  const script = document.createElement('script')
  script.src = finalUrl

  return new Promise<T>((res, rej) => {
    let resolved = false
    let timer: number

    const cleanup = () => {
      if (resolved) {
        return
      }
      resolved = true
      clearTimeout(timer)
      if (script.parentNode) {
        script.parentNode.removeChild(script)
        window[prefix] = noop
      }
    }

    timer = window.setTimeout(() => {
      cleanup()
      rej(new Error('请求超时'))
    }, finalOptions.timeout)

    window[prefix] = (data: T) => {
      cleanup()
      res(data)
    }

    target.parentNode!.insertBefore(script, target)
  })
}

/**
 * 获取地址参数
 * @param key 参数 key 值
 *
 * @example
 *
 * ```js
 * window.location.href = 'http://xxx.html?id=007&name=test'
 * getUrlParam(id) // => '007'
 * getUrlParam(name) // => 'test'
 * getUrlParam(age) // => null
 * ```
 */
export function getUrlParam(key: string) {
  const urlStatus = new URLSearchParams(location.hash.split('?')[1])
  return urlStatus.get(key)
}

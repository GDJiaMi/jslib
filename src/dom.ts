/**
 * DOM 相关的函数
 */

/**
 * 隐藏元素
 * 运用于应用的开场动画或者动画切换
 *
 * @param element CSS 选择器
 * @param className 隐藏效果类名
 * @param timeout 延迟隐藏时间
 *
 * @example
 *
 * ```js
 * hide('.my-el', 'hide')
 * ```
 */
export function hide(
  element: string,
  className: string,
  timeout: number = 1000,
) {
  const ele: HTMLElement | null = document.querySelector(element)
  if (ele == null) {
    return
  }
  let timer: number
  const hide = () => {
    ele.style.display = 'none'
    window.clearTimeout(timer)
  }
  timer = window.setTimeout(hide, timeout)
  ele.addEventListener('animationend', hide)
  ele.addEventListener('webkitAnimationEnd', hide)
  ele.classList.add(className)
}

/**
 * 全局存储 importScript 资源
 */
const _importedScript: { [src: string]: true } = {}

/**
 * 通过 script 异步加载资源，用于动态导入外部链接资源
 * 在需要使用到某个外部资源时，通过动态导入，实现按需加载
 *
 * @param src 注入的脚本字符串
 *
 * @example
 *
 * ```js
 * importScript(`http://xxx.js`)
 * ```
 */
export async function importScript(src: string): Promise<undefined> {
  return new Promise((resolve, reject) => {
    const headElement =
      document.head || document.getElementsByTagName('head')[0]
    if (src in _importedScript) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.onerror = err => {
      reject(new URIError(`The Script ${src} is no accessible.`))
    }
    script.onload = () => {
      _importedScript[src] = true
      resolve()
    }
    headElement.appendChild(script)
    script.src = src
  })
}

/**
 * 动态生成 css 类名
 * 通过传入kv对象，在判断value值，动态计算节点类名
 * 运用于状态切换时，类名的变化
 *
 * @param opt key-value 对象，通过判断 value 是否添加 key
 * @param other 静态类名
 *
 * @example
 *
 * ```js
 * cls({ active: true }, 'tab')  // => 'active tab'
 * cls({ active: false }, 'tab')  // => ' tab'
 * ```
 */
export function cls(opt: { [name: string]: any }, ...other: string[]) {
  return Object.keys(opt)
    .filter(key => !!opt[key])
    .concat(other)
    .join(' ')
}

/**
 * 在指定时间内避免重复执行操作，避免用户多次点击，触发执行操作
 *
 * @param fn 执行的操作
 * @param duration 规定时间
 *
 * @example
 *
 * ```js
 * const openIndex = preventReEnter(() => openPage('index'), 1000)
 * <button onClick={openIndex}>打开首页</button>
 * ```
 */
export function preventReEnter<T extends (...args: any[]) => void>(
  fn: T,
  duration: number = 1000,
) {
  let pending = false
  return ((...args: any[]) => {
    if (pending) {
      return
    }

    pending = true
    setTimeout(() => {
      pending = false
    }, duration)

    fn(...args)
  }) as T
}

/**
 * 获取限制了最大的宽度或高度后的图片的缩放大小
 * const max = Math.max(w, h, maxSize)
 * 当图片的宽度 === max 时，需要计算出等比情况下的图片高度；
 * 当图片的高度 === max 时，需要计算出等比情况下的图片宽度；
 * 否则返回原图片宽高。
 *
 * @param w 图片宽度
 * @param h 图片高度
 * @param maxSize 图片缩放的最大尺寸
 *
 * @example
 *
 * ```js
 * getImgWHByMax(100, 100, 200)
 * // => { w: 100, h: 100}
 * ```
 */
export function getImgWHByMax(w: number, h: number, maxSize: number) {
  const rate = w / h
  const max = Math.max(w, h, maxSize)
  if (w === max) {
    return { w: maxSize, h: maxSize / rate }
  } else if (h === max) {
    return { w: maxSize * rate, h: maxSize }
  } else {
    return { w, h }
  }
}

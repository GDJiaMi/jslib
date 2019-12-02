/**
 * DOM 相关的函数
 */

/**
 * 隐藏元素
 *
 * @example
 *
 * ```js
 * hide('.my-el', 'hide')
 * ```
 *
 * @param element CSS 选择器
 * @param className 隐藏效果类名
 * @param timeout 延迟隐藏时间
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
 * 通过script异步加载资源
 *
 *
 * @example
 *
 * ```js
 * importScript(`function foo(){console.log('hello world')}`)
 * ```
 *
 * @param src 注入的脚本字符串
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
 *
 * @example
 *
 * ```js
 * cls({active: true}, 'tab')
 * ```
 *
 * @param opt key-value 对象，通过判断 !!value 是否添加 key
 * @param other 静态类名
 */
export function cls(opt: { [name: string]: any }, ...other: string[]) {
  return Object.keys(opt)
    .filter(key => !!opt[key])
    .concat(other)
    .join(' ')
}

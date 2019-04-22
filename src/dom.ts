/**
 * DOM 相关的函数
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

const _importedScript: { [src: string]: true } = {}

/**
 * 通过script加载资源
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
 * 生成css 类名
 */
export function cls(opt: { [name: string]: any }, ...other: string[]) {
  return Object.keys(opt)
    .filter(key => !!opt[key])
    .concat(other)
    .join(' ')
}

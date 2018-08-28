export default function hide(
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

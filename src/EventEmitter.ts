/**
 * 简单事件订阅模式
 */
export class EventEmitter {
  private static listeners: { [key: string]: Function[] } = {}
  public addEventListener(name: string, callback: (...args: any[]) => void) {
    if (EventEmitter.listeners[name]) {
      EventEmitter.listeners[name].push(callback)
    } else {
      EventEmitter.listeners[name] = [callback]
    }

    return () => this.removeEventListener(name, callback)
  }

  public removeEventListener(name: string, callback: (...args: any[]) => void) {
    if (EventEmitter.listeners[name]) {
      const idx = EventEmitter.listeners[name].findIndex(i => i === callback)
      if (idx !== -1) {
        EventEmitter.listeners[name].splice(idx, 1)
      }
    }
  }

  public emit(name: string, ...args: any[]) {
    const list = EventEmitter.listeners[name]
    if (list) {
      list.forEach(callback => callback(...args))
    }
  }
}

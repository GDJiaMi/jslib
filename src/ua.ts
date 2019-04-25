/**
 * 浏览器用户代理判断
 */

const UA = navigator.userAgent.toLowerCase()

/**
 * macOS
 */
export const isMac = UA.indexOf('macintosh') !== -1

/**
 * Windows
 */
export const isWindows = UA.indexOf('windows') !== -1

/**
 * 桌面端
 */
export const isDesktop = isMac || isWindows

/**
 * iphone
 */
export const isIphone = UA.indexOf('iphone') !== -1

/**
 * ipad
 */
export const isIpad = UA.indexOf('ipad') !== -1

/**
 * iOS
 */
export const isIos = isIphone || isIpad

/**
 * Android
 */
export const isAndroid = UA.indexOf('android') !== -1

/**
 * isMobile
 */
export const isMobile = isIos || isAndroid

/**
 * 微信小程序
 */
export const isMiniProgram = UA.indexOf('miniprogram') !== -1

/**
 * 工作宝
 */
export const isGZB = UA.indexOf('gzb') !== -1

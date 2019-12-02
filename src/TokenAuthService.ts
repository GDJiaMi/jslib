/**
 * 通用的Token鉴权机制服务
 */
import { getSearch } from './http'
import { EventEmitter } from './EventEmitter'

export const SMS_CLIENT_TYPE = ['qxSMS', 'qxEEMS', 'qxEMS', 'qxCMS']
export const TOKEN_HEADER = 'X-Access-Token'

/**
 * 鉴权类型
 */
export enum GRANT_TYPE {
  Auth = 'authorization_code',
  Refresh = 'refresh_token',
}
const TOKEN_CACHE_KEY = '__auth__'
const REFRESH_DURATION = 10 * 1000

/**
 * 鉴权信息
 */
export interface AuthInfo {
  accessToken: string
  refreshToken: string
  deadline: number
  corpId: string
  clientType: string
  userId: string
  name: string
}

/**
 * 鉴权参数
 */
export interface AuthParams {
  code: string
  corpId: string
  clientId: string
  grantType: GRANT_TYPE
}

/**
 * 基于密码的鉴权参数
 */
export interface AuthByPasswordParams {
  user: string
  password: string
  extra?: any
}

/**
 * refresh token 参数
 */
export interface RefreshParams {
  refreshToken: string
  grantType: GRANT_TYPE
}

/**
 * 配置项
 */
export interface TokenAuthServiceConfig {
  clientId: string
  /**
   * 通过code鉴权
   */
  getToken?: (params: AuthParams) => Promise<AuthInfo>
  /**
   * 通过用户名密码鉴权
   */
  getTokenByPassword?: (params: AuthByPasswordParams) => Promise<AuthInfo>
  /**
   * 刷新token
   */
  refreshToken: (params: RefreshParams) => Promise<AuthInfo>
  onAuthSuccess?: (info: AuthInfo) => void
  onAuthFailed?: (error: Error) => void
  onRefreshFailed?: (error: Error) => void
  refreshErrorMessage?: string
  storage?: Storage
}

/**
 * 基于Token的鉴权服务
 * ## events
 * info-updated
 */
export class TokenAuthService extends EventEmitter {
  public static INFO_UPDATED = 'info-updated'
  private config: TokenAuthServiceConfig
  private info: AuthInfo
  private refreshing: boolean
  private refreshCallbacks: Array<(err?: Error) => void> = []
  private lastRefreshTime?: number
  private refreshTimer: number

  public constructor(config: TokenAuthServiceConfig) {
    super()
    this.config = config
    this.getUserInfo()
  }

  private get storage() {
    return (this.config && this.config.storage) || window.sessionStorage
  }

  public logout() {
    this.clean()
  }

  public clean() {
    // @ts-ignore
    this.info = undefined
    this.storage.removeItem(TOKEN_CACHE_KEY)
  }

  /**
   * 更新鉴权信息
   */
  public saveAuthInfo(info: AuthInfo) {
    this.info = info
    this.storage.setItem(TOKEN_CACHE_KEY, JSON.stringify(info))
    this.infoUpdated()
  }

  /**
   * 通过用户名密码鉴权
   */
  public async authByPassword(params: AuthByPasswordParams) {
    if (this.config.getTokenByPassword == null) {
      throw new Error('TokenAuthService: getTokenByPassword 未实现')
    }

    const info = this.storage.getItem(TOKEN_CACHE_KEY)
    if (info != null) {
      this.info = JSON.parse(info)
      if (this.config.onAuthSuccess) {
        this.config.onAuthSuccess(this.info)
      }
      return
    }

    try {
      const res = await this.config.getTokenByPassword(params)
      this.saveAuthInfo(res)
      this.handleAuthSuccess()
    } catch (err) {
      if (this.config.onAuthFailed) {
        this.config.onAuthFailed(err)
      }
      throw err
    }
  }

  /**
   * token 鉴权
   */
  public async auth(overrideParams?: object) {
    if (this.config.getToken == null) {
      throw new Error('TokenAuthService: getToken 未实现')
    }

    const info = this.storage.getItem(TOKEN_CACHE_KEY)
    if (info != null) {
      this.info = JSON.parse(info)
      if (this.config.onAuthSuccess) {
        this.config.onAuthSuccess(this.info)
      }
      return
    }

    try {
      const params = getSearch(window.location.search) as
        | {
            code: string
            corp_id?: string
          }
        | ({
            from: string // 来源于其他端，这里会直接携带token
          } & AuthInfo)

      if ('from' in params) {
        // 直接登录
        if (params.accessToken == null) {
          throw new Error(`鉴权失败(from=${params.from})，accessToken为null`)
        }
        this.saveAuthInfo(params)
        this.handleAuthSuccess()
        return
      }

      if (params.code == null) {
        throw new Error('鉴权失败，code为null')
      }

      const payload = {
        code: params.code,
        corpId: params.corp_id || '',
        clientId: this.config.clientId,
        grantType: GRANT_TYPE.Auth,
        ...(overrideParams || {}),
      }

      const res = await this.config.getToken(payload)
      this.saveAuthInfo(res)
      this.handleAuthSuccess()
    } catch (err) {
      if (this.config.onAuthFailed) {
        this.config.onAuthFailed(err)
      }
      throw err
    }
  }

  /**
   * 刷新token
   * 这个方法可能会被调用多次，所以要将它们加入队列，以便后续重试
   */
  public async refresh() {
    if (this.info == null) {
      throw new Error('必须在鉴权之后才能刷新Token')
    }

    if (this.refreshing) {
      let resRef: () => void
      let rejRef: (err: Error) => void
      const promise = new Promise((res, rej) => {
        resRef = res
        rejRef = rej
      })
      this.refreshCallbacks.push(
        (err?: Error) => (err != null ? rejRef(err) : resRef()),
      )
      await promise
      return
    }

    // 判断是否重复刷新, 这可能导致无限请求

    try {
      const params = {
        refreshToken: this.info.refreshToken,
        grantType: GRANT_TYPE.Refresh,
      }
      const res = await this.config.refreshToken(params)

      const now = Date.now()
      if (
        this.lastRefreshTime != null &&
        now - this.lastRefreshTime < REFRESH_DURATION
      ) {
        throw new Error(this.config.refreshErrorMessage || '会话失效')
      }

      this.lastRefreshTime = now
      this.saveAuthInfo({ ...this.info, ...res })
      if (this.refreshCallbacks.length) {
        const list = this.refreshCallbacks
        this.refreshCallbacks = []
        list.forEach(i => i())
      }
    } catch (err) {
      if (this.refreshCallbacks.length) {
        const list = this.refreshCallbacks
        this.refreshCallbacks = []
        list.forEach(i => i(err))
      }
      if (this.config.onRefreshFailed) {
        this.config.onRefreshFailed(err)
      }
      // 清理鉴权信息
      this.clean()
      throw err
    } finally {
      this.refreshing = false
    }
  }

  public isAdmin() {
    return SMS_CLIENT_TYPE.indexOf(this.info.clientType) !== -1
  }

  /**
   * 获取token
   */
  public getToken() {
    return this.info && this.info.accessToken
  }

  /**
   * 获取用户信息
   */
  public getUserInfo() {
    if (this.info) {
      return this.info
    }

    const info = this.storage.getItem(TOKEN_CACHE_KEY)
    if (info != null) {
      this.info = JSON.parse(info)
    }

    return this.info
  }

  private infoUpdated() {
    this.emit(TokenAuthService.INFO_UPDATED, this.info)
    const deadline = this.info.deadline
    if (deadline == null || this.config.refreshToken == null) {
      return
    }

    const delta = deadline - Date.now()
    if (delta > 0) {
      window.clearTimeout(this.refreshTimer)
      this.refreshTimer = window.setTimeout(() => {
        this.refresh()
      }, Math.floor(delta * 0.7))
    }
  }

  private handleAuthSuccess() {
    if (this.config.onAuthSuccess) {
      this.config.onAuthSuccess(this.info)
    }
  }
}

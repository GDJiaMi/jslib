/**
 * 通用的Token鉴权机制服务
 */
import getSearch from '../getSearch'

export const SMS_CLIENT_TYPE = ['qxSMS', 'qxEEMS', 'qxEMS', 'qxCMS']
export const TOKEN_HEADER = 'X-Access-Token'
export enum GRANT_TYPE {
  Auth = 'authorization_code',
  Refresh = 'refresh_token',
}
const TOKEN_CACHE_KEY = '__auth__'

export interface AuthInfo {
  accessToken: string
  refreshToken: string
  deadline: number
  corpId: string
  clientType: string
  userId: string
  name: string
}

export interface AuthParams {
  code: string
  corpId: string
  clientId: string
  grantType: GRANT_TYPE
}

export interface AuthByPasswordParams {
  user: string
  password: string
  extra?: any
}

export interface RefreshParams {
  refreshToken: string
  grantType: GRANT_TYPE
}

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
  refreshToken: (params: RefreshParams) => Promise<AuthInfo>
  onAuthSuccess?: (info: AuthInfo) => void
  onAuthFailed?: (error: Error) => void
  onRefreshFailed?: (error: Error) => void
  storage?: Storage
}

export default class TokenAuthService {
  private config: TokenAuthServiceConfig
  private info: AuthInfo
  private refreshing: boolean
  private refreshCallbacks: Array<(err?: Error) => void> = []

  public constructor(config: TokenAuthServiceConfig) {
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
      if (this.config.onAuthSuccess) {
        this.config.onAuthSuccess(res)
      }
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
  public async auth() {
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
      const params = getSearch(window.location.search) as Partial<{
        code: string
        corp_id: string
      }>

      if (params.code == null) {
        throw new Error('鉴权失败，code为null')
      }

      const payload = {
        code: params.code!,
        corpId: params.corp_id || '',
        clientId: this.config.clientId,
        grantType: GRANT_TYPE.Auth,
      }

      const res = await this.config.getToken(payload)
      this.saveAuthInfo(res)
      if (this.config.onAuthSuccess) {
        this.config.onAuthSuccess(this.info)
      }
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

    try {
      const params = {
        refreshToken: this.info.refreshToken,
        grantType: GRANT_TYPE.Refresh,
      }
      const res = await this.config.refreshToken(params)
      this.info = { ...this.info, ...res }
      this.storage.setItem(TOKEN_CACHE_KEY, JSON.stringify(this.info))
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

  public getToken() {
    return this.info && this.info.accessToken
  }

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
}

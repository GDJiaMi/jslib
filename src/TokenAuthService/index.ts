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

export interface RefreshParams {
  refreshToken: string
  grantType: GRANT_TYPE
}

export interface TokenAuthServiceConfig {
  clientId: string
  getToken: (params: AuthParams) => Promise<AuthInfo>
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
  }

  private get storage() {
    return (this.config && this.config.storage) || window.sessionStorage
  }

  /**
   * token 鉴权
   */
  public async auth() {
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
      this.storage.setItem(TOKEN_CACHE_KEY, JSON.stringify(res))
      this.info = res
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
    return this.info
  }
}

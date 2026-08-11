import { defineStore } from 'pinia'

// ========== 品牌设置类型 ==========
export interface BrandSettings {
  /** 浏览器主标签标题 */
  browserTitle: string
  /** 浏览器图标 favicon（图片 URL 或 base64） */
  favicon: string
  /** 登录页 Logo（图片 URL 或 base64） */
  loginLogo: string
  /** 登录页品牌名称 */
  loginBrandName: string
  /** 登录页品牌副标题 */
  loginSubtitle: string
  /** 登录页背景图（图片 URL 或 base64） */
  loginBackground: string
  /** 主界面 Header Logo（图片 URL 或 base64） */
  headerLogo: string
  /** 主界面标题 */
  headerTitle: string
}

const STORAGE_KEY_PREFIX = 'brand-settings:'
const DEFAULT_ENTERPRISE_ID = 'ent-default'

/**
 * 基于部署基路径拼接静态资源 URL。
 * - 开发环境 BASE_URL 为 '/'
 * - 构建时由 Vite base 配置替换（如 '/inspection/'），部署到子路径也能正确加载图片
 */
const asset = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`

const DEFAULT_SETTINGS: BrandSettings = {
  browserTitle: '智慧巡检管理系统',
  favicon: asset('logo.png'),
  loginLogo: asset('logo.png'),
  loginBrandName: '智慧巡检管理系统',
  loginSubtitle: '让每一次巡检都更智能、更高效',
  loginBackground: '',
  headerLogo: asset('logo.png'),
  headerTitle: '智慧巡检管理系统',
}

const storageKey = (enterpriseId: string) => `${STORAGE_KEY_PREFIX}${enterpriseId}`

function normalize(parsed: Partial<BrandSettings>): BrandSettings {
  // 旧版默认图标 /favicon.svg 自动迁移为系统图标 logo.png
  if (parsed.favicon === '/favicon.svg') {
    parsed.favicon = asset('logo.png')
  }
  // 旧版根路径 /logo.png 迁移为基于部署基路径的 URL（防止部署到子路径后裂图）
  if (parsed.favicon === '/logo.png') parsed.favicon = asset('logo.png')
  if (parsed.loginLogo === '/logo.png') parsed.loginLogo = asset('logo.png')
  if (parsed.headerLogo === '/logo.png') parsed.headerLogo = asset('logo.png')
  return { ...DEFAULT_SETTINGS, ...parsed }
}

function loadSettings(enterpriseId: string): BrandSettings {
  try {
    const raw = localStorage.getItem(storageKey(enterpriseId))
    if (raw) {
      return normalize(JSON.parse(raw))
    }
  } catch (e) {
    console.warn('[brand] 读取本地品牌配置失败', e)
  }
  return { ...DEFAULT_SETTINGS }
}

export const useBrandStore = defineStore('brand', {
  state: (): {
    enterpriseId: string
    settings: BrandSettings
    applied: boolean
  } => ({
    // 默认使用平台公共配置（登录选择企业前 / 未设置任何企业时）
    enterpriseId: DEFAULT_ENTERPRISE_ID,
    settings: loadSettings(DEFAULT_ENTERPRISE_ID),
    applied: false,
  }),

  getters: {
    /** 是否有自定义 favicon（区别于默认值） */
    hasCustomFavicon: (state) => !!state.settings.favicon && state.settings.favicon !== DEFAULT_SETTINGS.favicon,
    /** 是否有自定义 Header Logo */
    hasCustomHeaderLogo: (state) => !!state.settings.headerLogo && state.settings.headerLogo !== DEFAULT_SETTINGS.headerLogo,
  },

  actions: {
    /**
     * 切换到指定企业：动态读取该企业的品牌配置并全局应用。
     * 对应"登录后选择企业"与"登录后切换企业"两个场景。
     */
    loadForEnterprise(enterpriseId: string) {
      this.enterpriseId = enterpriseId
      this.settings = loadSettings(enterpriseId)
      this.apply(false)
    },

    /**
     * 将当前企业的品牌配置应用到全局（浏览器标题 / favicon），并持久化。
     * @param persist 是否写入 localStorage（保存操作时传 true；切换企业加载时无需回写）
     */
    apply(persist = true) {
      const { browserTitle, favicon } = this.settings
      document.title = browserTitle || DEFAULT_SETTINGS.browserTitle

      const favEl = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
      if (favEl && favicon) {
        favEl.href = favicon
      }
      if (persist) {
        localStorage.setItem(storageKey(this.enterpriseId), JSON.stringify(this.settings))
      }
      this.applied = true
    },

    /** 恢复当前企业为默认品牌配置 */
    reset() {
      this.settings = { ...DEFAULT_SETTINGS }
      this.apply()
    },
  },
})

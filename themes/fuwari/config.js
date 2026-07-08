/**
 * Fuwari 主题专用配置
 *
 * 与 NotionNext 的 `blog.config.js` 合并后生效；可在博客配置里覆盖任意项。
 * 布尔项：true 显示/启用，false 隐藏/关闭。
 */

const CONFIG = {
  // ---------------------------------------------------------------------------
  // 导航（桌面顶栏 + 受 FUWARI_MOBILE_MENU 影响的移动菜单项）
  // ---------------------------------------------------------------------------
  /** 显示「首页」 */
  FUWARI_MENU_INDEX: true,
  /** 显示「归档」 */
  FUWARI_MENU_ARCHIVE: true,
  /** 显示「分类」 */
  FUWARI_MENU_CATEGORY: true,
  /** 显示「标签」 */
  FUWARI_MENU_TAG: true,
  /** 显示「搜索」（Algolia 或站内搜索由全局配置决定） */
  FUWARI_MENU_SEARCH: true,

  // ---------------------------------------------------------------------------
  // 首页文章列表卡片
  // ---------------------------------------------------------------------------
  /** 是否显示右侧封面图区域 */
  FUWARI_POST_LIST_COVER: true,
  /** 无文章封面时，是否用站点横幅图（HOME_BANNER_IMAGE）作默认图 */
  FUWARI_POST_LIST_COVER_DEFAULT: false,
  /** 封面悬停轻微放大 */
  FUWARI_POST_LIST_COVER_HOVER_ENLARGE: true,
  /** 显示摘要（有 summary 时） */
  FUWARI_POST_LIST_SUMMARY: true,
  /** 卡片内显示标签 */
  FUWARI_POST_LIST_TAG: true,
  /** 桌面端列表卡片封面列宽度（px），增大则更扁长横向 */
  FUWARI_POST_LIST_COVER_COL_WIDTH: 280,

  // ---------------------------------------------------------------------------
  // 移动端
  // ---------------------------------------------------------------------------
  /** 右侧汉堡菜单（含导航项）；关闭后小屏仅保留顶栏图标 */
  FUWARI_MOBILE_MENU: true,

  // ---------------------------------------------------------------------------
  // 首页 Hero 大图区（封面来自站点信息或下方图片配置）
  // ---------------------------------------------------------------------------
  /** 是否渲染 Hero 区块（无图时仍占位，可按需关） */
  FUWARI_HERO_ENABLE: true,
  /** 自定义背景图 URL；留空则用 Notion 站点封面或 HOME_BANNER_IMAGE */
  FUWARI_HERO_BG_IMAGE: 'https://s2.loli.net/2023/11/27/PdocmuTI3HShswv.jpg',
  /** 右下角署名文案；留空不显示 */
  FUWARI_HERO_CREDIT_TEXT: '',
  /** 署名链接 */
  FUWARI_HERO_CREDIT_LINK: '',
  /** 是否启用打字机效果 */
  FUWARI_HERO_TYPEWRITER: true,
  /** 打字机显示的文字数组，会依次轮播 */
  FUWARI_HERO_TYPEWRITER_WORDS: 
  ['莫叹去日不可留，来日犹可为',
   '夜里有腐烂的梦，梦里有重复的人', 
   '一生犹如罅穴，凿开是黢黑隧道；\n人生说来漫长，也无非两块面包。'],

  // ---------------------------------------------------------------------------
  // 侧栏（SidePanel）小部件
  // ---------------------------------------------------------------------------
  /** 公告（有公告数据时） */
  FUWARI_WIDGET_NOTICE: true,
  /** 最新文章列表 */
  FUWARI_WIDGET_LATEST_POSTS: true,
  /** 分类云/列表 */
  FUWARI_WIDGET_CATEGORY_LIST: true,
  /** 标签云/列表 */
  FUWARI_WIDGET_TAG_LIST: true,
  /** 侧栏头像/昵称下的「个人页」链接路径 */
  FUWARI_PROFILE_PATH: '/about',
  /** 联系/社群入口卡片 */
  FUWARI_WIDGET_CONTACT: true,
  /** 正文右侧的新侧栏总开关 */
  FUWARI_RIGHT_PANEL_ENABLE: true,
  /** 正文右侧栏宽度（px） */
  FUWARI_RIGHT_PANEL_WIDTH: 280,
  /** 侧栏广告位总开关 */
  FUWARI_WIDGET_AD: false,
  /** 侧栏广告位内：是否渲染 WWAds */
  FUWARI_WIDGET_WWADS: true,
  /** 侧栏广告位内：是否渲染 AdSense 槽位 */
  FUWARI_WIDGET_ADSENSE: false,
  /** 插件注入区域卡片 */
  FUWARI_WIDGET_PLUGIN_AREA: true,
  /** 访问量等统计卡片 */
  FUWARI_WIDGET_ANALYTICS: true,
  /** 顶栏调色板内的色相滑块等；false 时展开调色板无控件 */
  FUWARI_WIDGET_THEME_COLOR_SWITCHER: true,
  /** 默认品牌色相 0–360 */
  FUWARI_THEME_COLOR_HUE: 320,
  /** true：隐藏顶栏调色盘按钮，无法在站内改色相 */
  FUWARI_THEME_COLOR_FIXED: true,
  /** 文章页右侧浮动区：跳转评论区按钮 */
  FUWARI_WIDGET_TO_COMMENT: true,
  /** 文章页右侧浮动区：深色模式切换 */
  FUWARI_WIDGET_DARK_MODE: true,
  /** 文章页目录：桌面在侧栏；小屏为浮动按钮抽屉（RightFloatArea） */
  FUWARI_ARTICLE_TOC: true,

  // ---------------------------------------------------------------------------
  // 联系卡片（侧栏，可翻转）
  // ---------------------------------------------------------------------------
  /** 正面标题 */
  FUWARI_CONTACT_TITLE: 'BILIBILI',
  /** 正面说明文案 */
  FUWARI_CONTACT_DESCRIPTION: '个人主页',
  /** 正面右上角徽标 */
  FUWARI_CONTACT_FRONT_BADGE: 'contact',
  /** 跳转 URL（外链或站内路径） */
  FUWARI_CONTACT_URL: 'https://space.bilibili.com/26633214?spm_id_from=333.1007.0.0',
  /** 正面行动文案（如「联系我们 →」） */
  FUWARI_CONTACT_TEXT: 'FOLLOW',
  /** 是否使用正反面翻转卡片 */
  FUWARI_CONTACT_FLIP_CARD: true,
  /** 背面标题 */
  FUWARI_CONTACT_BACK_TITLE: 'Eeeeee',
  /** 背面说明 */
  FUWARI_CONTACT_BACK_DESCRIPTION: 'Ciallo～ (∠・ω< )⌒★',
  /** 背面行动文案 */
  FUWARI_CONTACT_BACK_TEXT: '查看',

  // ---------------------------------------------------------------------------
  // 音乐播放器（MetingJS + APlayer）
  // ---------------------------------------------------------------------------
  /**
   * 音乐平台来源
   * 可选值：netease(网易云) / tencent(QQ音乐) / kugou(酷狗) / xiami(虾米) / baidu(百度)
   */
  FUWARI_MUSIC_SOURCE: 'netease',
  /**
   * 歌单ID
   * 获取方法：
   * - 网易云：打开歌单页面，URL 中的 playlist?id=xxx 就是歌单ID
   * - QQ音乐：打开歌单页面，URL 中的 playlist/y/xxx
   */
  FUWARI_MUSIC_ID: '8880284601',
  /**
   * 单曲ID（优先于歌单，填写后只播放这一首歌，列表收起来）
   * 获取方法：打开歌曲页面，URL 中的 song?id=xxx 就是单曲ID
   */
  FUWARI_MUSIC_SINGLE_ID: '2061995659',
  /**
   * 是否显示歌曲列表（歌单模式下有效）
   */
  FUWARI_MUSIC_SHOW_LIST: false,
  /**
   * 自定义歌曲列表（当 FUWARI_MUSIC_ID 为空时使用）
   * 格式：
   * [
   *   { name: '歌曲名', artist: '艺术家', url: '音频直链', cover: '封面图' }
   * ]
   */
  FUWARI_MUSIC_LIST: [],

  // ---------------------------------------------------------------------------
  // 全站动效（按需开启，可能影响性能）
  // ---------------------------------------------------------------------------
  /** Lenis 平滑滚动 */
  FUWARI_EFFECT_LENIS: false,
  /** 自定义光标圆点 */
  FUWARI_EFFECT_CURSOR_DOT: false,

  // ---------------------------------------------------------------------------
  // 文章页
  // ---------------------------------------------------------------------------
  /** 有 Notion 封面时，在详情页文章卡片内顶部展示封面图（object-cover，不占满屏） */
  FUWARI_ARTICLE_COVER_HERO: false,
  /** 文首：日期、分类、标签等元信息 */
  FUWARI_ARTICLE_META: true,
  /** 分享条 */
  FUWARI_ARTICLE_SHARE: true,
  /** 文末版权信息块 */
  FUWARI_ARTICLE_COPYRIGHT: true,
  /** 文末评论区（需在 `blog.config.js` 配置任一种评论服务，如 COMMENT_GISCUS_REPO / COMMENT_TWIKOO_ENV_ID 等，否则不渲染） */
  FUWARI_ARTICLE_COMMENT: true,
  /** 文末上一篇 / 下一篇 */
  FUWARI_ARTICLE_ADJACENT: true,

  // ---------------------------------------------------------------------------
  // Live2D 看板娘（Cubism 3）
  // 优先读取 NEXT_PUBLIC_FUWARI_LIVE2D_ENABLE / _DEFAULT_MODEL 环境变量，缺省时使用下方默认值
  // ---------------------------------------------------------------------------
  /** 是否启用 Live2D 看板娘 */
  FUWARI_LIVE2D_ENABLE:
    typeof process !== 'undefined' &&
    process.env &&
    process.env.NEXT_PUBLIC_FUWARI_LIVE2D_ENABLE !== undefined
      ? process.env.NEXT_PUBLIC_FUWARI_LIVE2D_ENABLE === 'true'
      : true,
  /** 默认角色模型（对应 model 目录下的子目录名） */
  FUWARI_LIVE2D_DEFAULT_MODEL: 'Azue Lane(JP)/lafei_4'
}

export default CONFIG

import { useEffect, useState } from 'react'
import { useGlobal } from '@/lib/global'
import { siteConfig } from '@/lib/config'
import CONFIG from '../config'

/**
 * 音乐播放器卡片
 * 使用 MetingJS + APlayer 解析网易云/QQ音乐等歌单
 * 
 * 配置（在 config.js 或 .env.local 中）：
 * - FUWARI_MUSIC_SOURCE: 音乐平台 (netease/tencent/kugou/xiami/baidu)
 * - FUWARI_MUSIC_ID: 歌单ID
 * - FUWARI_MUSIC_SINGLE_ID: 单曲ID（优先于歌单）
 * - FUWARI_MUSIC_SHOW_LIST: 是否显示歌曲列表 (true/false)
 */
const MusicPlayer = () => {
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState(null)
  const { locale } = useGlobal()

  useEffect(() => {
    const loadMeting = async () => {
      try {
        if (!document.getElementById('meting-css')) {
          const link = document.createElement('link')
          link.id = 'meting-css'
          link.rel = 'stylesheet'
          link.href = 'https://cdn.jsdelivr.net/npm/aplayer@1.10.1/dist/APlayer.min.css'
          document.head.appendChild(link)
        }

        if (!window.APlayer) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script')
            script.src = 'https://cdn.jsdelivr.net/npm/aplayer@1.10.1/dist/APlayer.min.js'
            script.onload = resolve
            script.onerror = reject
            document.body.appendChild(script)
          })
        }

        if (!window.Meting) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script')
            script.src = 'https://cdn.jsdelivr.net/npm/meting@2.0.1/dist/Meting.min.js'
            script.onload = resolve
            script.onerror = reject
            document.body.appendChild(script)
          })
        }

        setIsReady(true)
      } catch (err) {
        console.error('MetingJS 加载失败:', err)
        setError(err.message)
      }
    }

    loadMeting()
  }, [])

  const source = siteConfig('FUWARI_MUSIC_SOURCE', '', CONFIG)
  const playlistId = siteConfig('FUWARI_MUSIC_ID', '', CONFIG)
  const singleId = siteConfig('FUWARI_MUSIC_SINGLE_ID', '', CONFIG)
  const showList = siteConfig('FUWARI_MUSIC_SHOW_LIST', true, CONFIG)

  // 单曲ID优先于歌单
  const isSingleMode = !!singleId
  const hasPlaylist = source && playlistId

  if (error) {
    return (
      <section className='fuwari-card p-5'>
        <h3 className='text-sm font-semibold mb-3 tracking-wide uppercase text-[var(--fuwari-muted)]'>
          {locale?.COMMON?.MUSIC_PLAYER || '音乐播放'}
        </h3>
        <p className='text-xs text-red-500'>加载失败: {error}</p>
      </section>
    )
  }

  if (!hasPlaylist && !singleId) {
    return (
      <section className='fuwari-card p-5'>
        <h3 className='text-sm font-semibold mb-3 tracking-wide uppercase text-[var(--fuwari-muted)]'>
          {locale?.COMMON?.MUSIC_PLAYER || '音乐播放'}
        </h3>
        <div className='text-xs text-[var(--fuwari-muted)] space-y-2'>
          <p>配置音乐播放器（在 .env.local 中）：</p>
          <div className='bg-[var(--fuwari-bg-secondary)] p-2 rounded space-y-1 font-mono'>
            <div>FUWARI_MUSIC_SOURCE=netease</div>
            <div>FUWARI_MUSIC_ID=歌单ID</div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <>
      <style jsx global>{`
        /* 播放器宽度撑满容器 */
        .fuwari-meting-wrap .aplayer {
          margin: 0 !important;
        }
        /* 列表项横向排列：序号 | 歌名 - 歌手 */
        .fuwari-meting-wrap .aplayer-list ol > li {
          display: flex !important;
          align-items: center !important;
          padding: 6px 8px !important;
        }
        .fuwari-meting-wrap .aplayer-list .aplayer-list-index {
          flex-shrink: 0 !important;
          width: 24px !important;
          margin-right: 6px !important;
          text-align: center !important;
          color: var(--fuwari-muted, #999) !important;
        }
        .fuwari-meting-wrap .aplayer-list .aplayer-list-title,
        .fuwari-meting-wrap .aplayer-list .aplayer-list-author {
          display: inline !important;
          white-space: nowrap !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
        }
        .fuwari-meting-wrap .aplayer-list .aplayer-list-title {
          color: #ec4899 !important;
        }
        .fuwari-meting-wrap .aplayer-list .aplayer-list-author {
          color: #3b82f6 !important;
        }
        .fuwari-meting-wrap .aplayer-list .aplayer-list-author::before {
          content: " - " !important;
        }
      `}</style>
      <section className='fuwari-card overflow-hidden'>
        <div className='p-5 pb-3'>
          <h3 className='text-sm font-semibold tracking-wide uppercase text-[var(--fuwari-muted)]'>
            {locale?.COMMON?.MUSIC_PLAYER || '音乐播放'}
          </h3>
          {playlistId && (
            <p className='text-xs text-[var(--fuwari-muted)] mt-1'>
              🎵 {source === 'netease' ? '网易云音乐' : source === 'tencent' ? 'QQ音乐' : '歌单'}
            </p>
          )}
        </div>
        
        <div className='px-5 pb-4 fuwari-meting-wrap'>
          {!isReady ? (
            <div className='h-20 animate-pulse bg-[var(--fuwari-border)] rounded' />
          ) : isSingleMode ? (
            // 单曲模式
            <meting-js
              server={source || 'netease'}
              type='song'
              id={singleId}
              mutex='true'
              theme='#b373d8'
              loop='all'
              preload='auto'
              volume='0.7'
              list-folded='true'
            />
          ) : (
            // 歌单模式
            <meting-js
              server={source}
              type='playlist'
              id={playlistId}
              mutex='true'
              theme='#b373d8'
              order='list'
              loop='all'
              preload='auto'
              volume='0.7'
              list-folded={showList ? 'false' : 'true'}
              list-max-height={showList ? '250px' : '0px'}
            />
          )}
        </div>
      </section>
    </>
  )
}

export default MusicPlayer

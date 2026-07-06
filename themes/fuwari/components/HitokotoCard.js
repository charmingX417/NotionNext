import { useEffect, useState } from 'react'
import { useGlobal } from '@/lib/global'

/**
 * 一言（Hitokoto）卡片
 * 数据来源：https://v1.hitokoto.cn/
 */
const HITOKOTO_TYPE_MAP = {
  a: { emoji: '🎧', label: '动画' },
  b: { emoji: '🎨', label: '漫画' },
  c: { emoji: '🎮', label: '游戏' },
  d: { emoji: '📖', label: '文学' },
  e: { emoji: '💡', label: '原创' },
  f: { emoji: '🌐', label: '网络' },
  g: { emoji: '💭', label: '来自网络' },
  h: { emoji: '🎭', label: '影视' },
  i: { emoji: '🏷️', label: '诗词' },
  j: { emoji: '💬', label: '网易云' },
  k: { emoji: '🎵', label: '哲学' },
  l: { emoji: '💭', label: '抖机灵' },
}

const HitokotoCard = () => {
  const [hitokoto, setHitokoto] = useState(null)
  const [loading, setLoading] = useState(true)
  const { locale } = useGlobal()

  useEffect(() => {
    fetch('https://v1.hitokoto.cn/')
      .then(res => res.json())
      .then(data => {
        setHitokoto(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const typeInfo = hitokoto ? (HITOKOTO_TYPE_MAP[hitokoto.type] || { emoji: '💬', label: '' }) : null

  return (
    <section className='fuwari-card p-5'>
      <h3 className='text-sm font-semibold mb-3 tracking-wide uppercase text-[var(--fuwari-muted)]'>
        {locale?.COMMON?.HITOKOTO || 'HITOKOTO'}
      </h3>
      {loading ? (
        <div className='h-4 w-3/4 animate-pulse bg-[var(--fuwari-border)] rounded' />
      ) : hitokoto ? (
        <>
          <p className='text-sm leading-6 text-[var(--fuwari-text)]'>
            {typeInfo?.emoji} 「{hitokoto.hitokoto}」
          </p>
          <p className='text-xs text-right mt-2 text-[var(--fuwari-muted)]'>
            —— {hitokoto.from_who || hitokoto.from || '未知来源'}
          </p>
        </>
      ) : (
        <p className='text-sm text-[var(--fuwari-muted)]'>
          {locale?.COMMON?.LOADING || '加载中…'}
        </p>
      )}
    </section>
  )
}

export default HitokotoCard

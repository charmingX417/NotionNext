import { useEffect, useState } from 'react'
import { useGlobal } from '@/lib/global'

/**
 * 一言（Hitokoto）卡片
 * 数据来源：https://v1.hitokoto.cn/
 */
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

  return (
    <section className='fuwari-card p-5'>
      <h3 className='text-sm font-semibold mb-3 tracking-wide uppercase text-[var(--fuwari-muted)]'>
        {locale?.COMMON?.HITOKOTO || '一言'}
      </h3>
      {loading ? (
        <div className='h-4 w-3/4 animate-pulse bg-[var(--fuwari-border)] rounded' />
      ) : hitokoto ? (
        <>
          <p className='text-sm leading-6 italic text-[var(--fuwari-text)]'>
            「{hitokoto.hitokoto}」
          </p>
          <p className='text-xs text-right mt-2 text-[var(--fuwari-muted)]'>
            —— {hitokoto.from_who || hitokoto.from || '未知来源'}
          </p>
        </>
      ) : (
        <p className='text-sm text-[var(--fuwari-muted)]'>
          {locale?.COMMON?.LOADING || '加载中...'}
        </p>
      )}
    </section>
  )
}

export default HitokotoCard

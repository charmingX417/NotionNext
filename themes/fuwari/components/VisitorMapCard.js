import { useEffect, useState } from 'react'
import { useGlobal } from '@/lib/global'

/**
 * 访客地图卡片
 * 流程：IP 定位 API 获取城市/坐标 → 高德静态地图渲染周边地图图片
 * 依赖：NEXT_PUBLIC_AMAP_KEY（高德 Web 服务 Key，写入 .env.local）
 */
const AMAP_KEY = process.env.NEXT_PUBLIC_AMAP_KEY

const VisitorMapCard = () => {
  const [location, setLocation] = useState(null)
  const [loading, setLoading] = useState(true)
  const { locale } = useGlobal()

  useEffect(() => {
    if (!AMAP_KEY) {
      setLoading(false)
      return
    }

    // 第一步：通过高德 IP 定位获取当前城市坐标和城市名
    fetch(`https://restapi.amap.com/v3/ip?key=${AMAP_KEY}`)
      .then(res => res.json())
      .then(data => {
        if (data.status === '1' && data.rectangle) {
          const [lng, lat] = data.rectangle.split(';')[0].split(',')
          setLocation({
            city: data.city || '未知',
            province: data.province || '',
            lng,
            lat,
          })
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (!AMAP_KEY) {
    return (
      <section className='fuwari-card p-5'>
        <h3 className='text-sm font-semibold mb-3 tracking-wide uppercase text-[var(--fuwari-muted)]'>
          {locale?.COMMON?.VISITOR_MAP || '访客地图'}
        </h3>
        <p className='text-xs text-[var(--fuwari-muted)]'>
          请在 .env.local 中配置 NEXT_PUBLIC_AMAP_KEY
        </p>
      </section>
    )
  }

  if (loading) {
    return (
      <section className='fuwari-card p-5'>
        <h3 className='text-sm font-semibold mb-3 tracking-wide uppercase text-[var(--fuwari-muted)]'>
          {locale?.COMMON?.VISITOR_MAP || '访客地图'}
        </h3>
        <div className='h-32 w-full animate-pulse bg-[var(--fuwari-border)] rounded' />
      </section>
    )
  }

  // 第二步：用坐标生成静态地图图片
  const mapUrl = location
    ? `https://restapi.amap.com/v3/staticmap?location=${location.lng},${location.lat}&zoom=10&size=512*200&markers=mid,,A:${location.lng},${location.lat}&key=${AMAP_KEY}`
    : null

  return (
    <section className='fuwari-card overflow-hidden'>
      <div className='p-5 pb-3'>
        <h3 className='text-sm font-semibold tracking-wide uppercase text-[var(--fuwari-muted)]'>
          {locale?.COMMON?.VISITOR_MAP || '访客地图'}
        </h3>
        {location ? (
          <p className='text-xs text-[var(--fuwari-muted)] mt-1'>
            📍 {location.province} {location.city}
          </p>
        ) : (
          <p className='text-xs text-[var(--fuwari-muted)] mt-1'>
            定位失败
          </p>
        )}
      </div>
      {mapUrl ? (
        <img
          src={mapUrl}
          alt='Visitor location map'
          className='w-full object-cover'
          style={{ display: 'block' }}
        />
      ) : (
        <div className='w-full h-32 flex items-center justify-center text-xs text-[var(--fuwari-muted)]'>
          暂无地图数据
        </div>
      )}
    </section>
  )
}

export default VisitorMapCard
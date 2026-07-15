import { useEffect, useState } from 'react'
import { useGlobal } from '@/lib/global'

const AMAP_KEY = process.env.NEXT_PUBLIC_AMAP_KEY

const VisitorMapCard = () => {
  const [location, setLocation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { locale } = useGlobal()

  useEffect(() => {
    if (!AMAP_KEY) {
      setLoading(false)
      return
    }

    // 弃用高德定位，改用对全球 IP 友好的 ipinfo.io
    fetch('https://ipinfo.io/json')
      .then(res => {
        if (!res.ok) throw new Error('IP定位请求失败')
        return res.json()
      })
      .then(data => {
        if (!data.loc) throw new Error('无法获取经纬度信息')
        
        // ipinfo 返回格式为 "lat,lng"
        const [lat, lng] = data.loc.split(',')
        
        setLocation({ 
          city: data.city || '未知城市', 
          province: data.region || '未知地区', 
          lng, 
          lat 
        })
        setLoading(false)
      })
      .catch(err => {
        console.error('[VisitorMapCard] ✗', err)
        setError(err.message || String(err))
        setLoading(false)
      })
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
      <section className='fuwari-card overflow-hidden'>
        <div className='p-5 pb-3'>
          <h3 className='text-sm font-semibold tracking-wide uppercase text-[var(--fuwari-muted)]'>
            {locale?.COMMON?.VISITOR_MAP || '访客地图'}
          </h3>
        </div>
        <div className='h-32 w-full animate-pulse bg-[var(--fuwari-border)] rounded' />
      </section>
    )
  }

  if (error) {
    return (
      <section className='fuwari-card overflow-hidden'>
        <div className='p-5 pb-3'>
          <h3 className='text-sm font-semibold tracking-wide uppercase text-[var(--fuwari-muted)]'>
            {locale?.COMMON?.VISITOR_MAP || '访客地图'}
          </h3>
          <p className='text-xs text-[var(--fuwari-muted)] mt-1'>
            定位失败：{error}
          </p>
        </div>
        <div className='w-full h-32 flex items-center justify-center text-xs text-[var(--fuwari-muted)]'>
          暂无地图数据
        </div>
      </section>
    )
  }

  if (!location) return null

  const { lng, lat, city, province } = location
  const mapUrl = [
    `https://restapi.amap.com/v3/staticmap?`,
    `key=${AMAP_KEY}`,
    `&zoom=10`,
    `&size=512*200`,
    `&markers=mid,,A:${lng},${lat}`,
  ].join('')

  return (
    <section className='fuwari-card overflow-hidden'>
      <div className='p-5 pb-3'>
        <h3 className='text-sm font-semibold tracking-wide uppercase text-[var(--fuwari-muted)]'>
          {locale?.COMMON?.VISITOR_MAP || '访客地图'}
        </h3>
        <p className='text-xs text-[var(--fuwari-muted)] mt-1'>
          📍 {province} {city}
        </p>
      </div>
      <img
        src={mapUrl}
        alt={`Map of ${city}`}
        className='w-full object-cover'
        style={{ display: 'block' }}
        onError={e => {
          console.error('[VisitorMapCard] 地图图片加载失败，URL:', mapUrl)
          e.currentTarget.style.display = 'none'
        }}
      />
    </section>
  )
}

export default VisitorMapCard
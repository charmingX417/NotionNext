import { useEffect, useState } from 'react'
import { useGlobal } from '@/lib/global'

/**
 * 天气挂件
 * IP 定位 + 天气查询均使用高德地图 API（.env.local 中的 NEXT_PUBLIC_AMAP_KEY）
 */
const AMAP_KEY = process.env.NEXT_PUBLIC_AMAP_KEY

const WMO_MAP = {
  0: { emoji: '☀️', desc: '晴' },
  1: { emoji: '🌤️', desc: '大部晴朗' },
  2: { emoji: '⛅', desc: '多云' },
  3: { emoji: '☁️', desc: '阴' },
  45: { emoji: '🌫️', desc: '雾' },
  48: { emoji: '🌫️', desc: '雾凇' },
  51: { emoji: '🌦️', desc: '小毛毛雨' },
  53: { emoji: '🌦️', desc: '中毛毛雨' },
  55: { emoji: '🌦️', desc: '大毛毛雨' },
  61: { emoji: '🌧️', desc: '小雨' },
  63: { emoji: '🌧️', desc: '中雨' },
  65: { emoji: '🌧️', desc: '大雨' },
  71: { emoji: '🌨️', desc: '小雪' },
  73: { emoji: '🌨️', desc: '中雪' },
  75: { emoji: '❄️', desc: '大雪' },
  77: { emoji: '🌨️', desc: '冰粒' },
  80: { emoji: '🌦️', desc: '阵雨' },
  81: { emoji: '🌦️', desc: '中阵雨' },
  82: { emoji: '⛈️', desc: '大阵雨' },
  85: { emoji: '🌨️', desc: '阵雪' },
  86: { emoji: '❄️', desc: '大雪' },
  95: { emoji: '⛈️', desc: '雷暴' },
  96: { emoji: '⛈️', desc: '雷暴+冰雹' },
  99: { emoji: '⛈️', desc: '雷暴+大冰雹' },
}

const WeatherCard = () => {
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(true)
  const { locale } = useGlobal()

  useEffect(() => {
    if (!AMAP_KEY) {
      setLoading(false)
      return
    }

    // 步骤1：高德 IP 定位 → 获取城市名和经纬度
    fetch(`https://restapi.amap.com/v3/ip?key=${AMAP_KEY}`)
      .then(res => res.json())
      .then(loc => {
        if (loc.status !== '1') throw new Error('IP定位失败')
        return fetch(
          `https://restapi.amap.com/v3/weather/weatherInfo?key=${AMAP_KEY}&city=${loc.adcode}&extensions=base`
        )
      })
      // 步骤2：高德天气查询 → 获取实时天气数据
      .then(res => res.json())
      .then(w => {
        if (w.status !== '1' || !w.lives?.length) throw new Error('天气获取失败')
        setWeather(w.lives[0])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (!AMAP_KEY) {
    return (
      <section className='fuwari-card p-5'>
        <h3 className='text-sm font-semibold mb-3 tracking-wide uppercase text-[var(--fuwari-muted)]'>
          {locale?.COMMON?.WEATHER || '天气'}
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
          {locale?.COMMON?.WEATHER || '天气'}
        </h3>
        <div className='h-10 w-2/3 animate-pulse bg-[var(--fuwari-border)] rounded' />
      </section>
    )
  }

  if (!weather) return null

  // 高德 weather_code: 0=晴,1=多云,2=阴,3=雨,4=雪...
  const codeMap = { 0: 0, 1: 1, 2: 2, 3: 2, 4: 3, 5: 61, 6: 63, 7: 65, 8: 80, 9: 81, 10: 82, 11: 95, 12: 71, 13: 73, 14: 75, 15: 99 }
  const wmo = codeMap[Number(weather.weather)] ?? 0
  const info = WMO_MAP[wmo] || WMO_MAP[0]

  return (
    <section className='fuwari-card p-5'>
      <h3 className='text-sm font-semibold mb-3 tracking-wide uppercase text-[var(--fuwari-muted)]'>
        {locale?.COMMON?.WEATHER || '天气'} · {weather.city || 'Unknown'}
      </h3>
      <div className='flex items-center gap-3'>
        <span className='text-4xl leading-none'>{info.emoji}</span>
        <div className='flex-1'>
          <div className='text-2xl font-semibold leading-none'>
            {weather.temperature}°C
          </div>
          <div className='text-xs text-[var(--fuwari-muted)] mt-1'>
            {weather.weather || info.desc}
          </div>
        </div>
      </div>
      <div className='mt-3 pt-3 border-t border-[var(--fuwari-border)] grid grid-cols-2 gap-2 text-xs text-[var(--fuwari-muted)]'>
        <div>
          💨 风力{' '}
          <span className='text-[var(--fuwari-text)] ml-1'>
            {weather.windpower || '未知'} 级
          </span>
        </div>
        <div>
          💧 湿度{' '}
          <span className='text-[var(--fuwari-text)] ml-1'>
            {weather.humidity || '未知'}%
          </span>
        </div>
      </div>
    </section>
  )
}

export default WeatherCard
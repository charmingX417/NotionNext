import { useEffect, useState } from 'react'
import { useGlobal } from '@/lib/global'

const QWEATHER_KEY = process.env.NEXT_PUBLIC_QWEATHER_KEY

// 和风天气 Icon 代码映射 (部分常见天气)
// 参考：https://dev.qweather.com/docs/resource/icons/
const QWEATHER_EMOJI_MAP = {
  '100': { emoji: '☀️', desc: '晴' },
  '150': { emoji: '🌙', desc: '晴(夜)' },
  '101': { emoji: '☁️', desc: '多云' },
  '104': { emoji: '⛅', desc: '阴' },
  '300': { emoji: '🌧️', desc: '阵雨' },
  '302': { emoji: '⛈️', desc: '雷阵雨' },
  '305': { emoji: '🌦️', desc: '小雨' },
  '306': { emoji: '🌧️', desc: '中雨' },
  '307': { emoji: '🌧️', desc: '大雨' },
  '400': { emoji: '🌨️', desc: '小雪' },
  '401': { emoji: '🌨️', desc: '中雪' },
  '402': { emoji: '❄️', desc: '大雪' },
  '501': { emoji: '🌫️', desc: '雾' },
  '502': { emoji: '🌫️', desc: '霾' },
}

// 智能回退函数，如果找不到对应代码，根据天气文本模糊匹配
const getEmojiInfo = (iconCode, text) => {
  if (QWEATHER_EMOJI_MAP[iconCode]) return QWEATHER_EMOJI_MAP[iconCode]
  if (text.includes('雨')) return { emoji: '🌧️', desc: text }
  if (text.includes('雪')) return { emoji: '❄️', desc: text }
  if (text.includes('云') || text.includes('阴')) return { emoji: '☁️', desc: text }
  return { emoji: '🌤️', desc: text }
}

const WeatherCard = () => {
  const [weather, setWeather] = useState(null)
  const [city, setCity] = useState('Unknown')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { locale } = useGlobal()

  useEffect(() => {
    if (!QWEATHER_KEY) {
      setLoading(false)
      return
    }

    // 步骤1：获取全球通用的 IP 经纬度
    fetch('https://ipinfo.io/json')
      .then(res => res.json())
      .then(loc => {
        if (!loc.loc) throw new Error('无法获取坐标')
        setCity(loc.city || 'Unknown')
        
        // ipinfo 返回 "lat,lng" ，和风天气需要 "lng,lat"
        const [lat, lng] = loc.loc.split(',')

        // 步骤2：请求和风天气实况 API (免费版域名前缀为 devapi)
        return fetch(
          `https://devapi.qweather.com/v7/weather/now?location=${lng},${lat}&key=${QWEATHER_KEY}`
        )
      })
      .then(res => res.json())
      .then(w => {
        if (w.code !== '200') {
          throw new Error(`天气获取失败 和风状态码: ${w.code}`)
        }
        setWeather(w.now)
        setLoading(false)
      })
      .catch(err => {
        console.error('[WeatherCard] ✗', err)
        setError(err.message || String(err))
        setLoading(false)
      })
  }, [])

  if (!QWEATHER_KEY) {
    return (
      <section className='fuwari-card p-5'>
        <h3 className='text-sm font-semibold mb-3 tracking-wide uppercase text-[var(--fuwari-muted)]'>
          {locale?.COMMON?.WEATHER || '天气'}
        </h3>
        <p className='text-xs text-[var(--fuwari-muted)]'>
          请在 .env.local 中配置 NEXT_PUBLIC_QWEATHER_KEY
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

  if (error) {
    return (
      <section className='fuwari-card p-5'>
        <h3 className='text-sm font-semibold mb-3 tracking-wide uppercase text-[var(--fuwari-muted)]'>
          {locale?.COMMON?.WEATHER || '天气'}
        </h3>
        <p className='text-xs text-[var(--fuwari-muted)]'>{error}</p>
      </section>
    )
  }

  if (!weather) return null

  const info = getEmojiInfo(weather.icon, weather.text)

  return (
    <section className='fuwari-card p-5'>
      <h3 className='text-sm font-semibold mb-3 tracking-wide uppercase text-[var(--fuwari-muted)]'>
        {locale?.COMMON?.WEATHER || '天气'} · {city}
      </h3>
      <div className='flex items-center gap-3'>
        <span className='text-4xl leading-none'>{info.emoji}</span>
        <div className='flex-1'>
          <div className='text-2xl font-semibold leading-none'>
            {weather.temp}°C
          </div>
          <div className='text-xs text-[var(--fuwari-muted)] mt-1'>
            {weather.text}
          </div>
        </div>
      </div>
      <div className='mt-3 pt-3 border-t border-[var(--fuwari-border)] grid grid-cols-2 gap-2 text-xs text-[var(--fuwari-muted)]'>
        <div>
          💨 风力{' '}
          <span className='text-[var(--fuwari-text)] ml-1'>
            {weather.windScale || '未知'} 级
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
import FlipCard from '@/components/FlipCard'
import WeatherCard from './WeatherCard'
import VisitorMapCard from './VisitorMapCard'

/**
 * 天气-访客地图翻转卡片
 * 正面：天气卡片
 * 背面：访客地图卡片
 */
const WeatherFlipCard = () => {
  const frontContent = (
    <div className='h-full'>
      <WeatherCard />
    </div>
  )

  const backContent = (
    <div className='h-full'>
      <VisitorMapCard />
    </div>
  )

  return (
    <section className='h-48'>
      <FlipCard frontContent={frontContent} backContent={backContent} />
    </section>
  )
}

export default WeatherFlipCard

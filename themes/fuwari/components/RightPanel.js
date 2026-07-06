import { siteConfig } from '@/lib/config'
import CONFIG from '../config'
import HitokotoCard from './HitokotoCard'

const RightPanel = props => {
  if (!siteConfig('FUWARI_RIGHT_PANEL_ENABLE', true, CONFIG)) return null

  return (
    <aside className='space-y-4 hidden lg:block sticky top-4'>
      <HitokotoCard />
    </aside>
  )
}

export default RightPanel
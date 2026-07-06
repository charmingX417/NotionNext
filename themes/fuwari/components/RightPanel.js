import { siteConfig } from '@/lib/config'
import CONFIG from '../config'

const RightPanel = props => {
  if (!siteConfig('FUWARI_RIGHT_PANEL_ENABLE', true, CONFIG)) return null

  return (
    <aside className='space-y-4 hidden lg:block sticky top-4'>
      <section className='fuwari-card p-5'>
        <h3 className='text-sm font-semibold mb-2 tracking-wide uppercase text-[var(--fuwari-muted)]'>
          Right Panel
        </h3>
        <p className='text-sm leading-6 text-[var(--fuwari-muted)]'>
          占位卡片，后续可在此堆叠 TOC / 作者卡 / 广告 / 工具等内容。
        </p>
      </section>
    </aside>
  )
}

export default RightPanel
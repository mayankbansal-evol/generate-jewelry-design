import { ringPrompt } from './templates/ring'
import { necklacePrompt } from './templates/necklace'
import { earringsPrompt } from './templates/earrings'
import { braceletPrompt } from './templates/bracelet'
import { JewelryParams } from '@/types'

// Three photography style variants — same design, visually distinct shots
const styleVariants = [
  'clean studio photography, isolated on pure white background, product shot, 8K ultra-sharp',
  'dramatic luxury editorial, dark black velvet background, soft rim lighting, volumetric glow, 8K',
  'lifestyle flat lay, white marble surface, natural soft daylight, minimal botanical props, 8K',
]

export const buildImagePrompts = (params: JewelryParams): string[] => {
  const base =
    params.type === 'ring'
      ? ringPrompt(params)
      : params.type === 'necklace'
      ? necklacePrompt(params)
      : params.type === 'earrings'
      ? earringsPrompt(params)
      : braceletPrompt(params)

  return styleVariants.map(
    (style) => `Professional jewelry photography. ${base} ${style}.`
  )
}

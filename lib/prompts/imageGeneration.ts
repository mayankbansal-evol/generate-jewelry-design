import { ringPrompt } from './templates/ring'
import { necklacePrompt } from './templates/necklace'
import { earringsPrompt } from './templates/earrings'
import { braceletPrompt } from './templates/bracelet'
import { genericPrompt } from './templates/generic'
import { JewelryParams } from '@/types'

// Three photography style variants — same design, visually distinct shots
const styleVariants = [
  'clean studio photography, isolated on pure white background, product shot, 8K ultra-sharp',
  'dramatic luxury editorial, dark black velvet background, soft rim lighting, volumetric glow, 8K',
  'lifestyle flat lay, white marble surface, natural soft daylight, minimal botanical props, 8K',
]

const KNOWN_TYPES = ['ring', 'necklace', 'earrings', 'bracelet']

export const buildImagePrompts = (params: JewelryParams): string[] => {
  const normalizedType = params.type?.toLowerCase().trim() ?? ''

  // Use specific templates for the 4 known jewelry types, generic builder for everything else
  let base: string
  if (normalizedType === 'ring') {
    base = ringPrompt(params)
  } else if (normalizedType === 'necklace') {
    base = necklacePrompt(params)
  } else if (normalizedType === 'earrings') {
    base = earringsPrompt(params)
  } else if (normalizedType === 'bracelet') {
    base = braceletPrompt(params)
  } else {
    // Catch-all for any custom type: glasses frames, anklet, tiara, brooch, etc.
    base = genericPrompt(params)
  }

  return styleVariants.map(
    (style) => `Professional jewelry photography. ${base} ${style}.`
  )
}

// Re-export known types list for use elsewhere
export { KNOWN_TYPES }

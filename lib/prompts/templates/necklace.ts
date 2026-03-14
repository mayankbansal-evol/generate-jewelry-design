export interface NecklaceParams {
  metal: string
  finish?: string
  style: string
  gemstone?: string
  occasion?: string
}

export const necklacePrompt = (p: NecklaceParams): string =>
  [
    `A ${p.metal} ${p.style} necklace${p.gemstone ? ` featuring ${p.gemstone}` : ''}.`,
    p.finish ? `${p.finish} metal finish.` : '',
    p.occasion ? `Designed for ${p.occasion}.` : '',
    'Elegant drape, fine jewelry craftsmanship.',
  ]
    .filter(Boolean)
    .join(' ')

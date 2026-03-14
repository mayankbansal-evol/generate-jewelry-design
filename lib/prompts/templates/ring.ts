export interface RingParams {
  metal: string
  finish?: string
  style: string
  gemstone?: string
  occasion?: string
}

export const ringPrompt = (p: RingParams): string =>
  [
    `A ${p.metal} ${p.style} ring${p.gemstone ? ` featuring ${p.gemstone}` : ''}.`,
    p.finish ? `${p.finish} metal finish.` : '',
    p.occasion ? `Designed for ${p.occasion}.` : '',
    'Intricate detail, fine jewelry craftsmanship.',
  ]
    .filter(Boolean)
    .join(' ')

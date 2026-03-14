export interface BraceletParams {
  metal: string
  finish?: string
  style: string
  gemstone?: string
  occasion?: string
}

export const braceletPrompt = (p: BraceletParams): string =>
  [
    `A ${p.metal} ${p.style} bracelet${p.gemstone ? ` featuring ${p.gemstone}` : ''}.`,
    p.finish ? `${p.finish} metal finish.` : '',
    p.occasion ? `Designed for ${p.occasion}.` : '',
    'Delicate links, fine jewelry craftsmanship.',
  ]
    .filter(Boolean)
    .join(' ')

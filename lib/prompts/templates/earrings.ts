export interface EarringsParams {
  metal: string
  finish?: string
  style: string
  gemstone?: string
  occasion?: string
}

export const earringsPrompt = (p: EarringsParams): string =>
  [
    `A pair of ${p.metal} ${p.style} earrings${p.gemstone ? ` featuring ${p.gemstone}` : ''}.`,
    p.finish ? `${p.finish} metal finish.` : '',
    p.occasion ? `Designed for ${p.occasion}.` : '',
    'Symmetrical, fine jewelry craftsmanship.',
  ]
    .filter(Boolean)
    .join(' ')

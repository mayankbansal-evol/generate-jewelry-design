import { JewelryParams } from '@/types'

/**
 * Generic freeform prompt builder for any jewelry/accessory type
 * that doesn't match the standard ring/necklace/earrings/bracelet templates.
 * Assembles a rich descriptive sentence from all available params.
 */
export function genericPrompt(p: JewelryParams): string {
  const parts: string[] = []

  // Base description: metal + type
  const metalType = [p.metal, p.type].filter(Boolean).join(' ')
  parts.push(`A ${metalType}`)

  // Style
  if (p.style) {
    parts.push(`with a ${p.style} aesthetic`)
  }

  // Gemstone / stone work
  if (p.gemstone && p.gemstone.toLowerCase() !== 'no stones') {
    parts.push(`featuring ${p.gemstone}`)
  }

  // Finish
  if (p.finish) {
    parts.push(`${p.finish} metal finish`)
  }

  // Extra details (the most important field for custom items)
  if (p.details) {
    parts.push(p.details)
  }

  // Occasion
  if (p.occasion) {
    parts.push(`designed for ${p.occasion}`)
  }

  // Join into a single sentence
  const base = parts.join(', ') + '.'

  return `${base} Exquisite craftsmanship, intricate fine details, luxury accessory.`
}

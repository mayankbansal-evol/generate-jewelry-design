import { ringPrompt } from './templates/ring'
import { necklacePrompt } from './templates/necklace'
import { earringsPrompt } from './templates/earrings'
import { braceletPrompt } from './templates/bracelet'
import { genericPrompt } from './templates/generic'
import { JewelryParams, GeneratedImage } from '@/types'

// Three photography backdrops — each variant gets a different one
const PHOTOGRAPHY_STYLES = [
  'clean studio photography, isolated on pure white background, soft diffused lighting, product shot, 8K ultra-sharp',
  'dramatic luxury editorial, dark black velvet background, soft rim lighting, volumetric glow, cinematic depth, 8K',
  'lifestyle flat lay, white marble surface, natural soft daylight, minimal botanical props, warm ambient light, 8K',
] as const

const KNOWN_TYPES = ['ring', 'necklace', 'earrings', 'bracelet']

// Build the base descriptive sentence for a given set of params
const buildBase = (params: JewelryParams): string => {
  const normalizedType = params.type?.toLowerCase().trim() ?? ''
  if (normalizedType === 'ring') return ringPrompt(params)
  if (normalizedType === 'necklace') return necklacePrompt(params)
  if (normalizedType === 'earrings') return earringsPrompt(params)
  if (normalizedType === 'bracelet') return braceletPrompt(params)
  return genericPrompt(params)
}

// ── Semantic variation strategy ──────────────────────────────────────
// Produces 3 genuinely different design interpretations from the same base params.
// Variation A: Faithful — as close to the user's stated intent as possible
// Variation B: Elevated — more ornate, luxurious, richer detailing
// Variation C: Modern — cleaner, bolder, more contemporary interpretation

export interface SemanticVariant {
  label: string
  params: JewelryParams
  photographyStyle: string
}

export const buildSemanticVariants = (baseParams: JewelryParams): SemanticVariant[] => {
  // Variation A — Faithful to user intent
  const variantA: JewelryParams = { ...baseParams }

  // Variation B — Elevated/Ornate: richer details, more diamonds, more statement
  const variantB: JewelryParams = {
    ...baseParams,
    style: enrichStyle(baseParams.style, 'ornate'),
    gemstone: enrichGemstone(baseParams.gemstone ?? 'lab-grown diamonds', 'more'),
    details: enrichDetails(baseParams.details, 'ornate'),
  }

  // Variation C — Modern/Minimal: cleaner lines, refined simplicity
  const variantC: JewelryParams = {
    ...baseParams,
    style: enrichStyle(baseParams.style, 'minimal'),
    gemstone: enrichGemstone(baseParams.gemstone ?? 'lab-grown diamonds', 'minimal'),
    details: enrichDetails(baseParams.details, 'minimal'),
  }

  return [
    { label: 'Faithful', params: variantA, photographyStyle: PHOTOGRAPHY_STYLES[0] },
    { label: 'Elevated', params: variantB, photographyStyle: PHOTOGRAPHY_STYLES[1] },
    { label: 'Modern',   params: variantC, photographyStyle: PHOTOGRAPHY_STYLES[2] },
  ]
}

// Build all 3 image prompts from semantic variants
export const buildImagePrompts = (params: JewelryParams): string[] => {
  const variants = buildSemanticVariants(params)
  return variants.map(
    ({ params: p, photographyStyle }) =>
      `Professional jewelry photography. ${buildBase(p)} ${photographyStyle}.`
  )
}

// Build image prompt for a single set of params (used in refinement)
export const buildSingleImagePrompt = (params: JewelryParams): string => {
  const base = buildBase(params)
  // Use the studio white bg for refinement — clean, consistent
  return `Professional jewelry photography. ${base} ${PHOTOGRAPHY_STYLES[0]}.`
}

// Re-export for use elsewhere
export { KNOWN_TYPES }

// ── Style enrichment helpers ─────────────────────────────────────────

function enrichStyle(style: string, direction: 'ornate' | 'minimal'): string {
  if (!style) return direction === 'ornate' ? 'ornate luxury' : 'minimalist contemporary'

  const lower = style.toLowerCase()

  if (direction === 'ornate') {
    if (lower.includes('minimalist') || lower.includes('simple') || lower.includes('clean')) {
      return style.replace(/minimalist|simple|clean/gi, 'classic').concat(', with delicate diamond detailing')
    }
    if (lower.includes('modern') || lower.includes('contemporary')) {
      return style + ', with rich pavé diamond accents'
    }
    return style + ', ornate with intricate diamond detailing'
  } else {
    // minimal direction
    if (lower.includes('ornate') || lower.includes('vintage') || lower.includes('art deco') || lower.includes('baroque')) {
      return 'modern minimalist, clean geometric lines'
    }
    if (lower.includes('halo') || lower.includes('pavé') || lower.includes('cluster')) {
      return style.replace(/halo|pavé|cluster/gi, 'solitaire').concat(', sleek and refined')
    }
    return style + ', pared back with clean lines'
  }
}

function enrichGemstone(gemstone: string, direction: 'more' | 'minimal'): string {
  if (!gemstone) return direction === 'more' ? 'full pavé lab-grown diamonds' : 'single lab-grown diamond'

  const lower = gemstone.toLowerCase()

  if (direction === 'more') {
    if (lower.includes('solitaire') || lower.includes('single')) {
      return gemstone.replace(/solitaire|single/gi, 'halo of lab-grown diamonds surrounding a centre')
    }
    if (lower.includes('pavé')) return gemstone + ', diamond-encrusted'
    return gemstone + ', with additional diamond pavé accents'
  } else {
    // minimal
    if (lower.includes('pavé') || lower.includes('halo') || lower.includes('cluster')) {
      return 'single lab-grown diamond solitaire'
    }
    if (lower.includes('accent')) return 'lab-grown diamonds only, minimal setting'
    return gemstone + ', in a minimal bezel setting'
  }
}

function enrichDetails(details: string | undefined, direction: 'ornate' | 'minimal'): string {
  if (!details) {
    return direction === 'ornate'
      ? 'intricate milgrain edging, sculptural form, high polished finish'
      : 'sleek silhouette, clean edges, refined proportions'
  }

  if (direction === 'ornate') {
    return details + ', with intricate milgrain edging and fine sculptural relief'
  } else {
    // Strip ornate descriptors, lean into clean lines
    return details.replace(/ornate|intricate|baroque|elaborate|vintage/gi, 'refined').concat(', minimal and architectural')
  }
}

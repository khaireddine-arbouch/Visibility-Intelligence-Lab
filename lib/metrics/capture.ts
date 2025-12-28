/**
 * Top-rank capture metrics
 * Measures institutional dominance at premium visibility positions
 */

import type { OutletCategory } from '../types/domain'

export interface RankedEntry {
  outlet: string
  category: OutletCategory
  rank: number
}

export interface CaptureMetrics {
  topThree: number
  topFive: number
  topTen: number
}

/**
 * Calculate top-rank capture rates by category
 */
export function calculateCaptureByCategory(
  entries: RankedEntry[],
  targetCategory: OutletCategory
): CaptureMetrics {
  const topThree = entries.filter((e) => e.rank <= 3)
  const topFive = entries.filter((e) => e.rank <= 5)
  const topTen = entries.filter((e) => e.rank <= 10)

  const topThreeCategory = topThree.filter((e) => e.category === targetCategory).length
  const topFiveCategory = topFive.filter((e) => e.category === targetCategory).length
  const topTenCategory = topTen.filter((e) => e.category === targetCategory).length

  return {
    topThree: topThree.length > 0 ? (topThreeCategory / topThree.length) * 100 : 0,
    topFive: topFive.length > 0 ? (topFiveCategory / topFive.length) * 100 : 0,
    topTen: topTen.length > 0 ? (topTenCategory / topTen.length) * 100 : 0,
  }
}

/**
 * Calculate average rank by category
 */
export function calculateAvgRankByCategory(
  entries: RankedEntry[],
  targetCategory: OutletCategory
): number {
  const categoryEntries = entries.filter((e) => e.category === targetCategory)
  if (categoryEntries.length === 0) return 0

  const sum = categoryEntries.reduce((s, e) => s + e.rank, 0)
  return sum / categoryEntries.length
}

/**
 * Calculate rank distribution
 */
export function calculateRankDistribution(
  entries: RankedEntry[],
  bins: [number, number][]
): Record<string, number> {
  const distribution: Record<string, number> = {}

  bins.forEach(([min, max]) => {
    const key = `${min}-${max}`
    distribution[key] = entries.filter((e) => e.rank >= min && e.rank <= max).length
  })

  return distribution
}

/**
 * Calculate outlet dominance score
 * Combines frequency and rank quality
 */
export function calculateDominanceScore(
  entries: RankedEntry[],
  outletName: string
): number {
  const outletEntries = entries.filter((e) => e.outlet === outletName)
  if (outletEntries.length === 0) return 0

  // Weight by inverse rank (rank 1 = weight 1.0, rank 10 = weight 0.1)
  const weightedSum = outletEntries.reduce((sum, e) => sum + 1 / e.rank, 0)

  return weightedSum / entries.length
}


/**
 * Concentration metrics for visibility analysis
 * Measures inequality in algorithmic attention distribution
 */

export interface OutletAppearances {
  name: string
  appearances: number
}

/**
 * Calculate Gini coefficient for outlet visibility
 * Returns value between 0 (perfect equality) and 1 (perfect inequality)
 * Values > 0.6 indicate severe concentration
 */
export function calculateGini(outlets: OutletAppearances[]): number {
  if (outlets.length === 0) return 0

  const appearances = outlets.map((o) => o.appearances).sort((a, b) => a - b)
  const n = appearances.length
  const totalAppearances = appearances.reduce((sum, val) => sum + val, 0)

  if (totalAppearances === 0) return 0

  let sum = 0
  for (let i = 0; i < n; i++) {
    sum += (2 * (i + 1) - n - 1) * appearances[i]
  }

  return sum / (n * totalAppearances)
}

/**
 * Calculate Shannon entropy of rank distribution
 * Lower values indicate more concentrated/predictable attention
 */
export function calculateEntropy(distribution: number[]): number {
  const total = distribution.reduce((sum, val) => sum + val, 0)
  if (total === 0) return 0

  return -distribution.reduce((sum, count) => {
    if (count === 0) return sum
    const p = count / total
    return sum + p * Math.log2(p)
  }, 0)
}

/**
 * Calculate Top-N concentration
 * Returns percentage of total visibility captured by top N outlets
 */
export function calculateTopNConcentration(
  outlets: OutletAppearances[],
  n: number
): number {
  if (outlets.length === 0) return 0

  const sorted = [...outlets].sort((a, b) => b.appearances - a.appearances)
  const topN = sorted.slice(0, n)
  const topNTotal = topN.reduce((sum, o) => sum + o.appearances, 0)
  const total = outlets.reduce((sum, o) => sum + o.appearances, 0)

  return total > 0 ? (topNTotal / total) * 100 : 0
}

/**
 * Calculate power law fit
 * Returns alpha parameter indicating concentration steepness
 */
export function calculatePowerLawAlpha(outlets: OutletAppearances[]): number {
  if (outlets.length < 2) return 0

  const sorted = [...outlets].sort((a, b) => b.appearances - a.appearances)
  const validOutlets = sorted.filter((o) => o.appearances > 0)

  if (validOutlets.length < 2) return 0

  // Use maximum likelihood estimation for power law
  const xMin = validOutlets[validOutlets.length - 1].appearances
  const n = validOutlets.length

  const sum = validOutlets.reduce((s, o) => s + Math.log(o.appearances / xMin), 0)

  return 1 + n / sum
}

/**
 * Calculate Herfindahl-Hirschman Index (HHI)
 * Market concentration measure: 0 to 10,000
 * < 1,500: unconcentrated
 * 1,500-2,500: moderate concentration
 * > 2,500: high concentration
 */
export function calculateHHI(outlets: OutletAppearances[]): number {
  const total = outlets.reduce((sum, o) => sum + o.appearances, 0)
  if (total === 0) return 0

  return outlets.reduce((sum, o) => {
    const marketShare = (o.appearances / total) * 100
    return sum + marketShare * marketShare
  }, 0)
}


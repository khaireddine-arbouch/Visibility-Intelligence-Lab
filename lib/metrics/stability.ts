/**
 * Temporal stability and volatility metrics
 * Measures ranking persistence over time
 */

export interface TimeSeriesEntry {
  outlet: string
  rank: number
  date: Date | string
}

export interface StabilityMetrics {
  volatility: number // Standard deviation of ranks
  stability: number // Normalized stability score (0-1)
  lockInDays: number // Consecutive days in top positions
  avgRank: number
}

/**
 * Calculate stability metrics for a single outlet over time
 */
export function calculateOutletStability(
  entries: TimeSeriesEntry[],
  outletName: string,
  topNThreshold: number = 5
): StabilityMetrics {
  const outletEntries = entries
    .filter((e) => e.outlet === outletName)
    .sort((a, b) => {
      const dateA = typeof a.date === 'string' ? new Date(a.date) : a.date
      const dateB = typeof b.date === 'string' ? new Date(b.date) : b.date
      return dateA.getTime() - dateB.getTime()
    })

  if (outletEntries.length === 0) {
    return { volatility: 0, stability: 0, lockInDays: 0, avgRank: 0 }
  }

  const ranks = outletEntries.map((e) => e.rank)
  const avgRank = ranks.reduce((sum, r) => sum + r, 0) / ranks.length

  // Calculate volatility (standard deviation)
  const variance = ranks.reduce((sum, r) => sum + Math.pow(r - avgRank, 2), 0) / ranks.length
  const volatility = Math.sqrt(variance) / avgRank // Normalized by mean

  // Calculate stability score (inverse of coefficient of variation)
  const stability = avgRank > 0 ? Math.max(0, 1 - volatility) : 0

  // Calculate lock-in duration (consecutive days in top-N)
  let maxStreak = 0
  let currentStreak = 0
  for (const entry of outletEntries) {
    if (entry.rank <= topNThreshold) {
      currentStreak++
      maxStreak = Math.max(maxStreak, currentStreak)
    } else {
      currentStreak = 0
    }
  }

  return {
    volatility: Number(volatility.toFixed(2)),
    stability: Number(stability.toFixed(2)),
    lockInDays: maxStreak,
    avgRank: Number(avgRank.toFixed(1)),
  }
}

/**
 * Calculate rank churn rate
 * Measures how often new outlets enter top positions
 */
export function calculateChurnRate(
  entriesByDate: Map<string, TimeSeriesEntry[]>,
  topN: number = 5
): number {
  const dates = Array.from(entriesByDate.keys()).sort()
  if (dates.length < 2) return 0

  let totalChurn = 0
  for (let i = 1; i < dates.length; i++) {
    const prevTopN = new Set(
      entriesByDate
        .get(dates[i - 1])!
        .filter((e) => e.rank <= topN)
        .map((e) => e.outlet)
    )

    const currentTopN = entriesByDate
      .get(dates[i])!
      .filter((e) => e.rank <= topN)
      .map((e) => e.outlet)

    const newEntrants = currentTopN.filter((outlet) => !prevTopN.has(outlet))
    totalChurn += newEntrants.length
  }

  return (totalChurn / ((dates.length - 1) * topN)) * 100
}

/**
 * Calculate rank volatility index for entire dataset
 */
export function calculateSystemVolatility(entries: TimeSeriesEntry[]): number {
  const outletMap = new Map<string, number[]>()

  // Group ranks by outlet
  entries.forEach((entry) => {
    if (!outletMap.has(entry.outlet)) {
      outletMap.set(entry.outlet, [])
    }
    outletMap.get(entry.outlet)!.push(entry.rank)
  })

  // Calculate average coefficient of variation
  let totalCV = 0
  let count = 0

  outletMap.forEach((ranks) => {
    if (ranks.length > 1) {
      const mean = ranks.reduce((sum, r) => sum + r, 0) / ranks.length
      const variance = ranks.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / ranks.length
      const cv = mean > 0 ? Math.sqrt(variance) / mean : 0
      totalCV += cv
      count++
    }
  })

  return count > 0 ? totalCV / count : 0
}


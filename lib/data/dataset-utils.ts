/**
 * Utility functions for converting and transforming datasets
 */

import type { Dataset, SERPEntry, Outlet } from '../types/domain'
import type { SERPEntryOutput } from './parsers/schema'
import { calculateGini, calculateTopNConcentration } from '../metrics/concentration'
import { calculateCaptureByCategory, calculateAvgRankByCategory } from '../metrics/capture'

/**
 * Convert SERPEntryOutput array to Dataset format
 * This is used when uploading local files
 */
export function convertToDataset(data: SERPEntryOutput[], name: string = 'Uploaded Dataset'): Dataset {
  // Group by outlet to get appearances
  const outletMap = new Map<string, SERPEntry[]>()
  data.forEach((entry) => {
    if (!outletMap.has(entry.outlet)) {
      outletMap.set(entry.outlet, [])
    }
    outletMap.get(entry.outlet)!.push({
      rank: entry.rank,
      outlet: entry.outlet,
      category: entry.category || 'independent',
      title: entry.title || '',
      url: entry.url,
      ownership: '',
      timestamp: entry.date,
    })
  })

  // Create outlet objects
  const outlets: Outlet[] = Array.from(outletMap.entries()).map(([name, entries]) => {
    const avgRank = entries.reduce((sum, e) => sum + e.rank, 0) / entries.length
    const topThree = entries.filter((e) => e.rank <= 3).length
    const topFive = entries.filter((e) => e.rank <= 5).length

    return {
      name,
      category: entries[0].category,
      country: '',
      headquarters: '',
      parent: '',
      ownership: '',
      affiliations: '',
      appearances: entries.length,
      avgRank: Number(avgRank.toFixed(1)),
      topThreeCaptureRate: (topThree / entries.length) * 100,
      topFiveCaptureRate: (topFive / entries.length) * 100,
      stabilityScore: 0,
    }
  })

  // Calculate metrics
  const outletAppearances = outlets.map((o) => ({
    name: o.name,
    appearances: o.appearances || 0,
  }))

  const giniCoefficient = calculateGini(outletAppearances)
  const topThreeConcentration = calculateTopNConcentration(outletAppearances, 3)

  // Calculate category-specific metrics
  const rankedEntries = data.map((e) => ({
    outlet: e.outlet,
    category: e.category || 'independent',
    rank: e.rank,
  }))

  const mainstreamCapture = calculateCaptureByCategory(rankedEntries, 'mainstream')
  const independentAvgRank = calculateAvgRankByCategory(rankedEntries, 'independent')
  const localAvgRank = calculateAvgRankByCategory(rankedEntries, 'local')

  // Group queries
  const queryMap = new Map<string, SERPEntry[]>()
  data.forEach((entry) => {
    if (!queryMap.has(entry.query)) {
      queryMap.set(entry.query, [])
    }
    queryMap.get(entry.query)!.push({
      rank: entry.rank,
      outlet: entry.outlet,
      category: entry.category || 'independent',
      title: entry.title || '',
      url: entry.url,
      ownership: '',
      timestamp: entry.date,
    })
  })

  const queries = Array.from(queryMap.entries()).map(([query, entries]) => ({
    query,
    date: entries[0].timestamp?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
    results: entries.length,
    serpEntries: entries,
  }))

  // Get date range
  const dates = data.map((e) => e.date.getTime())
  const minDate = new Date(Math.min(...dates))
  const maxDate = new Date(Math.max(...dates))

  return {
    name,
    version: '1.0',
    entries: data.length,
    dateRange: {
      start: minDate.toISOString().split('T')[0],
      end: maxDate.toISOString().split('T')[0],
    },
    location: 'Local Upload',
    queries,
    outlets,
    metrics: {
      giniCoefficient: Number(giniCoefficient.toFixed(2)),
      rankEntropy: 0,
      topThreeConcentration: Number(topThreeConcentration.toFixed(1)),
      avgIndependentRank: Number(independentAvgRank.toFixed(1)),
      angloAmericanDominance: mainstreamCapture.topThree,
      localVisibility: localAvgRank > 0 ? 100 / localAvgRank : 0,
      independentOutlets: outlets.filter((o) => o.category === 'independent').length,
    },
  }
}


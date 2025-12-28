'use client'

/**
 * Global Data Context
 * Provides dataset and computed metrics to all components
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react'
import type { Dataset, SERPEntry, Outlet, MetricsSnapshot } from '../types/domain'
import type { SERPEntryOutput } from './parsers/schema'
import { calculateGini, calculateEntropy, calculateTopNConcentration } from '../metrics/concentration'
import { calculateCaptureByCategory, calculateAvgRankByCategory } from '../metrics/capture'

interface DataContextValue {
  dataset: Dataset | null
  isLoading: boolean
  error: string | null
  setDataset: (data: SERPEntryOutput[]) => void
  clearDataset: () => void
  getOutletData: (outletName: string) => Outlet | null
  getQueriesByOutlet: (outletName: string) => SERPEntry[]
  filterByDateRange: (start: Date, end: Date) => SERPEntry[]
  filterByQuery: (query: string) => SERPEntry[]
}

const DataContext = createContext<DataContextValue | undefined>(undefined)

export function useData() {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error('useData must be used within DataProvider')
  }
  return context
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [dataset, setDatasetState] = useState<Dataset | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Transform raw SERP entries into full dataset with computed metrics
  const setDataset = useCallback((data: SERPEntryOutput[]) => {
    try {
      setIsLoading(true)
      setError(null)

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
          ownership: '', // To be enriched
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
          country: '', // To be enriched
          headquarters: '',
          parent: '',
          ownership: '',
          affiliations: '',
          appearances: entries.length,
          avgRank: Number(avgRank.toFixed(1)),
          topThreeCaptureRate: (topThree / entries.length) * 100,
          topFiveCaptureRate: (topFive / entries.length) * 100,
          stabilityScore: 0, // Requires time-series calculation
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

      const fullDataset: Dataset = {
        name: 'Uploaded Dataset',
        version: '1.0',
        entries: data.length,
        dateRange: {
          start: minDate.toISOString().split('T')[0],
          end: maxDate.toISOString().split('T')[0],
        },
        location: 'Unknown',
        queries,
        outlets,
        metrics: {
          giniCoefficient: Number(giniCoefficient.toFixed(2)),
          rankEntropy: 0, // Placeholder
          topThreeConcentration: Number(topThreeConcentration.toFixed(1)),
          avgIndependentRank: Number(independentAvgRank.toFixed(1)),
          angloAmericanDominance: mainstreamCapture.topThree,
          localVisibility: localAvgRank > 0 ? 100 / localAvgRank : 0,
          independentOutlets: outlets.filter((o) => o.category === 'independent').length,
        },
      }

      setDatasetState(fullDataset)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process dataset')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const clearDataset = useCallback(() => {
    setDatasetState(null)
    setError(null)
  }, [])

  const getOutletData = useCallback(
    (outletName: string): Outlet | null => {
      if (!dataset) return null
      return dataset.outlets.find((o) => o.name === outletName) || null
    },
    [dataset]
  )

  const getQueriesByOutlet = useCallback(
    (outletName: string): SERPEntry[] => {
      if (!dataset) return []
      return dataset.queries.flatMap((q) => q.serpEntries?.filter((e) => e.outlet === outletName) || [])
    },
    [dataset]
  )

  const filterByDateRange = useCallback(
    (start: Date, end: Date): SERPEntry[] => {
      if (!dataset) return []
      return dataset.queries.flatMap((q) =>
        (q.serpEntries || []).filter((e) => {
          const entryDate = e.timestamp ? new Date(e.timestamp) : new Date()
          return entryDate >= start && entryDate <= end
        })
      )
    },
    [dataset]
  )

  const filterByQuery = useCallback(
    (query: string): SERPEntry[] => {
      if (!dataset) return []
      const matchingQuery = dataset.queries.find((q) => q.query === query)
      return matchingQuery?.serpEntries || []
    },
    [dataset]
  )

  const value = useMemo(
    () => ({
      dataset,
      isLoading,
      error,
      setDataset,
      clearDataset,
      getOutletData,
      getQueriesByOutlet,
      filterByDateRange,
      filterByQuery,
    }),
    [dataset, isLoading, error, setDataset, clearDataset, getOutletData, getQueriesByOutlet, filterByDateRange, filterByQuery]
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}


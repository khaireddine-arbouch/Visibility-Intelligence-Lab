'use client'

/**
 * Supabase Data Context
 * Fetches dataset from Supabase for better performance
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react'
import type { Dataset, SERPEntry, Outlet, MetricsSnapshot } from '../types/domain'
import { createClient } from '../supabase/client'
import { calculateGini, calculateEntropy, calculateTopNConcentration } from '../metrics/concentration'
import { calculateCaptureByCategory, calculateAvgRankByCategory } from '../metrics/capture'

interface SupabaseDataContextValue {
  dataset: Dataset | null
  isLoading: boolean
  error: string | null
  refreshData: () => Promise<void>
  setLocalDataset: (data: Dataset | null) => void // For temporary local uploads/testing
  getOutletData: (outletName: string) => Outlet | null
  getQueriesByOutlet: (outletName: string) => SERPEntry[]
  filterByDateRange: (start: Date, end: Date) => SERPEntry[]
  filterByQuery: (query: string) => SERPEntry[]
}

const SupabaseDataContext = createContext<SupabaseDataContextValue | undefined>(undefined)

export function useSupabaseData() {
  const context = useContext(SupabaseDataContext)
  if (!context) {
    throw new Error('useSupabaseData must be used within SupabaseDataProvider')
  }
  return context
}

export function SupabaseDataProvider({ children }: { children: React.ReactNode }) {
  const [dataset, setDataset] = useState<Dataset | null>(null)
  const [localDataset, setLocalDatasetState] = useState<Dataset | null>(null) // Temporary local override
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()
  
  // Use local dataset if set, otherwise use Supabase dataset
  const activeDataset = localDataset || dataset
  
  const setLocalDataset = useCallback((data: Dataset | null) => {
    setLocalDatasetState(data)
  }, [])

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Fetch all SERP entries and outlets from Supabase
      const [serpResult, outletsResult] = await Promise.all([
        supabase
          .from('serp_entries')
          .select('*')
          .order('date', { ascending: false }),
        supabase
          .from('outlets')
          .select('*')
      ])

      if (serpResult.error) throw serpResult.error
      if (outletsResult.error) throw outletsResult.error

      const serpData = serpResult.data
      const outletsData = outletsResult.data || []

      if (!serpData || serpData.length === 0) {
        setDataset(null)
        setIsLoading(false)
        return
      }

      // Create a map of outlet names to outlet data for quick lookup
      const outletsMap = new Map<string, typeof outletsData[0]>()
      outletsData.forEach((outlet) => {
        outletsMap.set(outlet.name, outlet)
      })

      // Transform Supabase data to app format
      const entries: SERPEntry[] = serpData.map((entry) => {
        const outletInfo = outletsMap.get(entry.outlet)
        return {
          rank: entry.rank,
          outlet: entry.outlet,
          category: entry.category,
          title: entry.title || '',
          url: entry.url || undefined,
          ownership: outletInfo?.ownership || '',
          timestamp: new Date(entry.date),
        }
      })

      // Group by outlet
      const outletMap = new Map<string, SERPEntry[]>()
      entries.forEach((entry) => {
        if (!outletMap.has(entry.outlet)) {
          outletMap.set(entry.outlet, [])
        }
        outletMap.get(entry.outlet)!.push(entry)
      })

      // Create outlet objects with calculated metrics, enriched with outlets table data
      const outlets: Outlet[] = Array.from(outletMap.entries()).map(([name, entries]) => {
        const avgRank = entries.reduce((sum, e) => sum + e.rank, 0) / entries.length
        const topThree = entries.filter((e) => e.rank <= 3).length
        const topFive = entries.filter((e) => e.rank <= 5).length
        
        // Get enriched data from outlets table if available
        const outletInfo = outletsMap.get(name)
        
        // Get country from serp_entries if not in outlets table
        const countryFromEntries = serpData.find(e => e.outlet === name && e.country)?.country

        return {
          name,
          category: entries[0].category,
          country: outletInfo?.country || countryFromEntries || '',
          headquarters: outletInfo?.headquarters || '',
          parent: outletInfo?.parent || '',
          ownership: outletInfo?.ownership || '',
          affiliations: outletInfo?.affiliations || '',
          appearances: entries.length,
          avgRank: Number(avgRank.toFixed(1)),
          topThreeCaptureRate: (topThree / entries.length) * 100,
          topFiveCaptureRate: (topFive / entries.length) * 100,
          stabilityScore: 0,
        }
      })

      // Calculate global metrics
      const outletAppearances = outlets.map((o) => ({
        name: o.name,
        appearances: o.appearances || 0,
      }))

      const giniCoefficient = calculateGini(outletAppearances)
      const topThreeConcentration = calculateTopNConcentration(outletAppearances, 3)

      const rankedEntries = entries.map((e) => ({
        outlet: e.outlet,
        category: e.category,
        rank: e.rank,
      }))

      const mainstreamCapture = calculateCaptureByCategory(rankedEntries, 'mainstream')
      const independentAvgRank = calculateAvgRankByCategory(rankedEntries, 'independent')
      const localAvgRank = calculateAvgRankByCategory(rankedEntries, 'local')

      // Group queries
      const queryMap = new Map<string, SERPEntry[]>()
      serpData.forEach((entry) => {
        if (!queryMap.has(entry.query)) {
          queryMap.set(entry.query, [])
        }
        queryMap.get(entry.query)!.push({
          rank: entry.rank,
          outlet: entry.outlet,
          category: entry.category,
          title: entry.title || '',
          url: entry.url || undefined,
          ownership: '',
          timestamp: new Date(entry.date),
        })
      })

      const queries = Array.from(queryMap.entries()).map(([query, entries]) => ({
        query,
        date: entries[0].timestamp?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
        results: entries.length,
        serpEntries: entries,
      }))

      // Get date range
      const dates = serpData.map((e) => new Date(e.date).getTime())
      const minDate = new Date(Math.min(...dates))
      const maxDate = new Date(Math.max(...dates))

      const fullDataset: Dataset = {
        name: 'Supabase Dataset',
        version: '1.0',
        entries: serpData.length,
        dateRange: {
          start: minDate.toISOString().split('T')[0],
          end: maxDate.toISOString().split('T')[0],
        },
        location: 'Supabase Cloud',
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

      setDataset(fullDataset)
    } catch (err) {
      console.error('Supabase fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch data from Supabase')
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  // Load data on mount
  useEffect(() => {
    fetchData()
  }, [fetchData])

  const getOutletData = useCallback(
    (outletName: string): Outlet | null => {
      if (!activeDataset) return null
      return activeDataset.outlets.find((o) => o.name === outletName) || null
    },
    [activeDataset]
  )

  const getQueriesByOutlet = useCallback(
    (outletName: string): SERPEntry[] => {
      if (!activeDataset) return []
      return activeDataset.queries.flatMap((q) => q.serpEntries?.filter((e) => e.outlet === outletName) || [])
    },
    [activeDataset]
  )

  const filterByDateRange = useCallback(
    (start: Date, end: Date): SERPEntry[] => {
      if (!activeDataset) return []
      return activeDataset.queries.flatMap((q) =>
        (q.serpEntries || []).filter((e) => {
          const entryDate = e.timestamp ? new Date(e.timestamp) : new Date()
          return entryDate >= start && entryDate <= end
        })
      )
    },
    [activeDataset]
  )

  const filterByQuery = useCallback(
    (query: string): SERPEntry[] => {
      if (!activeDataset) return []
      const matchingQuery = activeDataset.queries.find((q) => q.query === query)
      return matchingQuery?.serpEntries || []
    },
    [activeDataset]
  )

  const value = useMemo(
    () => ({
      dataset: activeDataset,
      isLoading,
      error,
      refreshData: fetchData,
      setLocalDataset,
      getOutletData,
      getQueriesByOutlet,
      filterByDateRange,
      filterByQuery,
    }),
    [activeDataset, isLoading, error, fetchData, setLocalDataset, getOutletData, getQueriesByOutlet, filterByDateRange, filterByQuery]
  )

  return <SupabaseDataContext.Provider value={value}>{children}</SupabaseDataContext.Provider>
}


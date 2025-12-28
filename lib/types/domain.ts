/**
 * Core domain types for Visibility Intelligence Lab
 */

export type OutletCategory = 'mainstream' | 'foreign' | 'independent' | 'local'

export type TheoryToggle = 'manufacturing-consent' | 'platform-capitalism' | 'digital-colonialism'

export interface Outlet {
  name: string
  category: OutletCategory
  country: string
  headquarters: string
  parent: string
  ownership: string
  affiliations: string
  appearances?: number
  avgRank?: number
  topThreeCaptureRate?: number
  topFiveCaptureRate?: number
  stabilityScore?: number
  dominantTopics?: string[]
  riskFlags?: RiskFlag[]
  recentHeadlines?: string[]
}

export interface RiskFlag {
  type: string
  condition: string
  note: string
}

export interface SERPEntry {
  rank: number
  outlet: string
  category: OutletCategory
  title: string
  url?: string
  ownership: string
  timestamp?: Date
  prevRank?: number
  movement?: 'up' | 'down' | 'same' | 'new'
}

export interface Query {
  query: string
  date: string
  results: number
  serpEntries?: SERPEntry[]
}

export interface MetricsSnapshot {
  giniCoefficient: number
  rankEntropy: number
  topThreeConcentration: number
  avgIndependentRank: number
  angloAmericanDominance: number
  localVisibility: number
  independentOutlets: number
}

export interface Dataset {
  name: string
  version: string
  entries: number
  dateRange: {
    start: string
    end: string
  }
  location: string
  queries: Query[]
  outlets: Outlet[]
  metrics: MetricsSnapshot
}

export interface ParseResult<T = any> {
  success: boolean
  data?: T
  error?: string
  warnings?: string[]
}

export interface EvidenceLayer {
  id: 'rank' | 'category' | 'ownership' | 'persistence' | 'theory'
  label: string
  enabled: boolean
}

export interface Hypothesis {
  id: string
  text: string
  supportingEvidence: string[]
  createdAt: Date
}

export interface Investigation {
  hypotheses: Hypothesis[]
  bookmarkedOutlets: string[]
  bookmarkedQueries: string[]
  bookmarkedSERPs: string[]
}


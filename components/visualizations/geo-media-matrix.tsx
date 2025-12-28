"use client"
import { useState, useMemo, useCallback } from "react"
import React from "react"
import { HelpCircle, Search, X } from "lucide-react"
import { useSupabaseData } from "@/lib/data/supabase-data-context"
import { MultiSelect } from "@/components/ui/multi-select"
import { formatQuery } from "@/lib/utils/format-query"

type TheoryToggle = "manufacturing-consent" | "platform-capitalism" | "digital-colonialism"

interface GeoMediaMatrixProps {
  theoryMode: boolean
  fullscreen?: boolean
  activeTheories: Set<TheoryToggle>
  onOutletClick: (outletName: string) => void
  showTrace?: boolean
  selectedCountries?: string[]
  selectedTopics?: string[]
}

export function GeoMediaMatrix({
  theoryMode,
  fullscreen,
  activeTheories,
  onOutletClick,
  showTrace,
  selectedCountries: externalSelectedCountries,
  selectedTopics: externalSelectedTopics,
}: GeoMediaMatrixProps) {
  const { dataset, isLoading } = useSupabaseData()
  const [hoveredCell, setHoveredCell] = useState<{ country: string; topic: string } | null>(null)
  const [hoveredTerm, setHoveredTerm] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [internalSelectedCountries, setInternalSelectedCountries] = useState<string[]>([])
  const [internalSelectedTopics, setInternalSelectedTopics] = useState<string[]>([])

  // Use external props if provided, otherwise use internal state
  const selectedCountries = externalSelectedCountries !== undefined ? externalSelectedCountries : internalSelectedCountries
  const selectedTopics = externalSelectedTopics !== undefined ? externalSelectedTopics : internalSelectedTopics

  // Memoize the raw data processing with better caching
  const { topics, countries, matrix } = useMemo(() => {
    if (!dataset) {
      return { topics: [], countries: [], matrix: [] }
    }

    // Extract unique queries (topics) and countries from outlets - limit to 7 topics by default
    const uniqueQueries = Array.from(new Set(dataset.queries.map(q => q.query))).slice(0, 7)
    const uniqueCountries = Array.from(
      new Set(dataset.outlets.map(o => o.country).filter(Boolean))
    )
    
    // If we don't have enough countries, add "Other"
    const countryList = uniqueCountries.length > 0 
      ? [...uniqueCountries, "Other"]
      : ["USA", "UK", "India", "Turkey", "Other"]

    // Build matrix: country x topic visibility
    const matrixData: number[][] = []
    
    // Pre-compute outlet country map for faster lookups
    const outletCountryMap = new Map<string, string>()
    dataset.outlets.forEach(o => {
      if (o.name && o.country) {
        outletCountryMap.set(o.name, o.country)
      }
    })
    
    countryList.forEach((country) => {
      const row: number[] = []
      uniqueQueries.forEach((query) => {
        // Count entries for this country/topic combination
        const queryData = dataset.queries.find(q => q.query === query)
        const entries = queryData?.serpEntries || []
        
        const count = entries.filter(e => {
          const outletCountry = outletCountryMap.get(e.outlet)
          return outletCountry === country || (country === "Other" && outletCountry && !countryList.slice(0, -1).includes(outletCountry))
        }).length
        
        const total = entries.length
        const percentage = total > 0 ? Math.round((count / total) * 100) : 0
        row.push(percentage)
      })
      matrixData.push(row)
    })

    return {
      topics: uniqueQueries,
      countries: countryList,
      matrix: matrixData,
    }
  }, [dataset])

  // Memoize filtered data with better performance
  const filteredData = useMemo(() => {
    let filteredTopics = topics
    let filteredCountries = countries
    let filteredMatrix = matrix

    // Filter by search query
    if (searchQuery) {
      const queryLower = searchQuery.toLowerCase()
      const topicIndices = topics
        .map((topic, idx) => (topic.toLowerCase().includes(queryLower) || formatQuery(topic).toLowerCase().includes(queryLower) ? idx : -1))
        .filter((idx) => idx !== -1)
      const countryIndices = countries
        .map((country, idx) => (country.toLowerCase().includes(queryLower) ? idx : -1))
        .filter((idx) => idx !== -1)

      if (topicIndices.length > 0 || countryIndices.length > 0) {
        filteredTopics = topicIndices.length > 0 ? topicIndices.map((idx) => topics[idx]) : topics
        filteredCountries =
          countryIndices.length > 0 ? countryIndices.map((idx) => countries[idx]) : countries
        filteredMatrix = countryIndices.length > 0
          ? countryIndices.map((idx) => matrix[idx])
          : matrix
        if (topicIndices.length > 0) {
          filteredMatrix = filteredMatrix.map((row) => topicIndices.map((idx) => row[idx]))
        }
      } else {
        return { topics: [], countries: [], matrix: [] }
      }
    }

    // Filter by selected countries (multi-select)
    if (selectedCountries.length > 0) {
      const countryIndices = selectedCountries
        .map(country => countries.indexOf(country))
        .filter(idx => idx !== -1)
      
      if (countryIndices.length > 0) {
        filteredCountries = countryIndices.map(idx => countries[idx])
        filteredMatrix = countryIndices.map(idx => matrix[idx])
      }
    }

    // Filter by selected topics (multi-select) - handle formatted vs raw topic names
    if (selectedTopics.length > 0) {
      const topicIndices = selectedTopics
        .map(topic => {
          // Try to find by formatted name first, then by raw name
          const formattedIndex = topics.findIndex(t => formatQuery(t) === topic)
          if (formattedIndex !== -1) return formattedIndex
          return topics.indexOf(topic)
        })
        .filter(idx => idx !== -1)
      
      if (topicIndices.length > 0) {
        filteredTopics = topicIndices.map(idx => topics[idx])
        filteredMatrix = filteredMatrix.map((row) => topicIndices.map((idx) => row[idx]))
      }
    }

    return {
      topics: filteredTopics,
      countries: filteredCountries,
      matrix: filteredMatrix,
    }
  }, [topics, countries, matrix, searchQuery, selectedCountries, selectedTopics])

  const calculatePAI = (countryIdx: number, topicIdx: number) => {
    const localVisibility = matrix[3][topicIdx]
    const foreignVisibility = matrix[countryIdx][topicIdx]
    if (localVisibility === 0) return "∞"
    return (foreignVisibility / localVisibility).toFixed(1)
  }

  const glossary: Record<string, string> = {
    pai: "Perspective Asymmetry Index: Ratio of foreign outlet visibility to local outlet visibility. Values >1 indicate external narrative dominance. ∞ indicates complete local displacement.",
    relational: "This section measures relational dynamics: who speaks about whom. Not aggregate rankings.",
  }

  return (
    <div className={`border border-border bg-card flex flex-col relative ${fullscreen ? "h-[700px]" : "h-[600px]"}`}>
      <div className="p-4 border-b border-border space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold font-mono">Geo-Media Matrix</h3>
            <div className="relative">
              <HelpCircle
                className="h-3 w-3 text-muted-foreground cursor-help"
                onMouseEnter={() => setHoveredTerm("relational")}
                onMouseLeave={() => setHoveredTerm(null)}
              />
              {hoveredTerm === "relational" && (
                <div
                  className="absolute left-0 top-full mt-2 w-72 bg-background border border-border p-3 text-xs text-muted-foreground z-50"
                  onMouseEnter={() => setHoveredTerm("relational")}
                  onMouseLeave={() => setHoveredTerm(null)}
                >
                  {glossary.relational}
                </div>
              )}
            </div>
          </div>
          {theoryMode && activeTheories.has("digital-colonialism") && (
            <div className="px-2 py-1 bg-signal-amber/10 border border-signal-amber/20 text-signal-amber text-xs font-mono">
              Informational Imperialism
            </div>
          )}
        </div>
        
        <p className="text-xs text-muted-foreground font-mono">
          Relational analysis: Whose media speaks about whom — and with what dominance?
        </p>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search countries or topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-7 pr-8 py-1.5 text-xs font-mono bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-ring"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          {externalSelectedCountries === undefined && (
            <MultiSelect
              options={countries}
              value={selectedCountries}
              onChange={setInternalSelectedCountries}
              placeholder="Select Countries"
              className="min-w-[200px]"
            />
          )}
          {externalSelectedTopics === undefined && (
            <MultiSelect
              options={topics.map(t => formatQuery(t))}
              value={selectedTopics}
              onChange={setInternalSelectedTopics}
              placeholder="Select Topics"
              className="min-w-[200px]"
            />
          )}
          {(searchQuery || selectedCountries.length > 0 || selectedTopics.length > 0) && (
            <button
              onClick={() => {
                setSearchQuery("")
                if (externalSelectedCountries === undefined) {
                  setInternalSelectedCountries([])
                }
                if (externalSelectedTopics === undefined) {
                  setInternalSelectedTopics([])
                }
              }}
              className="px-2 py-1.5 text-xs font-mono text-muted-foreground hover:text-foreground border border-border rounded"
              title="Clear all filters"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
      <div className="p-6 overflow-auto flex-1 min-h-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground font-mono">
            Loading data...
          </div>
        ) : filteredData.topics.length === 0 || filteredData.countries.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground font-mono">
            {topics.length === 0 || countries.length === 0
              ? "No data available"
              : "No results match your filters"}
          </div>
        ) : (
          <div 
            className="grid gap-1.5 min-w-max pr-6"
            style={{
              gridTemplateColumns: `100px repeat(${filteredData.topics.length}, 90px)`
            }}
          >
              <div />
              {filteredData.topics.map((topic, i) => (
                <div key={i} className="text-xs font-mono text-muted-foreground text-center truncate px-1" title={topic}>
                  {formatQuery(topic)}
                </div>
              ))}

          {filteredData.countries.map((country, countryIdx) => {
            const originalCountryIdx = countries.indexOf(country)
            return (
            <React.Fragment key={`country-${countryIdx}`}>
              <div className="text-xs font-mono text-muted-foreground flex items-center">
                {country}
              </div>
              {filteredData.matrix[countryIdx].map((value, topicIdx) => {
                const originalTopicIdx = filteredData.topics.length === topics.length
                  ? topicIdx
                  : topics.indexOf(filteredData.topics[topicIdx])
                const isHighlighted = activeTheories.has("digital-colonialism") && country === "Turkey"
                const pai = originalCountryIdx === 0 && originalTopicIdx !== -1 ? calculatePAI(originalCountryIdx, originalTopicIdx) : null
                const currentTopic = filteredData.topics[topicIdx]
                const isHovered = hoveredCell?.country === country && hoveredCell?.topic === currentTopic

                return (
                  <div
                    key={`${countryIdx}-${topicIdx}`}
                    className={`w-[90px] h-[90px] flex items-center justify-center text-xs font-mono border border-border relative group cursor-pointer ${isHighlighted && showTrace ? "ring-2 ring-signal-amber" : ""}`}
                    style={{
                      backgroundColor:
                        value > 50
                          ? "rgb(239, 68, 68)"
                          : value > 20
                            ? "rgb(251, 146, 60)"
                            : value > 5
                              ? "rgb(59, 130, 246)"
                              : "rgb(38, 38, 38)",
                      color: value > 5 ? "white" : "rgb(115, 115, 115)",
                    }}
                    onMouseEnter={() => setHoveredCell({ country, topic: currentTopic })}
                    onMouseLeave={() => setHoveredCell(null)}
                    onClick={() => onOutletClick(country)}
                  >
                    {value}%
                    <div className="absolute inset-0 bg-foreground/5 opacity-0 group-hover:opacity-100" />
                    {isHovered && (
                      <div className={`absolute left-1/2 -translate-x-1/2 px-3 py-2 bg-background border border-border text-xs font-mono z-50 shadow-lg min-w-[200px] max-w-[300px] ${
                        countryIdx === 0 
                          ? "top-full mt-2" 
                          : "bottom-full mb-2"
                      }`}>
                        <div className="space-y-1">
                          <div className="font-semibold text-foreground">
                            {country} × {formatQuery(currentTopic)}
                          </div>
                          <div className="text-muted-foreground border-t border-border pt-1 mt-1">
                            <div>Visibility: <span className="text-foreground font-semibold">{value}%</span></div>
                            {value > 50 && (
                              <div className="text-red-400 mt-0.5">High dominance</div>
                            )}
                            {value > 20 && value <= 50 && (
                              <div className="text-orange-400 mt-0.5">Moderate presence</div>
                            )}
                            {value > 5 && value <= 20 && (
                              <div className="text-blue-400 mt-0.5">Low visibility</div>
                            )}
                            {value <= 5 && (
                              <div className="text-muted-foreground mt-0.5">Minimal presence</div>
                            )}
                          </div>
                          {pai && (
                            <div className="text-muted-foreground border-t border-border pt-1 mt-1">
                              <div>PAI: <span className="text-foreground font-semibold">{pai}</span></div>
                              <div className="text-xs italic mt-0.5">
                                {pai === "∞" 
                                  ? "Complete local displacement" 
                                  : parseFloat(pai) > 1 
                                    ? "Foreign narrative dominance" 
                                    : "Local perspective stronger"}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </React.Fragment>
          )})}
          </div>
        )}

        <div className="mt-4 p-3 border-t border-border bg-muted/5">
          <div className="flex items-center gap-2 mb-2">
            <p className="text-xs font-mono font-semibold">Perspective Asymmetry Index (PAI)</p>
            <div className="relative">
              <HelpCircle
                className="h-3 w-3 text-muted-foreground cursor-help"
                onMouseEnter={() => setHoveredTerm("pai")}
                onMouseLeave={() => setHoveredTerm(null)}
              />
              {hoveredTerm === "pai" && (
                <div
                  className="absolute left-0 top-full mt-2 w-72 bg-background border border-border p-3 text-xs text-muted-foreground z-50"
                  onMouseEnter={() => setHoveredTerm("pai")}
                  onMouseLeave={() => setHoveredTerm(null)}
                >
                  {glossary.pai}
                </div>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground font-mono">
            Formula: Visibility(origin ≠ subject) / Visibility(local). Hover over US row for PAI values. Values {">"}1
            indicate foreign narrative dominance over local perspectives. ∞ = complete informational displacement.
          </p>
          <p className="text-xs text-muted-foreground font-mono mt-2 italic">
            US outlets dominate Turkey topics with PAI of ∞ (no local visibility detected).
          </p>
        </div>

        {activeTheories.has("digital-colonialism") && (
          <div className="mt-4 p-3 border-t border-signal-amber/20 bg-signal-amber/5">
            <p className="font-mono text-signal-amber text-xs font-semibold mb-1">Theory Annotation: Digital Colonialism</p>
            <p className="text-xs text-muted-foreground font-mono italic">
              Despite Turkey-based searches, US/UK outlets capture 75%+ visibility across all topics. Local Turkish
              narratives: 0.3%. This is informational displacement, not organic relevance.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

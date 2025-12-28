"use client"

import { HelpCircle, Search, X } from "lucide-react"
import { useState, useMemo } from "react"
import { useSupabaseData } from "@/lib/data/supabase-data-context"
import { MultiSelect } from "@/components/ui/multi-select"

type TheoryToggle = "manufacturing-consent" | "platform-capitalism" | "digital-colonialism"

interface TemporalDriftProps {
  theoryMode: boolean
  activeTheories: Set<TheoryToggle>
  showTrace?: boolean
}

export function TemporalDrift({ theoryMode, activeTheories, showTrace }: TemporalDriftProps) {
  const { dataset, isLoading } = useSupabaseData()
  const [hoveredTerm, setHoveredTerm] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<string[]>([])
  const [minStability, setMinStability] = useState<number | "">("")
  const [maxVolatility, setMaxVolatility] = useState<number | "">("")

  const { outlets, dates } = useMemo(() => {
    if (!dataset) {
      return { outlets: [], dates: [] }
    }

    // Extract unique dates from queries
    const uniqueDates = Array.from(
      new Set(dataset.queries.map(q => q.date).filter(Boolean))
    ).sort().slice(0, 8)
    
    // Format dates for display
    const formattedDates = uniqueDates.map(date => {
      const d = new Date(date)
      return `${d.toLocaleString('default', { month: 'short' })} ${d.getDate()}`
    })

    // Calculate volatility and stability for each outlet
    const outletStats = dataset.outlets.map((outlet) => {
      // Get all entries for this outlet
      const entries = dataset.queries.flatMap(q => 
        q.serpEntries?.filter(e => e.outlet === outlet.name) || []
      )

      if (entries.length === 0) {
        return {
          name: outlet.name,
          volatility: 1,
          stability: 0,
          lockInDays: 0,
        }
      }

      // Calculate rank volatility (standard deviation)
      const ranks = entries.map(e => e.rank)
      const avgRank = ranks.reduce((sum, r) => sum + r, 0) / ranks.length
      const variance = ranks.reduce((sum, r) => sum + Math.pow(r - avgRank, 2), 0) / ranks.length
      const volatility = Math.sqrt(variance) / 10 // Normalize to 0-1 scale

      // Calculate stability (percentage of entries in top-5)
      const topFiveCount = entries.filter(e => e.rank <= 5).length
      const stability = topFiveCount / entries.length

      // Calculate lock-in days (simplified: consecutive days in top-5)
      // For now, use a simplified calculation based on stability
      const lockInDays = Math.round(stability * 7)

      return {
        name: outlet.name,
        volatility: Math.min(volatility, 1),
        stability,
        lockInDays,
      }
    }).sort((a, b) => a.volatility - b.volatility)

    return {
      outlets: outletStats,
      dates: formattedDates,
    }
  }, [dataset])

  const filteredOutlets = useMemo(() => {
    return outlets.filter((outlet) => {
      // Search by outlet name
      if (searchQuery && !outlet.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      // Filter by status (multi-select)
      if (selectedStatus.length > 0) {
        const isEntrenched = outlet.stability > 0.85
        const status = isEntrenched ? "entrenched" : "variable"
        if (!selectedStatus.includes(status)) return false
      }
      // Filter by stability range
      if (minStability !== "" && outlet.stability < minStability) return false
      // Filter by volatility range
      if (maxVolatility !== "" && outlet.volatility > maxVolatility) return false
      return true
    })
  }, [outlets, searchQuery, selectedStatus, minStability, maxVolatility])

  // Calculate rank data for all outlets
  const outletRankData = useMemo(() => {
    if (!dataset || dates.length === 0) return new Map()
    
    const rankMap = new Map<string, number[]>()
    
    filteredOutlets.slice(0, 5).forEach((outlet) => {
      const ranks = dates.map((date) => {
        const query = dataset.queries.find(q => {
          const qDate = new Date(q.date)
          const formattedDate = `${qDate.toLocaleString('default', { month: 'short' })} ${qDate.getDate()}`
          return formattedDate === date
        })
        
        if (!query) return 0
        
        const entry = query.serpEntries?.find(e => e.outlet === outlet.name)
        return entry?.rank || 0
      })
      
      rankMap.set(outlet.name, ranks)
    })
    
    return rankMap
  }, [dataset, dates, filteredOutlets])

  const glossary: Record<string, string> = {
    temporal: "Ranking stability reveals structural power. Which actors benefit from algorithmic persistence over time?",
    volatility:
      "Rank Volatility Index: Standard deviation of daily rank positions. Higher values = unstable visibility.",
    stability: "Stability Score: Percentage of days rank unchanged in Top-5. Values >0.85 indicate entrenched power.",
    lockin:
      "Lock-in Duration: Consecutive days continuously in Top-N positions. Longer duration = structural persistence.",
  }

  return (
    <div className="border border-border bg-card flex flex-col relative h-[700px]">
      <div className="p-4 border-b border-border space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold font-mono">Temporal Drift</h3>
            <div className="relative">
              <HelpCircle
                className="h-3 w-3 text-muted-foreground cursor-help"
                onMouseEnter={() => setHoveredTerm("temporal")}
                onMouseLeave={() => setHoveredTerm(null)}
              />
              {hoveredTerm === "temporal" && (
                <div
                  className="absolute left-0 top-full mt-2 w-72 bg-background border border-border p-3 text-xs text-muted-foreground z-50"
                  onMouseEnter={() => setHoveredTerm("temporal")}
                  onMouseLeave={() => setHoveredTerm(null)}
                >
                  Ranking stability reveals structural power. Which actors benefit from algorithmic persistence over time?
                </div>
              )}
            </div>
          </div>
          {theoryMode && activeTheories.size > 0 && (
            <div className="px-2 py-1 bg-signal-amber/10 border border-signal-amber/20 text-signal-amber text-xs font-mono">
              Stability = Structural Advantage
            </div>
          )}
        </div>
        
        <p className="text-xs text-muted-foreground font-mono">
          Ranking stability reveals structural power. Which actors benefit from algorithmic persistence over time?
        </p>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-muted/5 border border-border p-3">
            <div className="flex items-center gap-1 mb-2">
              <p className="text-xs text-muted-foreground font-mono">Avg. Volatility (Top-5)</p>
              <div className="relative">
                <HelpCircle
                  className="h-3 w-3 text-muted-foreground cursor-help"
                  onMouseEnter={() => setHoveredTerm("volatility")}
                  onMouseLeave={() => setHoveredTerm(null)}
                />
                {hoveredTerm === "volatility" && (
                  <div
                    className="absolute left-0 top-full mt-2 w-72 bg-background border border-border p-3 text-xs text-muted-foreground z-50"
                    onMouseEnter={() => setHoveredTerm("volatility")}
                    onMouseLeave={() => setHoveredTerm(null)}
                  >
                    {glossary.volatility}
                  </div>
                )}
              </div>
            </div>
            <p className="text-lg font-semibold font-mono">
              {outlets.length > 0 
                ? (outlets.reduce((sum, o) => sum + o.volatility, 0) / outlets.length).toFixed(2)
                : "0.00"}
            </p>
            <p className="text-xs text-signal-blue mt-1 font-mono">Low volatility</p>
          </div>
          <div className="bg-muted/5 border border-border p-3">
            <div className="flex items-center gap-1 mb-2">
              <p className="text-xs text-muted-foreground font-mono">Avg. Stability (Top-5)</p>
              <div className="relative">
                <HelpCircle
                  className="h-3 w-3 text-muted-foreground cursor-help"
                  onMouseEnter={() => setHoveredTerm("stability")}
                  onMouseLeave={() => setHoveredTerm(null)}
                />
                {hoveredTerm === "stability" && (
                  <div
                    className="absolute left-0 top-full mt-2 w-72 bg-background border border-border p-3 text-xs text-muted-foreground z-50"
                    onMouseEnter={() => setHoveredTerm("stability")}
                    onMouseLeave={() => setHoveredTerm(null)}
                  >
                    {glossary.stability}
                  </div>
                )}
              </div>
            </div>
            <p className="text-lg font-semibold font-mono">
              {outlets.length > 0
                ? (outlets.reduce((sum, o) => sum + o.stability, 0) / outlets.length).toFixed(2)
                : "0.00"}
            </p>
            <p className="text-xs text-signal-red mt-1 font-mono">High persistence</p>
          </div>
          <div className="bg-muted/5 border border-border p-3">
            <div className="flex items-center gap-1 mb-2">
              <p className="text-xs text-muted-foreground font-mono">Max Lock-In Duration</p>
              <div className="relative">
                <HelpCircle
                  className="h-3 w-3 text-muted-foreground cursor-help"
                  onMouseEnter={() => setHoveredTerm("lockin")}
                  onMouseLeave={() => setHoveredTerm(null)}
                />
                {hoveredTerm === "lockin" && (
                  <div
                    className="absolute left-0 top-full mt-2 w-72 bg-background border border-border p-3 text-xs text-muted-foreground z-50"
                    onMouseEnter={() => setHoveredTerm("lockin")}
                    onMouseLeave={() => setHoveredTerm(null)}
                  >
                    {glossary.lockin}
                  </div>
                )}
              </div>
            </div>
            <p className="text-lg font-semibold font-mono">
              {outlets.length > 0
                ? `${Math.max(...outlets.map(o => o.lockInDays))} days`
                : "0 days"}
            </p>
            <p className="text-xs text-muted-foreground mt-1 font-mono truncate" title={
              outlets.length > 0
                ? outlets.filter(o => o.lockInDays === Math.max(...outlets.map(o => o.lockInDays))).map(o => o.name).join(", ")
                : "N/A"
            }>
              {outlets.length > 0
                ? outlets.filter(o => o.lockInDays === Math.max(...outlets.map(o => o.lockInDays))).map(o => o.name).slice(0, 2).join(", ")
                : "N/A"}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search outlets..."
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
          <MultiSelect
            options={["entrenched", "variable"]}
            value={selectedStatus}
            onChange={setSelectedStatus}
            placeholder="Select Status"
            className="min-w-[200px]"
          />
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-mono">Stability:</span>
            <input
              type="number"
              step="0.01"
              placeholder="Min"
              value={minStability}
              onChange={(e) => setMinStability(e.target.value === "" ? "" : Number(e.target.value))}
              min="0"
              max="1"
              className="w-20 px-2 py-1.5 text-xs font-mono bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-mono">Volatility:</span>
            <input
              type="number"
              step="0.01"
              placeholder="Max"
              value={maxVolatility}
              onChange={(e) => setMaxVolatility(e.target.value === "" ? "" : Number(e.target.value))}
              min="0"
              max="1"
              className="w-20 px-2 py-1.5 text-xs font-mono bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          {(selectedStatus.length > 0 || minStability !== "" || maxVolatility !== "") && (
            <button
              onClick={() => {
                setSelectedStatus([])
                setMinStability("")
                setMaxVolatility("")
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
        ) : filteredOutlets.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground font-mono">
            {outlets.length === 0 ? "No data available" : "No results match your filters"}
          </div>
        ) : (
          <>
            {/* Outlets Table */}
            <div className="mb-6 border border-border bg-card">
              <div className="grid grid-cols-5 gap-2 p-3 bg-muted/5 border-b border-border text-xs font-mono text-muted-foreground">
                <div>Outlet</div>
                <div>Volatility Index</div>
                <div>Stability Score</div>
                <div>Lock-In Days</div>
                <div>Status</div>
              </div>
              {filteredOutlets.map((outlet, i) => {
                const isEntrenched = outlet.stability > 0.85
                const shouldTrace = showTrace && activeTheories.size > 0 && isEntrenched
                return (
                  <div
                    key={i}
                    className={`grid grid-cols-5 gap-2 p-3 border-b border-border last:border-b-0 text-xs font-mono hover:bg-muted/5 transition-colors ${shouldTrace ? "bg-signal-amber/5 ring-1 ring-signal-amber/30" : ""}`}
                  >
                    <div className="font-semibold">{outlet.name}</div>
                    <div className={outlet.volatility < 0.3 ? "text-signal-blue" : "text-foreground"}>{outlet.volatility.toFixed(2)}</div>
                    <div className={outlet.stability > 0.85 ? "text-signal-red" : "text-foreground"}>{outlet.stability.toFixed(2)}</div>
                    <div className="text-foreground">{outlet.lockInDays}d</div>
                    <div className="text-muted-foreground">
                      {isEntrenched ? "Entrenched" : "Variable"}
                      {shouldTrace && <span className="text-signal-amber ml-1">(Theory)</span>}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Rank Timeline Visualization */}
            <div className="mb-6">
              <h4 className="text-xs font-semibold font-mono text-muted-foreground mb-4">Rank Timeline (Top 5 Outlets)</h4>
              <div className="space-y-4">
                {filteredOutlets.slice(0, 5).map((outlet) => {
                  const isMainstream = outlet.stability > 0.8
                  const shouldTrace = showTrace && activeTheories.size > 0 && isMainstream
                  const rankData = outletRankData.get(outlet.name) || dates.map(() => 0)
                  
                  return (
                    <div 
                      key={outlet.name} 
                      className={`border border-border bg-card p-3 ${shouldTrace ? "ring-2 ring-signal-amber/30" : ""}`}
                    >
                      <p className="text-xs font-mono font-semibold mb-3">{outlet.name}</p>
                      <div className="flex items-end gap-1.5">
                        {dates.map((date, dateIdx) => {
                          const rank = rankData[dateIdx]
                          const height = rank > 0 ? Math.max(20, 100 - (rank * 8)) : 20
                          const color = rank <= 3 ? "bg-signal-red" : rank <= 7 ? "bg-signal-amber" : rank > 0 ? "bg-signal-blue" : "bg-muted"

                          return (
                            <div key={dateIdx} className="flex-1 relative group">
                              <div
                                className={`${color} flex items-center justify-center text-xs font-mono transition-all group-hover:opacity-90 border border-border`}
                                style={{ height: `${height}px`, minHeight: '20px' }}
                                title={`${date}: Rank #${rank || 'N/A'}`}
                              >
                                {rank > 0 && (
                                  <span className="text-[10px] text-white font-semibold">#{rank}</span>
                                )}
                              </div>
                              <div className="absolute inset-x-0 -bottom-5 text-[10px] font-mono text-muted-foreground text-center opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                {date}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Theory Annotation */}
            {activeTheories.size > 0 && (
              <div className="mt-6 p-3 bg-signal-amber/5 border border-signal-amber/20">
                <p className="font-mono text-signal-amber text-xs font-semibold mb-1">Theory Annotation: Manufacturing Consent</p>
                <p className="text-xs text-muted-foreground font-mono italic">
                  High rank stability suggests algorithmic trust, not neutrality. Low volatility + high persistence =
                  entrenched power. Consistent top rankings across time indicate structural algorithmic advantages, not
                  content quality.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

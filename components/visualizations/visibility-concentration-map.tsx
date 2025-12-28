"use client"

import { HelpCircle, TrendingDown, Search, X } from "lucide-react"
import { useState, useMemo } from "react"
import { useSupabaseData } from "@/lib/data/supabase-data-context"
import { MultiSelect } from "@/components/ui/multi-select"

type TheoryToggle = "manufacturing-consent" | "platform-capitalism" | "digital-colonialism"

interface VisibilityConcentrationMapProps {
  theoryMode: boolean
  fullscreen?: boolean
  activeTheories: Set<TheoryToggle>
  onOutletClick: (outletName: string) => void
  showTrace?: boolean
}

export function VisibilityConcentrationMap({
  theoryMode,
  fullscreen,
  activeTheories,
  onOutletClick,
  showTrace,
}: VisibilityConcentrationMapProps) {
  const { dataset, isLoading } = useSupabaseData()
  const [hoveredTerm, setHoveredTerm] = useState<string | null>(null)
  const [scale, setScale] = useState<"linear" | "log">("linear")
  const [removedOutlet, setRemovedOutlet] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [minAppearances, setMinAppearances] = useState<number | "">("")
  const [maxAppearances, setMaxAppearances] = useState<number | "">("")

  const outlets = useMemo(() => {
    if (!dataset) return []
    return dataset.outlets
      .map((outlet) => ({
        name: outlet.name,
        category: outlet.category,
        appearances: outlet.appearances || 0,
        avgRank: outlet.avgRank || 0,
      }))
      .sort((a, b) => b.appearances - a.appearances)
  }, [dataset])

  const totalAppearances = useMemo(() => {
    return outlets.reduce((sum, o) => sum + o.appearances, 0)
  }, [outlets])

  const giniCoefficient = useMemo(() => {
    return dataset?.metrics.giniCoefficient || 0
  }, [dataset])

  const topThreeConcentration = useMemo(() => {
    return dataset?.metrics.topThreeConcentration || 0
  }, [dataset])

  const uniqueCategories = useMemo(() => {
    return Array.from(new Set(outlets.map(o => o.category).filter(Boolean))).sort()
  }, [outlets])

  const displayOutlets = useMemo(() => {
    let filtered = removedOutlet ? outlets.filter((o) => o.name !== removedOutlet) : outlets

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter((o) =>
        o.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filter by categories (multi-select)
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((o) => selectedCategories.includes(o.category))
    }

    // Filter by appearances range
    if (minAppearances !== "") {
      filtered = filtered.filter((o) => o.appearances >= minAppearances)
    }
    if (maxAppearances !== "") {
      filtered = filtered.filter((o) => o.appearances <= maxAppearances)
    }

    return filtered
  }, [outlets, removedOutlet, searchQuery, selectedCategories, minAppearances, maxAppearances])

  const maxDisplayAppearances = useMemo(() => {
    if (displayOutlets.length === 0) return 1
    return Math.max(...displayOutlets.map((o) => o.appearances))
  }, [displayOutlets])

  const shouldHighlight = (category: string) => {
    if (activeTheories.has("manufacturing-consent") && category === "mainstream") return true
    if (activeTheories.has("digital-colonialism") && category === "local") return true
    return false
  }

  const glossary: Record<string, string> = {
    visibility: "Calculated as frequency × (1 / rank). Higher visibility = more prominent placement across queries.",
    dominance:
      "Structural power in search results. Measured by consistency of top-rank positions over time and topics.",
    rank: "Position in search results (1 = most visible). Lower numbers indicate greater algorithmic preference.",
    gini: "Gini coefficient measures inequality (0 = perfect equality, 1 = perfect inequality). Values >0.6 indicate severe concentration.",
    entropy: "Shannon entropy of rank distribution. Lower values indicate more predictable/concentrated attention.",
  }

  return (
    <div className={`border border-border bg-card flex flex-col relative ${fullscreen ? "h-[700px]" : "h-[600px]"}`}>
      <div className="p-3 border-b border-border relative shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">Visibility Concentration</h3>
              <div className="relative">
                <HelpCircle
                  className="h-3 w-3 text-muted-foreground cursor-help"
                  onMouseEnter={() => setHoveredTerm("visibility")}
                  onMouseLeave={() => setHoveredTerm(null)}
                />
                {hoveredTerm === "visibility" && (
                  <div
                    className="absolute left-0 top-full mt-2 w-72 bg-background border border-border p-3 text-xs text-muted-foreground z-50 shadow-lg rounded-md"
                    onMouseEnter={() => setHoveredTerm("visibility")}
                    onMouseLeave={() => setHoveredTerm(null)}
                  >
                    {glossary.visibility}
                  </div>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">
              This section answers the question: How unequally is algorithmic attention distributed overall?
            </p>
          </div>
          {theoryMode && activeTheories.has("manufacturing-consent") && (
            <div className="px-2 py-1 bg-signal-amber/10 border border-signal-amber/20 text-signal-amber text-xs font-mono">
              Sourcing Filter
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 mb-2">
          <div className="bg-muted/10 border border-border p-2">
            <div className="flex items-center gap-1 mb-1">
              <p className="text-xs text-muted-foreground font-mono">Gini Coefficient</p>
              <div className="relative">
                <HelpCircle
                  className="h-3 w-3 text-muted-foreground cursor-help"
                  onMouseEnter={() => setHoveredTerm("gini")}
                  onMouseLeave={() => setHoveredTerm(null)}
                />
                {hoveredTerm === "gini" && (
                  <div
                    className="absolute left-0 top-full mt-2 w-72 bg-background border border-border p-3 text-xs text-muted-foreground z-50 shadow-lg rounded-md"
                    onMouseEnter={() => setHoveredTerm("gini")}
                    onMouseLeave={() => setHoveredTerm(null)}
                  >
                    {glossary.gini}
                  </div>
                )}
              </div>
            </div>
            <p className="text-lg font-semibold">{giniCoefficient.toFixed(2)}</p>
            <p className="text-xs text-signal-red mt-1">Severe inequality</p>
          </div>
          <div className="bg-muted/10 border border-border p-2">
            <div className="flex items-center gap-1 mb-1">
              <p className="text-xs text-muted-foreground font-mono">Rank Entropy</p>
              <div className="relative">
                <HelpCircle
                  className="h-3 w-3 text-muted-foreground cursor-help"
                  onMouseEnter={() => setHoveredTerm("entropy")}
                  onMouseLeave={() => setHoveredTerm(null)}
                />
                {hoveredTerm === "entropy" && (
                  <div
                    className="absolute left-0 top-full mt-2 w-72 bg-background border border-border p-3 text-xs text-muted-foreground z-50 shadow-lg rounded-md"
                    onMouseEnter={() => setHoveredTerm("entropy")}
                    onMouseLeave={() => setHoveredTerm(null)}
                  >
                    {glossary.entropy}
                  </div>
                )}
              </div>
            </div>
            <p className="text-lg font-semibold">{dataset?.metrics.rankEntropy.toFixed(2) || "0.00"}</p>
            <p className="text-xs text-muted-foreground mt-1">Low diversity</p>
          </div>
          <div className="bg-muted/10 border border-border p-2">
            <p className="text-xs text-muted-foreground font-mono mb-1">Top-3 Concentration</p>
            <p className="text-lg font-semibold">{topThreeConcentration.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground mt-1">Of all visibility</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-muted/20 border border-border p-1">
            <button
              onClick={() => setScale("linear")}
              className={`px-2 py-1 text-xs font-mono ${scale === "linear" ? "bg-signal-blue text-white" : ""}`}
            >
              Linear
            </button>
            <button
              onClick={() => setScale("log")}
              className={`px-2 py-1 text-xs font-mono ${scale === "log" ? "bg-signal-blue text-white" : ""}`}
            >
              Log Scale
            </button>
          </div>
          <div className="flex items-center gap-2">
            <TrendingDown className="h-3 w-3 text-muted-foreground" />
            <select
              value={removedOutlet || ""}
              onChange={(e) => setRemovedOutlet(e.target.value || null)}
              className="text-xs font-mono bg-background border border-border px-2 py-1"
            >
              <option value="">Counterfactual: Remove outlet</option>
              {outlets.slice(0, 10).map((outlet) => (
                <option key={outlet.name} value={outlet.name}>
                  Remove {outlet.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search outlets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-7 pr-8 py-1.5 text-xs font-mono bg-background border border-border focus:outline-none focus:ring-1 focus:ring-ring"
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
            options={uniqueCategories}
            value={selectedCategories}
            onChange={setSelectedCategories}
            placeholder="Select Categories"
            className="min-w-[200px]"
          />
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-mono">Appearances:</span>
            <input
              type="number"
              placeholder="Min"
              value={minAppearances}
              onChange={(e) => setMinAppearances(e.target.value === "" ? "" : Number(e.target.value))}
              min="0"
              className="w-20 px-2 py-1.5 text-xs font-mono bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-signal-blue"
            />
            <span className="text-xs text-muted-foreground">-</span>
            <input
              type="number"
              placeholder="Max"
              value={maxAppearances}
              onChange={(e) => setMaxAppearances(e.target.value === "" ? "" : Number(e.target.value))}
              min="0"
              className="w-20 px-2 py-1.5 text-xs font-mono bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-signal-blue"
            />
          </div>
          {(selectedCategories.length > 0 || minAppearances !== "" || maxAppearances !== "") && (
            <button
              onClick={() => {
                setSelectedCategories([])
                setMinAppearances("")
                setMaxAppearances("")
              }}
              className="px-2 py-1.5 text-xs font-mono text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {removedOutlet && (
          <div className="mt-3 p-2 bg-signal-amber/10 border border-signal-amber/20 text-xs">
            <p className="font-mono text-signal-amber mb-1">Counterfactual Simulation Active</p>
            <p className="text-muted-foreground">
              Simulating visibility distribution with {removedOutlet} removed. Remaining outlets would redistribute
              attention, but power-law structure persists.
            </p>
          </div>
        )}
      </div>
      <div className="p-6 overflow-auto flex-1 min-h-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground font-mono">
            Loading data...
          </div>
        ) : displayOutlets.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground font-mono">
            {outlets.length === 0 ? "No data available" : "No results match your filters"}
          </div>
        ) : (
          <div className="space-y-3">
            {displayOutlets.map((outlet, i) => {
            const width =
              scale === "linear"
                ? (outlet.appearances / maxDisplayAppearances) * 100
                : (Math.log10(outlet.appearances + 1) / Math.log10(maxDisplayAppearances + 1)) * 100
            const color =
              outlet.category === "mainstream"
                ? "bg-signal-red"
                : outlet.category === "foreign"
                  ? "bg-signal-amber"
                  : outlet.category === "independent"
                    ? "bg-signal-blue"
                    : "bg-muted"

            const isHighlighted = shouldHighlight(outlet.category)

            return (
              <div key={i} className="group">
                <div className="flex items-center justify-between text-xs mb-1">
                  <button
                    onClick={() => onOutletClick(outlet.name)}
                    className="font-mono hover:text-signal-blue transition-colors underline decoration-dotted"
                  >
                    {outlet.name}
                  </button>
                  <span className="text-muted-foreground font-mono">
                    {outlet.appearances} appearances · avg rank {outlet.avgRank}
                    {activeTheories.size > 0 && (
                      <span className="ml-2 text-signal-amber italic">
                        {outlet.category === "mainstream" && "(structural advantage)"}
                      </span>
                    )}
                  </span>
                </div>
                <div
                  className={`h-8 bg-muted/20 relative ${isHighlighted && showTrace ? "ring-2 ring-signal-amber" : ""}`}
                >
                  <div
                    className={`h-full ${color} transition-all group-hover:opacity-80 ${isHighlighted && showTrace ? "opacity-100 shadow-lg shadow-signal-amber/50" : ""}`}
                    style={{ width: `${width}%` }}
                  />
                  {isHighlighted && showTrace && (
                    <div className="absolute -top-6 right-0 px-2 py-0.5 bg-signal-amber/90 text-white text-[10px] font-mono">
                      Theory Active
                    </div>
                  )}
                </div>
              </div>
            )
          })}
          </div>
        )}

        <div className="flex items-center gap-6 mt-6 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-signal-red" />
            <span className="text-xs text-muted-foreground font-mono">Mainstream/Legacy</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-signal-amber" />
            <span className="text-xs text-muted-foreground font-mono">Foreign</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-signal-blue" />
            <span className="text-xs text-muted-foreground font-mono">Independent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-muted" />
            <span className="text-xs text-muted-foreground font-mono">Local</span>
          </div>
        </div>

        {activeTheories.has("manufacturing-consent") && (
          <div className="mt-4 p-3 bg-signal-red/5 border border-signal-red/20 text-xs text-muted-foreground">
            <p className="font-mono text-signal-red mb-1">Theory Annotation: Ownership Filter</p>
            <p className="italic">
              Power-law concentration indicates structural advantage, not editorial merit. Large media conglomerates
              dominate visibility due to capital-intensive SEO operations and algorithmic trust accumulation.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

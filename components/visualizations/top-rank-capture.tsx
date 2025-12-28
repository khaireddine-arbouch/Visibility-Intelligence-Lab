"use client"

import { HelpCircle, Search, X } from "lucide-react"
import { useState, useMemo } from "react"
import { useSupabaseData } from "@/lib/data/supabase-data-context"
import { MultiSelect } from "@/components/ui/multi-select"

type TheoryToggle = "manufacturing-consent" | "platform-capitalism" | "digital-colonialism"

interface TopRankCaptureProps {
  theoryMode: boolean
  fullscreen?: boolean
  activeTheories: Set<TheoryToggle>
  onOutletClick: (outletName: string) => void
  showTrace?: boolean
}

export function TopRankCapture({
  theoryMode,
  fullscreen,
  activeTheories,
  onOutletClick,
  showTrace,
}: TopRankCaptureProps) {
  const { dataset, isLoading } = useSupabaseData()
  const [hoveredTerm, setHoveredTerm] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string[]>([])

  const categories = useMemo(() => {
    if (!dataset) return []
    
    const categoryMap = new Map<string, { top3: number; top5: number; top10: number }>()
    
    // Process all SERP entries to calculate capture rates by category
    dataset.queries.forEach((query) => {
      query.serpEntries?.forEach((entry) => {
        const cat = entry.category || 'independent'
        if (!categoryMap.has(cat)) {
          categoryMap.set(cat, { top3: 0, top5: 0, top10: 0 })
        }
        const stats = categoryMap.get(cat)!
        if (entry.rank <= 3) stats.top3++
        if (entry.rank <= 5) stats.top5++
        if (entry.rank <= 10) stats.top10++
      })
    })
    
    // Calculate percentages
    const totalEntries = dataset.entries
    const result = []
    
    const categoryNames: Record<string, { name: string; color: string }> = {
      mainstream: { name: "Mainstream/Legacy", color: "bg-signal-red" },
      foreign: { name: "Foreign Mainstream", color: "bg-signal-amber" },
      independent: { name: "Independent", color: "bg-signal-blue" },
      local: { name: "Local", color: "bg-muted" },
    }
    
    for (const [cat, stats] of categoryMap.entries()) {
      const info = categoryNames[cat] || { name: cat, color: "bg-muted" }
      result.push({
        name: info.name,
        top3: totalEntries > 0 ? Math.round((stats.top3 / totalEntries) * 100) : 0,
        top5: totalEntries > 0 ? Math.round((stats.top5 / totalEntries) * 100) : 0,
        top10: totalEntries > 0 ? Math.round((stats.top10 / totalEntries) * 100) : 0,
        color: info.color,
      })
    }
    
    // Ensure all categories are present
    const existingCats = new Set(result.map(r => r.name))
    for (const [cat, info] of Object.entries(categoryNames)) {
      if (!existingCats.has(info.name)) {
        result.push({ name: info.name, top3: 0, top5: 0, top10: 0, color: info.color })
      }
    }
    
    return result.sort((a, b) => b.top3 - a.top3)
  }, [dataset])

  const filteredCategories = useMemo(() => {
    return categories.filter((cat) => {
      // Search by category name
      if (searchQuery && !cat.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      // Filter by selected categories (multi-select)
      if (selectedCategory.length > 0 && !selectedCategory.includes(cat.name)) {
        return false
      }
      return true
    })
  }, [categories, searchQuery, selectedCategory])

  const glossary: Record<string, string> = {
    capture: "Percentage of premium ranking positions (1-3, 1-5, 1-10) held by each outlet category over time.",
    persistence:
      "Rank persistence measures temporal lock-in at top positions. Dominance metrics quantify structural, not editorial, advantages.",
  }

  return (
    <div className={`border border-border bg-card ${fullscreen ? "h-[600px]" : "h-96"}`}>
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">Outlet Power</h3>
              <div className="relative">
                <HelpCircle
                  className="h-3 w-3 text-muted-foreground cursor-help"
                  onMouseEnter={() => setHoveredTerm("capture")}
                  onMouseLeave={() => setHoveredTerm(null)}
                />
                {hoveredTerm === "capture" && (
                  <div
                    className="absolute left-0 top-full mt-2 w-72 bg-background border border-border p-3 text-xs text-muted-foreground z-50 shadow-lg rounded-md"
                    onMouseEnter={() => setHoveredTerm("capture")}
                    onMouseLeave={() => setHoveredTerm(null)}
                  >
                    {glossary.capture}
                  </div>
                )}
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-1 font-mono">
              This section answers the question: Which institutions structurally capture top-rank positions?
            </p>
          </div>
          {theoryMode && activeTheories.has("platform-capitalism") && (
            <div className="px-2 py-1 bg-signal-amber/10 border border-signal-amber/20 text-signal-amber text-xs font-mono">
              Attention Brokerage
            </div>
          )}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-7 pr-8 py-1.5 text-xs font-mono bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-signal-blue"
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
            options={categories.map(cat => cat.name)}
            value={selectedCategory}
            onChange={setSelectedCategory}
            placeholder="Select Categories"
            className="min-w-[200px]"
          />
        </div>
      </div>
      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground font-mono">
            Loading data...
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground font-mono">
            {categories.length === 0 ? "No data available" : "No results match your filters"}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-6">
          {["Top 3", "Top 5", "Top 10"].map((rank, rankIdx) => (
            <div key={rank}>
              <p className="text-xs text-muted-foreground font-mono mb-4 text-center">{rank}</p>
              <div className="space-y-4">
                {filteredCategories.map((cat, catIdx) => {
                  const value = rankIdx === 0 ? cat.top3 : rankIdx === 1 ? cat.top5 : cat.top10
                  const isHighlighted =
                    showTrace &&
                    activeTheories.has("platform-capitalism") &&
                    cat.name === "Mainstream/Legacy" &&
                    rankIdx === 0
                  return (
                    <div key={catIdx}>
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="font-mono truncate">{cat.name}</span>
                        <span className="font-mono font-semibold">
                          {value}%
                          {isHighlighted && <span className="ml-2 text-signal-blue italic">(algorithmic lock-in)</span>}
                        </span>
                      </div>
                      <div className={`h-2 bg-muted/20 ${isHighlighted ? "ring-2 ring-signal-blue" : ""}`}>
                        <div className={`h-full ${cat.color}`} style={{ width: `${value}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
          </div>
        )}

        {activeTheories.has("platform-capitalism") && (
          <div className="mt-6 p-3 bg-signal-blue/5 border border-signal-blue/20 text-xs text-muted-foreground">
            <p className="font-mono text-signal-blue mb-1">Theory Annotation: Platform Capitalism</p>
            <p className="italic">
              Top-rank positions function as attention commodities. Legacy outlets accumulate algorithmic advantages
              through network effects and capital investment, creating winner-take-all dynamics.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

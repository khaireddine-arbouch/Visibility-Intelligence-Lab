"use client"

import { useState } from "react"
import {
  Archive,
  Grid3X3,
  List,
  AlertCircle,
  ExternalLink,
  Layers,
  GitCompare,
  TrendingUp,
  Link2,
  Download,
  Calendar,
  ArrowUp,
  ArrowDown,
  Minus,
} from "lucide-react"
import { Button } from "@/components/ui/button"

type ViewMode = "grid" | "serp" | "diff" | "trajectory"
type EvidenceLayer = "rank" | "category" | "ownership" | "persistence" | "theory"

export function EvidenceVault() {
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [activeLayers, setActiveLayers] = useState<Set<EvidenceLayer>>(new Set(["rank"]))
  const [selectedQuery, setSelectedQuery] = useState("Benin Coup")
  const [diffMode, setDiffMode] = useState(false)
  const [dateT1, setDateT1] = useState("Dec 6, 2025")
  const [dateT2, setDateT2] = useState("Dec 10, 2025")
  const [evidenceChain, setEvidenceChain] = useState<string[]>([])

  const toggleLayer = (layer: EvidenceLayer) => {
    setActiveLayers((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(layer)) {
        newSet.delete(layer)
      } else {
        newSet.add(layer)
      }
      return newSet
    })
  }

  const toggleChainItem = (query: string) => {
    setEvidenceChain((prev) => (prev.includes(query) ? prev.filter((q) => q !== query) : [...prev, query]))
  }

  const queries = [
    { query: "Benin Coup", date: "Dec 6, 2025", results: 20 },
    { query: "Thailand Cambodia War", date: "Dec 7, 2025", results: 20 },
    { query: "Nvidia CEO", date: "Dec 8, 2025", results: 20 },
    { query: "US Sanctions Iran", date: "Dec 9, 2025", results: 20 },
    { query: "European Energy Crisis", date: "Dec 10, 2025", results: 20 },
    { query: "Climate Summit Results", date: "Dec 11, 2025", results: 20 },
    { query: "China Trade Policy", date: "Dec 12, 2025", results: 20 },
    { query: "Tech Regulation EU", date: "Dec 13, 2025", results: 20 },
    { query: "Middle East Diplomacy", date: "Dec 13, 2025", results: 20 },
  ]

  const serpResults = [
    { rank: 1, outlet: "CNN", category: "mainstream", title: "Military tensions rise in Benin", ownership: "WBD" },
    {
      rank: 2,
      outlet: "BBC News",
      category: "mainstream",
      title: "Benin coup attempt: What we know",
      ownership: "BBC",
    },
    {
      rank: 3,
      outlet: "Reuters",
      category: "mainstream",
      title: "Benin president addresses nation",
      ownership: "Thomson",
    },
    { rank: 4, outlet: "The Guardian", category: "mainstream", title: "West Africa on edge", ownership: "GMG" },
    {
      rank: 5,
      outlet: "Al Jazeera",
      category: "foreign",
      title: "Benin military denies coup allegations",
      ownership: "Qatar",
    },
    {
      rank: 6,
      outlet: "France 24",
      category: "foreign",
      title: "Former French colony sees tensions",
      ownership: "France Media",
    },
    {
      rank: 7,
      outlet: "WION",
      category: "foreign",
      title: "African Union monitoring situation",
      ownership: "Zee Media",
    },
  ]

  const serpDiffResults = serpResults.map((r, i) => ({
    ...r,
    prevRank: i === 0 ? 2 : i === 1 ? 1 : i === 2 ? 3 : i === 3 ? 5 : i === 4 ? 4 : r.rank,
    movement: i === 0 ? "up" : i === 1 ? "down" : i === 3 ? "up" : i === 4 ? "down" : "same",
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Evidence Vault</h2>
          <p className="text-sm text-muted-foreground mt-1 font-mono">
            Forensic-grade investigative archive with stacked evidence layers
          </p>
        </div>
        <div className="flex items-center gap-2 bg-muted/20 border border-border p-1 rounded">
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className="gap-2"
          >
            <Grid3X3 className="h-4 w-4" />
            Grid
          </Button>
          <Button
            variant={viewMode === "serp" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("serp")}
            className="gap-2"
          >
            <List className="h-4 w-4" />
            SERP
          </Button>
          <Button
            variant={viewMode === "diff" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("diff")}
            className="gap-2"
          >
            <GitCompare className="h-4 w-4" />
            Diff
          </Button>
          <Button
            variant={viewMode === "trajectory" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("trajectory")}
            className="gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            Trajectory
          </Button>
        </div>
      </div>

      {viewMode === "grid" && (
        <>
          {evidenceChain.length > 0 && (
            <div className="border border-signal-blue bg-signal-blue/5 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-signal-blue" />
                  <p className="text-sm font-semibold text-signal-blue">Evidence Thread ({evidenceChain.length})</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="gap-2 text-xs bg-transparent">
                    <Download className="h-3 w-3" />
                    Export PDF
                  </Button>
                  <Button size="sm" variant="outline" className="gap-2 text-xs bg-transparent">
                    <Download className="h-3 w-3" />
                    Export CSV
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEvidenceChain([])}>
                    Clear
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {evidenceChain.map((q) => (
                  <span key={q} className="px-2 py-1 bg-signal-blue/20 border border-signal-blue/30 text-xs font-mono">
                    {q}
                  </span>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3 italic">
                Auto-generated claim: Cross-temporal analysis shows consistent Anglo-American dominance across{" "}
                {evidenceChain.length} distinct queries.
              </p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            {queries.map((item, i) => (
              <div
                key={i}
                className={`border bg-card hover:border-signal-amber transition-colors cursor-pointer group ${
                  evidenceChain.includes(item.query) ? "border-signal-blue ring-2 ring-signal-blue/30" : "border-border"
                }`}
                onClick={() => toggleChainItem(item.query)}
              >
                <div className="aspect-video bg-muted/20 flex items-center justify-center relative">
                  <Archive className="h-8 w-8 text-muted-foreground group-hover:text-signal-amber transition-colors" />
                  {evidenceChain.includes(item.query) && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-signal-blue flex items-center justify-center">
                      <span className="text-xs text-white">{evidenceChain.indexOf(item.query) + 1}</span>
                    </div>
                  )}
                </div>
                <div className="p-3 space-y-1">
                  <p className="text-sm font-mono">{`Query: ${item.query}`}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {item.date} • Rank 1-{item.results}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {viewMode === "serp" && (
        <div className="space-y-4">
          <div className="bg-signal-amber/10 border border-signal-amber/30 p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-signal-amber shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-signal-amber">
                Reconstructed SERP for methodological transparency
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Visual reconstruction based on archived ranking data. Evidence layers annotate reality; they never
                obscure it.
              </p>
            </div>
          </div>

          <div className="border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Layers className="h-4 w-4 text-signal-blue" />
              <p className="text-sm font-semibold">Evidence Layers (Stacked, Toggleable)</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { id: "rank" as EvidenceLayer, label: "Rank Positions" },
                { id: "category" as EvidenceLayer, label: "Outlet Category" },
                { id: "ownership" as EvidenceLayer, label: "Ownership Cluster" },
                { id: "persistence" as EvidenceLayer, label: "Persistence" },
                { id: "theory" as EvidenceLayer, label: "Theory Annotations" },
              ].map((layer) => (
                <button
                  key={layer.id}
                  onClick={() => toggleLayer(layer.id)}
                  className={`px-3 py-1.5 border text-xs font-mono transition-all ${
                    activeLayers.has(layer.id)
                      ? "bg-signal-blue/20 border-signal-blue text-signal-blue"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  {layer.label}
                </button>
              ))}
            </div>
          </div>

          <div className="border border-border bg-card">
            <div className="p-4 border-b border-border bg-muted/10">
              <p className="text-xs text-muted-foreground font-mono mb-2">Reconstructing Query:</p>
              <p className="text-lg font-semibold">{selectedQuery}</p>
              <p className="text-xs text-muted-foreground font-mono mt-1">Dec 6, 2025 • 14:32 UTC</p>
            </div>

            <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto bg-muted/5 border-t border-border">
              {serpResults.map((result) => {
                const categoryColor =
                  result.category === "mainstream"
                    ? "border-red-500 bg-red-50"
                    : result.category === "foreign"
                      ? "border-amber-500 bg-amber-50"
                      : "border-blue-500 bg-blue-50"

                return (
                  <div key={result.rank} className={`p-3 border-l-4 ${categoryColor} relative bg-card`}>
                    {activeLayers.has("rank") && (
                      <div className="absolute -left-8 top-3 w-6 h-6 bg-muted text-xs flex items-center justify-center font-mono text-foreground rounded">
                        {result.rank}
                      </div>
                    )}

                    {activeLayers.has("ownership") && (
                      <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-signal-amber/80 text-white text-xs font-mono rounded">
                        {result.ownership}
                      </div>
                    )}

                    {activeLayers.has("persistence") && result.rank <= 3 && (
                      <div
                        className="absolute top-3 right-3 w-2 h-2 rounded-full bg-green-500"
                        title="Recurring result"
                      />
                    )}

                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg text-signal-blue font-normal mb-1">{result.title}</h3>
                        <p className="text-sm text-muted-foreground">{result.outlet} - Breaking news coverage...</p>

                        {activeLayers.has("category") && (
                          <span className="inline-block mt-2 px-2 py-0.5 bg-muted text-foreground text-xs font-mono rounded">
                            {result.category}
                          </span>
                        )}

                        {activeLayers.has("theory") && result.rank <= 3 && result.category === "mainstream" && (
                          <p className="text-xs text-signal-amber mt-2 italic">
                            Theory: Ownership filter (Manufacturing Consent)
                          </p>
                        )}
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground ml-3 shrink-0" />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {viewMode === "diff" && (
        <div className="space-y-4">
          <div className="border border-border bg-card p-4">
            <p className="text-sm font-semibold mb-3">Temporal Comparison</p>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="text-xs text-muted-foreground font-mono block mb-1">T₁ (Earlier)</label>
                <select
                  className="w-full px-3 py-2 border border-border bg-background text-sm font-mono"
                  value={dateT1}
                  onChange={(e) => setDateT1(e.target.value)}
                >
                  <option>Dec 6, 2025</option>
                  <option>Dec 7, 2025</option>
                  <option>Dec 8, 2025</option>
                </select>
              </div>
              <Calendar className="h-4 w-4 text-muted-foreground mt-5" />
              <div className="flex-1">
                <label className="text-xs text-muted-foreground font-mono block mb-1">T₂ (Later)</label>
                <select
                  className="w-full px-3 py-2 border border-border bg-background text-sm font-mono"
                  value={dateT2}
                  onChange={(e) => setDateT2(e.target.value)}
                >
                  <option>Dec 10, 2025</option>
                  <option>Dec 11, 2025</option>
                  <option>Dec 12, 2025</option>
                </select>
              </div>
            </div>
          </div>

          <div className="border border-border bg-card p-6 space-y-3">
            <p className="text-sm font-semibold mb-4">
              Query: {selectedQuery} • Movement Analysis ({dateT1} → {dateT2})
            </p>
            {serpDiffResults.map((result) => {
              const movement = result.movement
              const MovementIcon = movement === "up" ? ArrowUp : movement === "down" ? ArrowDown : Minus
              const movementColor =
                movement === "up" ? "text-green-500" : movement === "down" ? "text-red-500" : "text-gray-500"

              return (
                <div key={result.rank} className="flex items-center gap-4 p-3 border border-border bg-muted/10">
                  <div className="flex items-center gap-2 w-20">
                    <span className="text-sm font-mono text-muted-foreground">{result.prevRank}</span>
                    <MovementIcon className={`h-4 w-4 ${movementColor}`} />
                    <span className="text-sm font-mono font-semibold">{result.rank}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{result.outlet}</p>
                    <p className="text-xs text-muted-foreground">{result.title}</p>
                  </div>
                  {movement !== "same" && (
                    <p className="text-xs text-muted-foreground italic w-64">
                      Rank movement reflects algorithmic reallocation of attention, not editorial change.
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {viewMode === "trajectory" && (
        <div className="space-y-4">
          <div className="border border-border bg-card p-6">
            <h3 className="text-sm font-semibold mb-4">Query Trajectory: {selectedQuery}</h3>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-muted/10 border border-border p-4">
                <p className="text-xs text-muted-foreground font-mono mb-1">Outlet Churn Rate</p>
                <p className="text-2xl font-semibold">23%</p>
                <p className="text-xs text-muted-foreground mt-1">New outlets in Top-5 over 7 days</p>
              </div>
              <div className="bg-muted/10 border border-border p-4">
                <p className="text-xs text-muted-foreground font-mono mb-1">New Entrant Suppression</p>
                <p className="text-2xl font-semibold">87%</p>
                <p className="text-xs text-muted-foreground mt-1">New outlets ranked below position 5</p>
              </div>
              <div className="bg-muted/10 border border-border p-4">
                <p className="text-xs text-muted-foreground font-mono mb-1">Query Capture Half-Life</p>
                <p className="text-2xl font-semibold">2.3d</p>
                <p className="text-xs text-muted-foreground mt-1">Time until Top-5 stabilizes</p>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <p className="text-sm font-semibold mb-3">Rank Lock-In Duration (Days in Top-5)</p>
              <div className="space-y-2">
                {[
                  { outlet: "CNN", days: 7, persistent: true },
                  { outlet: "BBC News", days: 7, persistent: true },
                  { outlet: "Reuters", days: 6, persistent: true },
                  { outlet: "The Guardian", days: 4, persistent: false },
                  { outlet: "Al Jazeera", days: 3, persistent: false },
                ].map((item) => (
                  <div key={item.outlet} className="flex items-center gap-3">
                    <span className="text-xs font-mono w-32">{item.outlet}</span>
                    <div className="flex-1 h-6 bg-muted/20 relative">
                      <div
                        className={`h-full ${item.persistent ? "bg-signal-red" : "bg-signal-amber"}`}
                        style={{ width: `${(item.days / 7) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground font-mono w-12">{item.days}/7d</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-4 italic">
                This exposes when a narrative freezes into a fixed set of institutional actors.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

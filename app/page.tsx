"use client"

import { useState, useMemo } from "react"
import { useSupabaseData } from "@/lib/data/supabase-data-context"
import { Database, Filter, BookOpen, Command, Bookmark } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Sidebar } from "@/components/sidebar"
import { VisibilityConcentrationMap } from "@/components/visualizations/visibility-concentration-map"
import { TopRankCapture } from "@/components/visualizations/top-rank-capture"
import { GeoMediaMatrix } from "@/components/visualizations/geo-media-matrix"
import { TemporalDrift } from "@/components/visualizations/temporal-drift"
import { AdvertisingLayer } from "@/components/visualizations/advertising-layer"
import { MetricCard } from "@/components/metric-card"
import { TheoryOverlay } from "@/components/theory-overlay"
import { EvidenceVault } from "@/components/evidence-vault"
import { OutletDrillPanel } from "@/components/outlet-drill-panel"
import { UploadAnalyze } from "@/components/upload-analyze"
import { MethodsPanel } from "@/components/methods-panel"
import { InvestigationPanel } from "@/components/investigation-panel"
import { OwnershipUnified } from "@/components/ownership-unified"
import { MultiSelect } from "@/components/ui/multi-select"
import { formatQuery } from "@/lib/utils/format-query"

type ViewType =
  | "overview"
  | "concentration"
  | "outlet-power"
  | "geopolitical"
  | "advertising"
  | "temporal"
  | "theory"
  | "evidence"
  | "upload"
  | "methods"
  | "ownership"

type TheoryToggle = "manufacturing-consent" | "platform-capitalism" | "digital-colonialism"

export default function VisibilityIntelligenceLab() {
  const { dataset, isLoading } = useSupabaseData()
  const [activeView, setActiveView] = useState<ViewType>("overview")
  const [searchQuery, setSearchQuery] = useState("")
  const [theoryMode, setTheoryMode] = useState(false)
  const [selectedOutlet, setSelectedOutlet] = useState<string | null>(null)
  const [activeTheories, setActiveTheories] = useState<Set<TheoryToggle>>(new Set())
  const [investigationMode, setInvestigationMode] = useState(false)
  const [showTheoryTrace, setShowTheoryTrace] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [geoSelectedCountries, setGeoSelectedCountries] = useState<string[]>([])
  const [geoSelectedTopics, setGeoSelectedTopics] = useState<string[]>([])

  // Extract available countries and topics for GeoMediaMatrix filters
  const { geoCountries, geoTopics } = useMemo(() => {
    if (!dataset) {
      return { geoCountries: [], geoTopics: [] }
    }

    const uniqueQueries = Array.from(new Set(dataset.queries.map(q => q.query)))
    const uniqueCountries = Array.from(
      new Set(dataset.outlets.map(o => o.country).filter(Boolean))
    )
    
    const countryList = uniqueCountries.length > 0 
      ? [...uniqueCountries, "Other"]
      : ["USA", "UK", "India", "Turkey", "Other"]

    return {
      geoCountries: countryList,
      geoTopics: uniqueQueries.map(t => formatQuery(t)),
    }
  }, [dataset])

  const handleOutletClick = (outletName: string) => {
    setSelectedOutlet(outletName)
  }

  const toggleTheory = (theory: TheoryToggle) => {
    setActiveTheories((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(theory)) {
        newSet.delete(theory)
      } else {
        newSet.add(theory)
      }
      return newSet
    })
  }

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <Sidebar 
        activeView={activeView} 
        onViewChange={setActiveView}
        collapsed={sidebarCollapsed}
        onCollapseChange={setSidebarCollapsed}
      />

      <div className="flex-1 flex flex-col">
        {/* Global Control Bar */}
        <header className="border-b border-border bg-card">
          <div className="px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <Database className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-mono">
                  Dataset: {dataset?.name || "Loading..."}
                </span>
              </div>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-mono">
                  {dataset ? `${dataset.entries} entries` : "Loading..."}
                </span>
                {dataset?.dateRange && (
                  <>
                    <span>·</span>
                    <span className="font-mono">
                      {new Date(dataset.dateRange.start).toLocaleDateString()} - {new Date(dataset.dateRange.end).toLocaleDateString()}
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Command className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="w-96 pl-10 bg-background border-border font-mono text-sm"
                  placeholder="topic:us sanctions / outlet:Reuters / rank<5"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="ghost" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                Filters
              </Button>
              <Button
                variant={theoryMode ? "default" : "ghost"}
                size="sm"
                className="gap-2"
                onClick={() => setTheoryMode(!theoryMode)}
              >
                <BookOpen className="h-4 w-4" />
                Theory
              </Button>
              {theoryMode && (
                <Button
                  variant={showTheoryTrace ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setShowTheoryTrace(!showTheoryTrace)}
                  className="text-xs"
                >
                  Trace Mode
                </Button>
              )}
              <Button
                variant={investigationMode ? "default" : "ghost"}
                size="sm"
                className="gap-2"
                onClick={() => setInvestigationMode(!investigationMode)}
              >
                <Bookmark className="h-4 w-4" />
                Investigation
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          {activeView === "overview" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-semibold text-foreground tracking-tight">Visibility Intelligence Lab</h1>
                  <p className="text-sm text-muted-foreground mt-1 font-mono">
                    Structural asymmetries in Google Search results
                  </p>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-4 gap-4">
                <MetricCard
                  label="Anglo-American Dominance"
                  value={dataset ? `${dataset.metrics.angloAmericanDominance.toFixed(0)}%` : "0%"}
                  trend=""
                  description="US/UK outlets in top-20"
                  critical
                  tooltip="Percentage of top-20 positions held by US/UK outlets across all queries"
                  theoryActive={activeTheories.has("manufacturing-consent")}
                  theoryLabel="Ownership Filter"
                  showTrace={showTheoryTrace}
                />
                <MetricCard
                  label="Local Visibility"
                  value={dataset ? `${dataset.metrics.localVisibility.toFixed(1)}%` : "0%"}
                  trend=""
                  description="Local sources detected"
                  critical
                  tooltip="Proportion of local media outlets appearing in search results despite geographic context"
                  theoryActive={activeTheories.has("digital-colonialism")}
                  theoryLabel="Informational Displacement"
                  showTrace={showTheoryTrace}
                />
                <MetricCard
                  label="Independent Outlets"
                  value={dataset ? `${((dataset.metrics.independentOutlets / (dataset.outlets.length || 1)) * 100).toFixed(1)}%` : "0%"}
                  trend=""
                  description="Non-legacy media share"
                  critical
                  tooltip="Visibility share of independent, non-corporate media outlets"
                  theoryActive={activeTheories.has("platform-capitalism")}
                  theoryLabel="Network Effects"
                  showTrace={showTheoryTrace}
                />
                <MetricCard
                  label="Avg. Independent Rank"
                  value={dataset ? dataset.metrics.avgIndependentRank.toFixed(1) : "0.0"}
                  trend=""
                  description="Systematically pushed down"
                  critical
                  tooltip="Mean ranking position for independent outlets (higher = less visible)"
                  theoryActive={activeTheories.has("manufacturing-consent")}
                  theoryLabel="Sourcing Filter"
                  showTrace={showTheoryTrace}
                />
              </div>

              {/* Main Visualizations */}
              <div className="grid grid-cols-2 gap-6">
                <VisibilityConcentrationMap
                  theoryMode={theoryMode}
                  activeTheories={activeTheories}
                  onOutletClick={handleOutletClick}
                  showTrace={showTheoryTrace}
                />
                <TopRankCapture
                  theoryMode={theoryMode}
                  activeTheories={activeTheories}
                  onOutletClick={handleOutletClick}
                  showTrace={showTheoryTrace}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <GeoMediaMatrix
                  theoryMode={theoryMode}
                  activeTheories={activeTheories}
                  onOutletClick={handleOutletClick}
                  showTrace={showTheoryTrace}
                />
                <AdvertisingLayer
                  theoryMode={theoryMode}
                  activeTheories={activeTheories}
                  onOutletClick={handleOutletClick}
                  showTrace={showTheoryTrace}
                />
              </div>
            </div>
          )}

          {activeView === "concentration" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">Visibility Concentration</h2>
                <p className="text-sm text-muted-foreground mt-1 font-mono">
                  Global inequality of algorithmic attention
                </p>
              </div>
              <VisibilityConcentrationMap
                theoryMode={theoryMode}
                activeTheories={activeTheories}
                onOutletClick={handleOutletClick}
                fullscreen
                showTrace={showTheoryTrace}
              />
            </div>
          )}

          {activeView === "outlet-power" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">Outlet Power Analysis</h2>
                <p className="text-sm text-muted-foreground mt-1 font-mono">
                  Institutional capture of top-rank positions
                </p>
              </div>
              <TopRankCapture
                theoryMode={theoryMode}
                activeTheories={activeTheories}
                onOutletClick={handleOutletClick}
                fullscreen
                showTrace={showTheoryTrace}
              />
            </div>
          )}

          {activeView === "geopolitical" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">Geo-Media Matrix</h2>
                <p className="text-sm text-muted-foreground mt-1 font-mono">
                  Whose media speaks about whom — and with what dominance?
                </p>
              </div>
              <div className="p-4 border-b border-border space-y-3 shrink-0 bg-card">
                <div className="flex items-center gap-2 flex-wrap">
                  <MultiSelect
                    options={geoCountries}
                    value={geoSelectedCountries}
                    onChange={setGeoSelectedCountries}
                    placeholder="Select Countries"
                    className="min-w-[200px]"
                  />
                  <MultiSelect
                    options={geoTopics}
                    value={geoSelectedTopics}
                    onChange={setGeoSelectedTopics}
                    placeholder="Select Topics"
                    className="min-w-[200px]"
                  />
                  {(geoSelectedCountries.length > 0 || geoSelectedTopics.length > 0) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setGeoSelectedCountries([])
                        setGeoSelectedTopics([])
                      }}
                      className="text-xs font-mono"
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              </div>
              <GeoMediaMatrix
                theoryMode={theoryMode}
                activeTheories={activeTheories}
                onOutletClick={handleOutletClick}
                fullscreen
                showTrace={showTheoryTrace}
                selectedCountries={geoSelectedCountries}
                selectedTopics={geoSelectedTopics}
              />
            </div>
          )}

          {activeView === "advertising" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">Advertising Influence</h2>
                <p className="text-sm text-muted-foreground mt-1 font-mono">
                  Commercial viability as prerequisite for visibility
                </p>
              </div>
              <AdvertisingLayer
                theoryMode={theoryMode}
                activeTheories={activeTheories}
                onOutletClick={handleOutletClick}
                fullscreen
                showTrace={showTheoryTrace}
              />
            </div>
          )}

          {activeView === "temporal" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">Temporal Drift</h2>
                <p className="text-sm text-muted-foreground mt-1 font-mono">
                  Ranking stability reveals structural power
                </p>
              </div>
              <TemporalDrift theoryMode={theoryMode} activeTheories={activeTheories} showTrace={showTheoryTrace} />
            </div>
          )}

          {activeView === "theory" && <TheoryOverlay activeTheories={activeTheories} onToggle={toggleTheory} />}

          {activeView === "evidence" && <EvidenceVault />}

          {activeView === "upload" && <UploadAnalyze />}

          {activeView === "methods" && <MethodsPanel />}

          {activeView === "ownership" && <OwnershipUnified />}
        </main>

        <footer className="border-t border-border bg-card px-6 py-3">
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-mono italic">
              Visibility Intelligence Lab is not a claim about truth. It is a measurement of power.
            </p>
            <p className="font-mono italic">Power leaves patterns. This system records them.</p>
          </div>
        </footer>
      </div>

      {selectedOutlet && <OutletDrillPanel outletName={selectedOutlet} onClose={() => setSelectedOutlet(null)} />}

      {investigationMode && <InvestigationPanel onClose={() => setInvestigationMode(false)} />}
    </div>
  )
}

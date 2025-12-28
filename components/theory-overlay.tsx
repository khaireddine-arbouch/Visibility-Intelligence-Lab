"use client"

import { Check, Info } from "lucide-react"
import { cn } from "@/lib/utils"

type TheoryToggle = "manufacturing-consent" | "platform-capitalism" | "digital-colonialism"

interface TheoryOverlayProps {
  activeTheories: Set<TheoryToggle>
  onToggle: (theory: TheoryToggle) => void
}

export function TheoryOverlay({ activeTheories, onToggle }: TheoryOverlayProps) {
  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Theoretical Framework</h2>
        <p className="text-sm text-muted-foreground mt-1 font-mono">Critical lenses for algorithmic power analysis</p>
      </div>

      <div className="border border-border bg-muted/10 p-4">
        <div className="flex items-start gap-3 mb-3">
          <Info className="h-4 w-4 text-signal-blue shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold mb-1">Theory as Analytical Lens (Not Decoration)</p>
            <p className="text-xs text-muted-foreground">
              When activated, theories do not overlay banners or shift layouts. Instead, they transform data into
              interpretive metadata: metrics gain theory tags, charts gain micro-annotations, tooltips reference theory
              language. This prevents theory from becoming ideology.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => onToggle("manufacturing-consent")}
            className={cn(
              "px-4 py-2 border rounded transition-all text-sm font-mono flex items-center gap-2",
              activeTheories.has("manufacturing-consent")
                ? "bg-signal-red/20 border-signal-red text-signal-red"
                : "border-border hover:bg-muted/50",
            )}
          >
            {activeTheories.has("manufacturing-consent") && <Check className="h-4 w-4" />}
            Manufacturing Consent
          </button>
          <button
            onClick={() => onToggle("platform-capitalism")}
            className={cn(
              "px-4 py-2 border rounded transition-all text-sm font-mono flex items-center gap-2",
              activeTheories.has("platform-capitalism")
                ? "bg-signal-blue/20 border-signal-blue text-signal-blue"
                : "border-border hover:bg-muted/50",
            )}
          >
            {activeTheories.has("platform-capitalism") && <Check className="h-4 w-4" />}
            Platform Capitalism
          </button>
          <button
            onClick={() => onToggle("digital-colonialism")}
            className={cn(
              "px-4 py-2 border rounded transition-all text-sm font-mono flex items-center gap-2",
              activeTheories.has("digital-colonialism")
                ? "bg-signal-amber/20 border-signal-amber text-signal-amber"
                : "border-border hover:bg-muted/50",
            )}
          >
            {activeTheories.has("digital-colonialism") && <Check className="h-4 w-4" />}
            Digital Colonialism
          </button>
        </div>
      </div>

      <div className="border border-border bg-card">
        <div className="p-4 border-b border-border bg-signal-red/5">
          <h3 className="font-semibold text-sm">Manufacturing Consent (Herman & Chomsky)</h3>
          <p className="text-xs text-muted-foreground font-mono mt-1">Five filters of news production</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded bg-signal-red/20 flex items-center justify-center text-xs font-mono shrink-0">
                1
              </div>
              <div>
                <p className="text-sm font-semibold">Ownership Filter</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Google privileges large, capital-intensive media conglomerates. Legacy outlets dominate because they
                  can afford massive SEO operations.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded bg-signal-red/20 flex items-center justify-center text-xs font-mono shrink-0">
                2
              </div>
              <div>
                <p className="text-sm font-semibold">Advertising Filter</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Though explicit ads are rare (1-3%), the 'organic' algorithm prioritizes brand-safe,
                  advertiser-friendly content. Commercial viability becomes prerequisite.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded bg-signal-red/20 flex items-center justify-center text-xs font-mono shrink-0">
                3
              </div>
              <div>
                <p className="text-sm font-semibold">Sourcing Filter</p>
                <p className="text-xs text-muted-foreground mt-1">
                  The algorithm grants 'authority' to outlets that cite each other, creating a self-referential feedback
                  loop that excludes alternative voices.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border border-border bg-card">
        <div className="p-4 border-b border-border bg-signal-blue/5">
          <h3 className="font-semibold text-sm">Platform Capitalism (Srnicek)</h3>
          <p className="text-xs text-muted-foreground font-mono mt-1">
            Infrastructures of data extraction and attention brokerage
          </p>
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-3">
            <div>
              <p className="text-sm font-semibold mb-2">Obligatory Passage Point</p>
              <p className="text-xs text-muted-foreground">
                Google positions itself as the mandatory intermediary between information and access. By extracting data
                from users (search queries) and content providers (indexed pages), it becomes an attention broker with
                monopolistic power.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold mb-2">Market Logic Over Democratic Need</p>
              <p className="text-xs text-muted-foreground">
                Visibility is distributed not according to civic importance, but according to engagement metrics and
                capital accumulation. The algorithm serves investors and consumers, not citizens.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold mb-2">Network Effects</p>
              <p className="text-xs text-muted-foreground">
                Dominant platforms become more valuable as they grow, creating winner-take-all dynamics. Early movers
                (CNN, BBC) accumulate algorithmic advantages that compound over time.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="border border-border bg-card">
        <div className="p-4 border-b border-border bg-signal-amber/5">
          <h3 className="font-semibold text-sm">Digital Colonialism</h3>
          <p className="text-xs text-muted-foreground font-mono mt-1">
            Informational imperialism and displacement of local narratives
          </p>
        </div>
        <div className="p-6">
          <p className="text-xs text-muted-foreground mb-4">
            For a researcher in Turkey (or any Global South location), Google Search results in informational
            displacement. Despite domestic location, the information landscape is colonized by Anglo-American
            perspectives. Turkish sources: 0.3% visibility. US/UK sources: 75%+.
          </p>
          <div className="p-3 bg-muted/20 border border-border">
            <p className="text-xs font-mono italic text-muted-foreground">
              "The 'organic' search result is a myth. What remains is a highly curated, capital-driven feed that
              reproduces the status quo, limiting the democratic potential of the open web."
            </p>
            <p className="text-xs font-mono text-muted-foreground mt-2">— Audit Report, December 2025</p>
          </div>
        </div>
      </div>
    </div>
  )
}

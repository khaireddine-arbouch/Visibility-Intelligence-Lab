"use client"

import { X, ExternalLink, Network, TrendingUp, MapPin, Building2, AlertCircle, Flag } from "lucide-react"
import { Button } from "@/components/ui/button"

interface OutletDrillPanelProps {
  outletName: string
  onClose: () => void
}

function getOutletData(name: string) {
  const outletDatabase: Record<string, any> = {
    CNN: {
      category: "Mainstream/Legacy",
      country: "United States",
      headquarters: "Atlanta, GA",
      parent: "Warner Bros. Discovery",
      ownership: "Publicly traded conglomerate",
      affiliations: "Corporate media",
      totalAppearances: 45,
      avgRank: 2.3,
      topThreeCaptureRate: 68,
      topFiveCaptureRate: 82,
      stabilityScore: 0.94,
      dominantTopics: ["US Politics", "International Conflict", "Business"],
      riskFlags: [
        {
          type: "High Persistence + Ownership Concentration",
          condition: "Stability Score > 0.9 & Conglomerate Ownership",
          note: "Indicates structural advantage in algorithmic ranking, not editorial quality.",
        },
        {
          type: "Cross-Topic Dominance",
          condition: "Appears in >80% of query categories",
          note: "Suggests platform-level preference independent of topic expertise.",
        },
      ],
      recentHeadlines: [
        "Biden administration announces new sanctions",
        "Tech layoffs continue across Silicon Valley",
        "NATO summit addresses Russia tensions",
        "Federal Reserve signals rate pause",
        "Climate summit reaches preliminary agreement",
      ],
    },
    "BBC News": {
      category: "Mainstream/Legacy",
      country: "United Kingdom",
      headquarters: "London, UK",
      parent: "BBC (Public Corporation)",
      ownership: "UK Government / Public License Fee",
      affiliations: "State-funded broadcaster",
      totalAppearances: 42,
      avgRank: 3.1,
      topThreeCaptureRate: 52,
      topFiveCaptureRate: 71,
      stabilityScore: 0.91,
      dominantTopics: ["UK Politics", "European Affairs", "Global News"],
      riskFlags: [
        {
          type: "Geo-Topic Mismatch",
          condition: "Foreign outlet with >50% visibility on domestic topics",
          note: "UK-based outlet dominating search results in Turkey for Turkish-relevant queries.",
        },
      ],
      recentHeadlines: [
        "UK inflation drops to lowest level in two years",
        "European leaders meet on defense cooperation",
        "Royal family announces upcoming tour",
        "Migration debate intensifies in Parliament",
        "Energy crisis: New offshore wind farms approved",
      ],
    },
    Reuters: {
      category: "Mainstream/Legacy",
      country: "United Kingdom",
      headquarters: "London, UK (Canary Wharf)",
      parent: "Thomson Reuters Corporation",
      ownership: "Thomson family + institutional shareholders",
      affiliations: "Financial data conglomerate",
      totalAppearances: 38,
      avgRank: 4.2,
      topThreeCaptureRate: 42,
      topFiveCaptureRate: 63,
      stabilityScore: 0.88,
      dominantTopics: ["Financial Markets", "Corporate News", "Trade Policy"],
      riskFlags: [
        {
          type: "High Persistence + Ownership Concentration",
          condition: "Stability Score > 0.85 & Corporate Parent",
          note: "Consistent top-rank positioning suggests structural algorithmic preference.",
        },
      ],
      recentHeadlines: [
        "Global markets react to Fed signals",
        "Trade negotiations resume between US and China",
        "Oil prices surge amid Middle East tensions",
        "Tech giant announces major restructuring",
        "Currency volatility hits emerging markets",
      ],
    },
  }

  return (
    outletDatabase[name] || {
      category: "Independent",
      country: "Various",
      headquarters: "Unknown",
      parent: "Independent",
      ownership: "Not disclosed",
      affiliations: "None identified",
      totalAppearances: 12,
      avgRank: 8.5,
      topThreeCaptureRate: 5,
      topFiveCaptureRate: 12,
      stabilityScore: 0.43,
      dominantTopics: ["Alternative perspectives", "Local issues"],
      riskFlags: [],
      recentHeadlines: ["Limited data available"],
    }
  )
}

export function OutletDrillPanel({ outletName, onClose }: OutletDrillPanelProps) {
  const data = getOutletData(outletName)

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

      <div className="fixed top-0 right-0 h-full w-[480px] bg-card border-l border-border z-50 flex flex-col animate-in slide-in-from-right duration-300">
        <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">{outletName}</h2>
            <p className="text-xs text-muted-foreground font-mono">Intelligence Dossier</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* A. Outlet Identity */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-signal-blue flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Outlet Identity
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Category</span>
                <span className="font-mono">{data.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Country</span>
                <span className="font-mono">{data.country}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-muted-foreground">Headquarters</span>
                <span className="font-mono text-right flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {data.headquarters}
                </span>
              </div>
            </div>
          </section>

          {/* B. Ownership & Power Context */}
          <section className="space-y-3 pt-4 border-t border-border">
            <h3 className="text-sm font-semibold text-signal-amber flex items-center gap-2">
              <Network className="h-4 w-4" />
              Ownership & Power Context
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground block mb-1">Parent Company</span>
                <span className="font-mono text-foreground">{data.parent}</span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-1">Ownership Structure</span>
                <span className="font-mono text-foreground text-xs">{data.ownership}</span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-1">Known Affiliations</span>
                <span className="font-mono text-foreground text-xs">{data.affiliations}</span>
              </div>
            </div>

            {/* Mini ownership network visualization */}
            <div className="bg-muted/10 border border-border p-4 mt-3">
              <p className="text-xs text-muted-foreground mb-2 font-mono">Ownership Network</p>
              <div className="flex items-center justify-center gap-3">
                <div className="w-16 h-16 rounded-full bg-signal-red/20 border border-signal-red flex items-center justify-center">
                  <span className="text-xs font-mono text-center">{outletName.slice(0, 3)}</span>
                </div>
                <div className="w-8 border-t border-muted-foreground" />
                <div className="w-16 h-16 rounded-full bg-signal-amber/20 border border-signal-amber flex items-center justify-center">
                  <span className="text-xs font-mono text-center">Parent</span>
                </div>
              </div>
            </div>
          </section>

          {/* C. Visibility Metrics */}
          <section className="space-y-3 pt-4 border-t border-border">
            <h3 className="text-sm font-semibold text-signal-red flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Visibility Metrics
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/10 border border-border p-3">
                <p className="text-xs text-muted-foreground font-mono">Total Appearances</p>
                <p className="text-2xl font-semibold mt-1">{data.totalAppearances}</p>
              </div>
              <div className="bg-muted/10 border border-border p-3">
                <p className="text-xs text-muted-foreground font-mono">Avg Rank</p>
                <p className="text-2xl font-semibold mt-1">{data.avgRank}</p>
              </div>
              <div className="bg-muted/10 border border-border p-3">
                <p className="text-xs text-muted-foreground font-mono">Top-3 Capture</p>
                <p className="text-2xl font-semibold mt-1">{data.topThreeCaptureRate}%</p>
              </div>
              <div className="bg-muted/10 border border-border p-3">
                <p className="text-xs text-muted-foreground font-mono">Top-5 Capture</p>
                <p className="text-2xl font-semibold mt-1">{data.topFiveCaptureRate}%</p>
              </div>
            </div>
            <div className="bg-muted/10 border border-border p-3 mt-2">
              <p className="text-xs text-muted-foreground font-mono mb-2">Rank Stability Score</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-signal-blue" style={{ width: `${data.stabilityScore * 100}%` }} />
                </div>
                <span className="text-sm font-mono">{data.stabilityScore.toFixed(2)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2 italic">
                Temporal persistence in ranking positions (1.0 = perfect stability)
              </p>
            </div>
          </section>

          {/* D. Structural Risk Flags */}
          {data.riskFlags && data.riskFlags.length > 0 && (
            <section className="space-y-3 pt-4 border-t border-border">
              <h3 className="text-sm font-semibold text-signal-amber flex items-center gap-2">
                <Flag className="h-4 w-4" />
                Structural Risk Flags
              </h3>
              <div className="space-y-3">
                {data.riskFlags.map((flag: any, i: number) => (
                  <div key={i} className="bg-signal-amber/5 border border-signal-amber/20 p-3">
                    <p className="text-sm font-semibold text-signal-amber mb-1">{flag.type}</p>
                    <p className="text-xs text-muted-foreground font-mono mb-2">Trigger: {flag.condition}</p>
                    <p className="text-xs text-muted-foreground italic">{flag.note}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* E. Contextual Feed */}
          <section className="space-y-3 pt-4 border-t border-border">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              Contextual Feed
            </h3>
            <div>
              <p className="text-xs text-muted-foreground font-mono mb-2">Topics where this outlet dominates</p>
              <div className="flex flex-wrap gap-2">
                {data.dominantTopics.map((topic: string, i: number) => (
                  <span key={i} className="px-2 py-1 bg-signal-blue/10 border border-signal-blue/20 text-xs font-mono">
                    {topic}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-mono mb-2">Recent headlines (last 7 days)</p>
              <div className="space-y-2">
                {data.recentHeadlines.map((headline: string, i: number) => (
                  <div
                    key={i}
                    className="text-xs border-l-2 border-muted pl-3 py-1 hover:border-signal-blue transition-colors"
                  >
                    {headline}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Methodological note */}
          <div className="bg-signal-amber/5 border border-signal-amber/20 p-3 flex gap-2">
            <AlertCircle className="h-4 w-4 text-signal-amber shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              This dossier aggregates data from the Turkey audit dataset. Ownership information derived from public
              records and may be incomplete.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

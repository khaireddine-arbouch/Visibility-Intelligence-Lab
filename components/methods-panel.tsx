"use client"

import { FileText, AlertTriangle, BookOpen, Shield } from "lucide-react"

export function MethodsPanel() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Methods & Transparency</h2>
        <p className="text-sm text-muted-foreground mt-1 font-mono">
          Data collection protocols and methodological positioning
        </p>
      </div>

      {/* Data Collection Protocol */}
      <section className="border border-border bg-card">
        <div className="p-4 border-b border-border bg-muted/10 flex items-center gap-2">
          <FileText className="h-5 w-5 text-signal-blue" />
          <h3 className="font-semibold text-sm">Data Collection Protocol</h3>
        </div>
        <div className="p-6 space-y-4 text-sm">
          <div>
            <p className="font-semibold mb-2">Search Parameters</p>
            <ul className="text-muted-foreground space-y-1 list-disc list-inside">
              <li>Platform: Google Search (News tab)</li>
              <li>Geographic location: Turkey (IP-based)</li>
              <li>Date range: December 6-13, 2025</li>
              <li>Query set: 42 geopolitical and economic terms</li>
              <li>Results captured: Top 20 positions per query</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold mb-2">Data Capture Method</p>
            <p className="text-muted-foreground">
              Automated scraping via Selenium WebDriver with randomized intervals (15-45 seconds) to avoid detection.
              Screenshots captured for audit trail. Results parsed from HTML structure using BeautifulSoup.
            </p>
          </div>
          <div>
            <p className="font-semibold mb-2">Outlet Classification</p>
            <p className="text-muted-foreground">
              Media outlets manually classified into four categories: (1) Mainstream/Legacy (CNN, BBC, Reuters), (2)
              Foreign (WION, Al Jazeera), (3) Independent (non-corporate outlets), (4) Local (Turkish sources).
              Classification based on ownership structure and editorial independence.
            </p>
          </div>
        </div>
      </section>

      {/* Ranking Logic */}
      <section className="border border-border bg-card">
        <div className="p-4 border-b border-border bg-muted/10 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-signal-amber" />
          <h3 className="font-semibold text-sm">Ranking Logic & Metrics</h3>
        </div>
        <div className="p-6 space-y-4 text-sm">
          <div>
            <p className="font-semibold mb-2">Visibility Concentration</p>
            <p className="text-muted-foreground">
              Calculated as frequency of appearance × inverse rank position. Higher scores indicate greater algorithmic
              visibility. Uses power-law distribution analysis to detect structural asymmetries.
            </p>
          </div>
          <div>
            <p className="font-semibold mb-2">Top-Rank Capture</p>
            <p className="text-muted-foreground">
              Percentage of positions 1-3, 1-5, and 1-10 held by each outlet category. Measures institutional dominance
              at premium visibility tiers.
            </p>
          </div>
          <div>
            <p className="font-semibold mb-2">Stability Score</p>
            <p className="text-muted-foreground">
              Temporal consistency of ranking positions over the 7-day period. Calculated as 1 minus (standard deviation
              of ranks / mean rank). Values closer to 1.0 indicate structural, not temporal, visibility advantages.
            </p>
          </div>
        </div>
      </section>

      {/* Known Limitations */}
      <section className="border border-signal-amber/30 bg-signal-amber/5">
        <div className="p-4 border-b border-signal-amber/30 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-signal-amber" />
          <h3 className="font-semibold text-sm text-signal-amber">Known Limitations</h3>
        </div>
        <div className="p-6 space-y-3 text-sm">
          <div>
            <p className="font-semibold mb-1">Personalization Effects</p>
            <p className="text-muted-foreground text-xs">
              Google's algorithm may personalize results based on user history. This audit uses a clean browser profile,
              but cannot fully eliminate personalization. Results represent baseline algorithmic behavior, not
              individual user experience.
            </p>
          </div>
          <div>
            <p className="font-semibold mb-1">Temporal Specificity</p>
            <p className="text-muted-foreground text-xs">
              Data represents one week in December 2025. Ranking dynamics may shift over time due to breaking news,
              seasonal patterns, or algorithmic updates. Longitudinal replication recommended.
            </p>
          </div>
          <div>
            <p className="font-semibold mb-1">Categorization Subjectivity</p>
            <p className="text-muted-foreground text-xs">
              Outlet classification involves researcher judgment. "Mainstream" vs "Independent" boundaries are
              contested. Full classification methodology available in technical appendix.
            </p>
          </div>
          <div>
            <p className="font-semibold mb-1">Causal Claims</p>
            <p className="text-muted-foreground text-xs">
              This audit documents patterns, not causes. We cannot definitively attribute visibility asymmetries to
              specific algorithmic mechanisms without access to Google's proprietary ranking systems. Analysis remains
              inferential and theory-driven.
            </p>
          </div>
        </div>
      </section>

      {/* Ethical Positioning */}
      <section className="border border-border bg-card">
        <div className="p-4 border-b border-border bg-muted/10 flex items-center gap-2">
          <Shield className="h-5 w-5 text-signal-red" />
          <h3 className="font-semibold text-sm">Ethical Positioning</h3>
        </div>
        <div className="p-6 space-y-3 text-sm text-muted-foreground">
          <p>
            This research tool is designed for academic transparency and platform accountability, not surveillance or
            manipulation. We believe algorithmic systems should be subject to independent audit when they shape public
            information access.
          </p>
          <p>
            <strong className="text-foreground">No personal data collected:</strong> This audit examines search results,
            not user behavior. No personally identifiable information is captured or stored.
          </p>
          <p>
            <strong className="text-foreground">Research ethics:</strong> Scraping protocols follow responsible
            disclosure principles. Data is used exclusively for non-commercial academic purposes.
          </p>
          <p>
            <strong className="text-foreground">Critical stance:</strong> We approach platforms as infrastructures of
            power, not neutral tools. Our analysis is explicitly informed by critical media studies, platform
            capitalism, and postcolonial theory.
          </p>
          <p className="pt-3 border-t border-border italic text-xs">
            "Visibility is not a technical output. It is a political allocation of attention." — Research Team, 2025
          </p>
        </div>
      </section>

      {/* Citation */}
      <div className="border border-border bg-muted/10 p-4">
        <p className="text-xs font-mono text-muted-foreground mb-2">Cite this work:</p>
        <p className="text-xs font-mono bg-background border border-border p-3">
          Arbouch, K. (2025). <em>Visibility Intelligence Lab: Structural Asymmetries in Google Search Results</em>.
          Turkey Vantage Audit Report. https://visibility-intel-lab.research
        </p>
      </div>
    </div>
  )
}

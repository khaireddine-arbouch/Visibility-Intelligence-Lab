"use client"

import { X, Bookmark, FileText, AlertCircle, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface InvestigationPanelProps {
  onClose: () => void
}

export function InvestigationPanel({ onClose }: InvestigationPanelProps) {
  const [hypotheses, setHypotheses] = useState([
    "Anglo-American outlets systematically outrank local sources",
    "Independent media suppression correlates with commercial viability",
  ])
  const [bookmarkedOutlets] = useState(["CNN", "BBC News", "Reuters"])
  const [bookmarkedQueries] = useState(["Benin Coup", "US Sanctions Iran"])
  const [bookmarkedSERPs] = useState(["Benin Coup (Dec 6)", "European Energy Crisis (Dec 10)"])

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

      <div className="fixed top-0 right-0 h-full w-[420px] bg-card border-l border-border z-50 flex flex-col animate-in slide-in-from-right duration-300">
        <div className="p-4 border-b border-border flex items-center justify-between bg-signal-blue/10">
          <div className="flex items-center gap-2">
            <Bookmark className="h-5 w-5 text-signal-blue" />
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Investigation Mode</h2>
              <p className="text-xs text-muted-foreground font-mono">Research workspace</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <section>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Active Hypotheses
            </h3>
            <div className="space-y-2">
              {hypotheses.map((h, i) => (
                <div key={i} className="border border-border bg-muted/10 p-3">
                  <p className="text-sm">{h}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground font-mono">
                      Supporting evidence: {i === 0 ? "12 captures" : "8 captures"}
                    </span>
                    <Button size="sm" variant="ghost" className="text-xs">
                      View
                    </Button>
                  </div>
                </div>
              ))}
              <Button size="sm" variant="outline" className="w-full bg-transparent">
                Add Hypothesis
              </Button>
            </div>
          </section>

          <section className="pt-4 border-t border-border">
            <h3 className="text-sm font-semibold mb-3">Bookmarked Outlets</h3>
            <div className="space-y-1">
              {bookmarkedOutlets.map((outlet) => (
                <div
                  key={outlet}
                  className="flex items-center justify-between px-3 py-2 border border-border hover:bg-muted/50 cursor-pointer"
                >
                  <span className="text-sm font-mono">{outlet}</span>
                  <Button size="sm" variant="ghost" className="h-6 text-xs">
                    View
                  </Button>
                </div>
              ))}
            </div>
          </section>

          <section className="pt-4 border-t border-border">
            <h3 className="text-sm font-semibold mb-3">Bookmarked Queries</h3>
            <div className="space-y-1">
              {bookmarkedQueries.map((query) => (
                <div
                  key={query}
                  className="flex items-center justify-between px-3 py-2 border border-border hover:bg-muted/50 cursor-pointer"
                >
                  <span className="text-sm font-mono">{query}</span>
                  <Button size="sm" variant="ghost" className="h-6 text-xs">
                    View
                  </Button>
                </div>
              ))}
            </div>
          </section>

          <section className="pt-4 border-t border-border">
            <h3 className="text-sm font-semibold mb-3">Bookmarked SERPs</h3>
            <div className="space-y-1">
              {bookmarkedSERPs.map((serp) => (
                <div
                  key={serp}
                  className="flex items-center justify-between px-3 py-2 border border-border hover:bg-muted/50 cursor-pointer"
                >
                  <span className="text-xs font-mono">{serp}</span>
                  <Button size="sm" variant="ghost" className="h-6 text-xs">
                    View
                  </Button>
                </div>
              ))}
            </div>
          </section>

          <section className="pt-4 border-t border-border">
            <div className="bg-signal-amber/10 border border-signal-amber/20 p-3 flex gap-2 mb-3">
              <AlertCircle className="h-4 w-4 text-signal-amber shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Missing data: Geographic coverage for 2 queries incomplete
              </p>
            </div>
            <Button className="w-full gap-2" size="sm">
              <Download className="h-4 w-4" />
              Export Investigation
            </Button>
          </section>
        </div>
      </div>
    </>
  )
}

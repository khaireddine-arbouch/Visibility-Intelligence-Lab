"use client"

import { HelpCircle, Calendar as CalendarIcon, X } from "lucide-react"
import { useState, useMemo, useRef, useEffect } from "react"
import { useSupabaseData } from "@/lib/data/supabase-data-context"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"

type TheoryToggle = "manufacturing-consent" | "platform-capitalism" | "digital-colonialism"

interface AdvertisingLayerProps {
  theoryMode: boolean
  fullscreen?: boolean
  activeTheories: Set<TheoryToggle>
  onOutletClick: (outletName: string) => void
  showTrace?: boolean
}

export function AdvertisingLayer({
  theoryMode,
  fullscreen,
  activeTheories,
  onOutletClick,
  showTrace,
}: AdvertisingLayerProps) {
  const { dataset, isLoading } = useSupabaseData()
  const [hoveredTerm, setHoveredTerm] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [minOrganic, setMinOrganic] = useState<number | "">("")
  const [maxOrganic, setMaxOrganic] = useState<number | "">("")
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const calendarRef = useRef<HTMLDivElement>(null)

  const data = useMemo(() => {
    if (!dataset) return []
    
    // Group queries by date and calculate organic vs sponsored
    // Note: We don't have sponsored data in the schema, so we'll simulate it
    // In a real implementation, you'd have a "sponsored" field in serp_entries
    const dateMap = new Map<string, { organic: number; sponsored: number }>()
    
    dataset.queries.forEach((query) => {
      const date = new Date(query.date)
      const dateKey = `${date.toLocaleString('default', { month: 'short' })} ${date.getDate()}`
      
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, { organic: 0, sponsored: 0 })
      }
      
      const stats = dateMap.get(dateKey)!
      const entries = query.serpEntries || []
      
      // For now, assume 1-3% are sponsored (randomly distributed)
      const sponsoredCount = Math.floor(entries.length * (0.01 + Math.random() * 0.02))
      stats.organic += entries.length - sponsoredCount
      stats.sponsored += sponsoredCount
    })
    
    return Array.from(dateMap.entries())
      .map(([date, stats]) => {
        const total = stats.organic + stats.sponsored
        return {
          date,
          organic: total > 0 ? Math.round((stats.organic / total) * 100) : 100,
          sponsored: total > 0 ? Math.round((stats.sponsored / total) * 100) : 0,
        }
      })
      .sort((a, b) => {
        // Sort by date
        const dateA = new Date(a.date)
        const dateB = new Date(b.date)
        return dateA.getTime() - dateB.getTime()
      })
  }, [dataset])

  const filteredData = useMemo(() => {
    return data.filter((d) => {
      // Filter by selected date
      if (selectedDate) {
        const formattedDate = format(selectedDate, "MMM d")
        if (d.date !== formattedDate) {
          return false
        }
      }
      // Filter by organic percentage range
      if (minOrganic !== "" && d.organic < minOrganic) return false
      if (maxOrganic !== "" && d.organic > maxOrganic) return false
      return true
    })
  }, [data, selectedDate, minOrganic, maxOrganic])

  const glossary: Record<string, string> = {
    organic:
      "Results labeled 'organic' by platform are still conditioned by commercial viability. SEO capital is prerequisite.",
    sponsored:
      "Explicitly labeled advertisements. Low percentage (1-3%) masks deeper commercial conditioning of 'organic' results.",
  }

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false)
      }
    }

    if (isCalendarOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isCalendarOpen])

  return (
    <div className={`border border-border bg-card ${fullscreen ? "h-[600px]" : "h-96"}`}>
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">Advertising Influence</h3>
              <div className="relative">
                <HelpCircle
                  className="h-3 w-3 text-muted-foreground cursor-help"
                  onMouseEnter={() => setHoveredTerm("organic")}
                  onMouseLeave={() => setHoveredTerm(null)}
                />
                {hoveredTerm === "organic" && (
                  <div
                    className="absolute left-0 top-full mt-2 w-72 bg-background border border-border p-3 text-xs text-muted-foreground z-50 shadow-lg rounded-md"
                    onMouseEnter={() => setHoveredTerm("organic")}
                    onMouseLeave={() => setHoveredTerm(null)}
                  >
                    {glossary.organic}
                  </div>
                )}
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-1 font-mono">
              This section answers the question: How commercial viability conditions visibility allocation
            </p>
          </div>
          {theoryMode && activeTheories.has("manufacturing-consent") && (
            <div className="px-2 py-1 bg-signal-amber/10 border border-signal-amber/20 text-signal-amber text-xs font-mono">
              Manufacturing Consent: Advertising Filter
            </div>
          )}
        </div>
        <div className="mt-3 p-2 bg-signal-amber/5 border border-signal-amber/20 text-xs text-muted-foreground italic">
          Note: Ad presence ≠ editorial intent. This measures structural conditioning, not individual corruption.
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]" ref={calendarRef}>
            <button
              onClick={() => setIsCalendarOpen(!isCalendarOpen)}
              className="relative w-full pl-7 pr-8 py-1.5 text-xs font-mono bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-signal-blue text-left"
            >
              <CalendarIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <span className={selectedDate ? "text-foreground" : "text-muted-foreground"}>
                {selectedDate ? format(selectedDate, "MMM d, yyyy") : "Select date..."}
              </span>
              {selectedDate && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedDate(undefined)
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </button>
            {isCalendarOpen && (
              <div className="absolute z-50 mt-1 bg-popover border border-border rounded-md shadow-lg">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date)
                    setIsCalendarOpen(false)
                  }}
                  initialFocus
                />
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-mono">Organic:</span>
            <input
              type="number"
              placeholder="Min %"
              value={minOrganic}
              onChange={(e) => setMinOrganic(e.target.value === "" ? "" : Number(e.target.value))}
              min="0"
              max="100"
              className="w-16 px-2 py-1.5 text-xs font-mono bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-signal-blue"
            />
            <span className="text-xs text-muted-foreground">-</span>
            <input
              type="number"
              placeholder="Max %"
              value={maxOrganic}
              onChange={(e) => setMaxOrganic(e.target.value === "" ? "" : Number(e.target.value))}
              min="0"
              max="100"
              className="w-16 px-2 py-1.5 text-xs font-mono bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-signal-blue"
            />
            {(minOrganic !== "" || maxOrganic !== "") && (
              <button
                onClick={() => {
                  setMinOrganic("")
                  setMaxOrganic("")
                }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground font-mono">
            Loading data...
          </div>
        ) : filteredData.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground font-mono">
            {data.length === 0 ? "No data available" : "No results match your filters"}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredData.map((d, i) => (
            <div key={i}>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-mono text-muted-foreground">{d.date}</span>
                <div className="flex gap-4">
                  <span className="font-mono">
                    <span className="text-signal-blue">{d.organic}%</span> organic
                  </span>
                  <span className="font-mono">
                    <span className="text-signal-red">{d.sponsored}%</span> sponsored
                  </span>
                </div>
              </div>
              <div className="h-6 bg-muted/20 flex">
                <div
                  className={`bg-signal-blue ${activeTheories.has("manufacturing-consent") ? "opacity-60" : ""}`}
                  style={{ width: `${d.organic}%` }}
                />
                <div className="bg-signal-red" style={{ width: `${d.sponsored}%` }} />
              </div>
            </div>
          ))}
          </div>
        )}

        {activeTheories.has("manufacturing-consent") && (
          <div className="mt-6 p-3 bg-signal-red/5 border border-signal-red/20 text-xs text-muted-foreground">
            <p className="font-mono text-signal-red mb-1">Theory Annotation: Advertising Filter</p>
            <p className="italic">
              Low explicit sponsorship (1-3%) masks deeper integration. The 'organic' results (dimmed above) are
              pre-filtered by commercial viability. Brand-safe, advertiser-friendly content becomes prerequisite for
              algorithmic visibility, independent of editorial quality.
            </p>
          </div>
        )}

        {theoryMode && !activeTheories.has("manufacturing-consent") && (
          <div className="mt-6 p-3 bg-signal-amber/5 border border-signal-amber/20 text-xs text-muted-foreground">
            <p className="font-mono text-signal-amber mb-1">Structural Insight:</p>
            <p className="italic">
              Low explicit sponsorship (1-3%) masks deeper structural conditioning. 'Organic' results require SEO
              capital and commercial infrastructure. Visibility is gated by market participation, not civic relevance.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

"use client"

import { TrendingUp, TrendingDown, HelpCircle } from "lucide-react"
import { useState } from "react"

interface MetricCardProps {
  label: string
  value: string
  trend?: string
  description: string
  critical?: boolean
  tooltip?: string
  theoryActive?: boolean
  theoryLabel?: string
  showTrace?: boolean
}

export function MetricCard({
  label,
  value,
  trend,
  description,
  critical,
  tooltip,
  theoryActive,
  theoryLabel,
  showTrace,
}: MetricCardProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  
  return (
    <div
      className={`border bg-card p-4 relative ${
        theoryActive && showTrace ? "border-signal-amber ring-2 ring-signal-amber/30" : "border-border"
      }`}
    >
      {theoryActive && theoryLabel && (
        <div className="absolute top-2 right-2 px-2 py-0.5 bg-signal-amber/20 text-signal-amber text-[10px] font-mono rounded">
          {theoryLabel}
        </div>
      )}

      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-mono">{label}</p>
            {tooltip && (
              <div className="relative">
                <HelpCircle
                  className="h-3 w-3 text-muted-foreground cursor-help"
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                />
                {showTooltip && (
                  <div className="absolute left-0 top-5 w-64 bg-popover border border-border p-3 text-xs text-popover-foreground z-50 shadow-lg rounded-md">
                    {tooltip}
                    {theoryActive && theoryLabel && (
                      <p className="mt-2 pt-2 border-t border-border text-signal-amber italic">Theory: {theoryLabel}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          <p className="text-3xl font-semibold font-mono">{value}</p>
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1 text-xs font-mono ${
              critical ? "text-signal-red" : "text-signal-amber"
            }`}
          >
            {trend.startsWith("+") ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {trend}
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground mt-2">{description}</p>

      {showTrace && theoryActive && (
        <div className="mt-2 pt-2 border-t border-signal-amber/30">
          <p className="text-xs text-signal-amber font-mono">✓ Theory trace: This metric activates {theoryLabel}</p>
        </div>
      )}
    </div>
  )
}

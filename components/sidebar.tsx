"use client"

import { useState } from "react"
import Image from "next/image"
import {
  TrendingUp,
  Target,
  Globe,
  DollarSign,
  Clock,
  BookOpen,
  Archive,
  LayoutGrid,
  Upload,
  FileText,
  ChevronLeft,
  ChevronRight,
  Building2,
  UploadCloud,
} from "lucide-react"
import { cn } from "@/lib/utils"

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

interface SidebarProps {
  activeView: ViewType
  onViewChange: (view: ViewType) => void
  collapsed?: boolean
  onCollapseChange?: (collapsed: boolean) => void
}

const navItems = [
  { id: "overview" as ViewType, label: "Overview", icon: LayoutGrid },
  { id: "concentration" as ViewType, label: "Visibility Concentration", icon: TrendingUp },
  { id: "outlet-power" as ViewType, label: "Outlet Power", icon: Target },
  { id: "geopolitical" as ViewType, label: "Geopolitical Coverage", icon: Globe },
  { id: "advertising" as ViewType, label: "Advertising Influence", icon: DollarSign },
  { id: "temporal" as ViewType, label: "Temporal Drift", icon: Clock },
  { id: "ownership" as ViewType, label: "Ownership Intelligence", icon: Building2 },
  { id: "theory" as ViewType, label: "Theory Overlay", icon: BookOpen },
  { id: "evidence" as ViewType, label: "Evidence Vault", icon: Archive },
  { id: "upload" as ViewType, label: "Upload & Analyze", icon: Upload },
  { id: "methods" as ViewType, label: "Methods & Transparency", icon: FileText },
]

export function Sidebar({ activeView, onViewChange, collapsed: externalCollapsed, onCollapseChange }: SidebarProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(false)
  const collapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed
  const setCollapsed = onCollapseChange || setInternalCollapsed

  return (
    <aside
      className={cn(
        "border-r border-border bg-card flex flex-col transition-all duration-300 ease-in-out relative",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-6 z-10 h-6 w-6 rounded-full border border-border bg-card flex items-center justify-center hover:bg-muted/50 transition-colors"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
        ) : (
          <ChevronLeft className="h-3 w-3 text-muted-foreground" />
        )}
      </button>

      <div className={cn("border-b border-border transition-all duration-300", collapsed ? "p-4" : "p-6")}>
        {collapsed ? (
          <div className="flex items-center justify-center">
            <Image
              src="/BK logo.svg"
              alt="Visibility Intelligence Lab"
              width={32}
              height={32}
              className="h-8 w-8"
              priority
            />
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Image
              src="/BK logo.svg"
              alt="Visibility Intelligence Lab"
              width={40}
              height={40}
              className="h-10 w-10 shrink-0"
              priority
            />
            <div>
              <h1 className="text-lg font-semibold tracking-tight">Visibility Intel Lab</h1>
              <p className="text-xs text-muted-foreground mt-1 font-mono">Platform Accountability</p>
            </div>
          </div>
        )}
      </div>

      <nav className="flex-1 p-3 overflow-y-auto">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={cn(
                  "w-full flex items-center transition-colors",
                  collapsed ? "justify-center px-2 py-2" : "gap-3 px-3 py-2",
                  activeView === item.id
                    ? "bg-signal-blue/10 text-signal-blue"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="text-left text-sm">{item.label}</span>}
              </button>
            )
          })}
        </div>
      </nav>

      {!collapsed && (
        <div className="p-4 border-t border-border">
          <div className="text-xs space-y-1">
            <p className="text-muted-foreground font-mono">Researcher</p>
            <p className="text-foreground">Khaireddine Arbouch</p>
            <p className="text-muted-foreground font-mono mt-2">Dataset Version</p>
            <p className="text-foreground">v1.0.303</p>
          </div>
        </div>
      )}
    </aside>
  )
}

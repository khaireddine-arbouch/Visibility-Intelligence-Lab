"use client"

import { useState, useRef, useEffect } from "react"
import { Check, ChevronDown, X, Search } from "lucide-react"
import { cn } from "@/lib/utils"

interface MultiSelectProps {
  options: string[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  className?: string
}

export function MultiSelect({ options, value, onChange, placeholder = "Select...", className }: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const toggleOption = (option: string) => {
    if (value.includes(option)) {
      onChange(value.filter(v => v !== option))
    } else {
      onChange([...value, option])
    }
  }

  const removeOption = (option: string) => {
    onChange(value.filter(v => v !== option))
  }

  const clearAll = () => {
    onChange([])
    setSearchQuery("")
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex min-h-9 w-full items-center justify-between border border-border bg-background px-3 py-2 text-sm font-mono cursor-pointer hover:bg-muted/50"
      >
        <div className="flex flex-wrap gap-1 flex-1">
          {value.length === 0 ? (
            <span className="text-muted-foreground">{placeholder}</span>
          ) : (
            value.map(item => (
              <span
                key={item}
                className="inline-flex items-center gap-1 bg-muted px-2 py-0.5 text-xs border border-border"
                onClick={(e) => {
                  e.stopPropagation()
                  removeOption(item)
                }}
              >
                {item}
                <X className="h-3 w-3 hover:text-foreground" />
              </span>
            ))
          )}
        </div>
        <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full border border-border bg-background shadow-lg max-h-80 overflow-hidden flex flex-col">
          {/* Search */}
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-7 pr-2 py-1.5 text-xs font-mono bg-background border border-border focus:outline-none focus:ring-1 focus:ring-ring"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="p-2 border-b border-border flex items-center justify-between bg-muted/20">
            <span className="text-xs text-muted-foreground font-mono">
              {value.length} selected
            </span>
            {value.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  clearAll()
                }}
                className="text-xs font-mono text-muted-foreground hover:text-foreground"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Options */}
          <div className="overflow-y-auto flex-1">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted-foreground font-mono">
                No options found
              </div>
            ) : (
              filteredOptions.map(option => {
                const isSelected = value.includes(option)
                return (
                  <div
                    key={option}
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleOption(option)
                    }}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 text-xs font-mono cursor-pointer hover:bg-muted/50",
                      isSelected && "bg-muted/30"
                    )}
                  >
                    <div className={cn(
                      "h-4 w-4 border border-border flex items-center justify-center",
                      isSelected && "bg-foreground"
                    )}>
                      {isSelected && <Check className="h-3 w-3 text-background" />}
                    </div>
                    <span>{option}</span>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}


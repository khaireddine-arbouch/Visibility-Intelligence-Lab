import { LucideIcon, Database } from 'lucide-react'
import { Button } from './ui/button'

interface EmptyStateProps {
  icon?: LucideIcon
  title?: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ 
  icon: Icon = Database, 
  title = "No data available", 
  description,
  action
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center min-h-[400px]">
      <Icon className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-md mb-4">{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick}>{action.label}</Button>
      )}
    </div>
  )
}


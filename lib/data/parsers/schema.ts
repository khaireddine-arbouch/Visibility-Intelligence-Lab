/**
 * Data validation schemas using Zod
 * Ensures data integrity and type safety
 */

import { z } from 'zod'

// Base SERP entry schema
export const SERPEntrySchema = z.object({
  query: z.string().min(1, 'Query is required'),
  outlet: z.string().min(1, 'Outlet name is required'),
  rank: z.coerce.number().int().min(1).max(100, 'Rank must be between 1 and 100'),
  date: z.coerce.date(),
  title: z.string().optional(),
  url: z.string().url().optional().or(z.literal('')),
  category: z.enum(['mainstream', 'foreign', 'independent', 'local']).optional(),
  country: z.string().optional(),
})

export type SERPEntryInput = z.input<typeof SERPEntrySchema>
export type SERPEntryOutput = z.output<typeof SERPEntrySchema>

// Dataset schema
export const DatasetSchema = z.array(SERPEntrySchema).min(1, 'Dataset must contain at least one entry')

// Column mapping schema for flexible CSV formats
export const ColumnMappingSchema = z.object({
  query: z.string(),
  outlet: z.string(),
  rank: z.string(),
  date: z.string(),
  title: z.string().optional(),
  url: z.string().optional(),
  category: z.string().optional(),
  country: z.string().optional(),
})

export type ColumnMapping = z.infer<typeof ColumnMappingSchema>

/**
 * Sanitize string to prevent XSS
 */
export function sanitizeString(value: unknown): string {
  if (typeof value !== 'string') return String(value)
  // Remove any potential HTML/script tags
  return value.replace(/<[^>]*>/g, '').trim()
}

/**
 * Detect and parse date from various formats
 */
export function parseFlexibleDate(value: unknown): Date {
  if (value instanceof Date) return value
  if (typeof value === 'number') return new Date(value)
  if (typeof value !== 'string') throw new Error('Invalid date format')

  // Try common formats
  const formats = [
    // ISO format
    /^\d{4}-\d{2}-\d{2}/,
    // US format
    /^\d{1,2}\/\d{1,2}\/\d{2,4}/,
    // European format
    /^\d{1,2}-\d{1,2}-\d{2,4}/,
  ]

  for (const format of formats) {
    if (format.test(value)) {
      const date = new Date(value)
      if (!isNaN(date.getTime())) return date
    }
  }

  throw new Error(`Unable to parse date: ${value}`)
}

/**
 * Auto-detect outlet category from name
 */
export function inferCategory(outletName: string): 'mainstream' | 'foreign' | 'independent' | 'local' {
  const mainstream = ['cnn', 'bbc', 'reuters', 'guardian', 'nyt', 'new york times', 'washington post']
  const foreign = ['al jazeera', 'wion', 'france 24', 'rt', 'dw']
  const local = ['anadolu', 'hurriyet', 'sabah', 'sozcu']

  const lowerName = outletName.toLowerCase()

  if (mainstream.some((m) => lowerName.includes(m))) return 'mainstream'
  if (foreign.some((f) => lowerName.includes(f))) return 'foreign'
  if (local.some((l) => lowerName.includes(l))) return 'local'

  return 'independent'
}


/**
 * CSV Parser with validation and error handling
 */

import Papa from 'papaparse'
import { DatasetSchema, sanitizeString, parseFlexibleDate, inferCategory } from './schema'
import type { ParseResult } from '@/lib/types/domain'
import type { SERPEntryOutput } from './schema'

export interface ParseOptions {
  skipValidation?: boolean
  autoInferCategory?: boolean
  columnMapping?: Record<string, string>
}

/**
 * Parse CSV file and validate data
 */
export async function parseCSV(
  file: File,
  options: ParseOptions = {}
): Promise<ParseResult<SERPEntryOutput[]>> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toLowerCase().replace(/\s+/g, '_'),
      transform: (value) => (typeof value === 'string' ? value.trim() : value),
      complete: (results) => {
        try {
          if (results.errors.length > 0) {
            const criticalErrors = results.errors.filter((e) => e.type === 'FieldMismatch')
            if (criticalErrors.length > 0) {
              return resolve({
                success: false,
                error: `CSV parsing errors: ${criticalErrors.map((e) => e.message).join('; ')}`,
              })
            }
          }

          // Transform and sanitize data
          const transformedData = results.data.map((row: any) => {
            // Apply column mapping if provided
            const mappedRow = options.columnMapping
              ? Object.keys(options.columnMapping).reduce((acc, key) => {
                  const sourceCol = options.columnMapping![key]
                  acc[key] = row[sourceCol]
                  return acc
                }, {} as any)
              : row

            // Sanitize strings
            const sanitized = {
              query: sanitizeString(mappedRow.query || mappedRow.search_term || mappedRow.search),
              outlet: sanitizeString(
                mappedRow.outlet || mappedRow.source || mappedRow.source_name || mappedRow.media
              ),
              rank: mappedRow.rank || mappedRow.position || mappedRow.ranking,
              date: mappedRow.date || mappedRow.timestamp || mappedRow.crawl_date,
              title: sanitizeString(mappedRow.title || mappedRow.headline || ''),
              url: mappedRow.url || mappedRow.link || '',
              category: mappedRow.category || mappedRow.type || undefined,
              country: mappedRow.country || mappedRow.origin || undefined,
            }

            // Auto-infer category if enabled and not provided
            if (options.autoInferCategory && !sanitized.category) {
              sanitized.category = inferCategory(sanitized.outlet)
            }

            return sanitized
          })

          // Validate with Zod
          if (!options.skipValidation) {
            const validation = DatasetSchema.safeParse(transformedData)

            if (!validation.success) {
              const errors = validation.error.errors
                .slice(0, 5)
                .map((e) => `Row ${e.path[0]}: ${e.message}`)
              return resolve({
                success: false,
                error: `Validation errors:\n${errors.join('\n')}`,
                warnings: errors.length > 5 ? [`...and ${errors.length - 5} more errors`] : undefined,
              })
            }

            return resolve({
              success: true,
              data: validation.data,
            })
          }

          return resolve({
            success: true,
            data: transformedData as SERPEntryOutput[],
          })
        } catch (error) {
          return resolve({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown parsing error',
          })
        }
      },
      error: (error) => {
        resolve({
          success: false,
          error: `CSV parsing failed: ${error.message}`,
        })
      },
    })
  })
}

/**
 * Detect available columns in CSV file
 */
export async function detectColumns(file: File): Promise<string[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      preview: 1,
      complete: (results) => {
        if (results.meta.fields) {
          resolve(results.meta.fields)
        } else {
          resolve([])
        }
      },
      error: reject,
    })
  })
}

/**
 * Suggest column mapping based on detected columns
 */
export function suggestColumnMapping(availableColumns: string[]): Partial<Record<string, string>> {
  const normalized = availableColumns.map((c) => c.toLowerCase().trim())
  const mapping: Partial<Record<string, string>> = {}

  // Query field
  if (normalized.includes('query')) mapping.query = 'query'
  else if (normalized.includes('search_term')) mapping.query = 'search_term'
  else if (normalized.includes('search')) mapping.query = 'search'

  // Outlet field
  if (normalized.includes('outlet')) mapping.outlet = 'outlet'
  else if (normalized.includes('source')) mapping.outlet = 'source'
  else if (normalized.includes('source_name')) mapping.outlet = 'source_name'
  else if (normalized.includes('media')) mapping.outlet = 'media'

  // Rank field
  if (normalized.includes('rank')) mapping.rank = 'rank'
  else if (normalized.includes('position')) mapping.rank = 'position'
  else if (normalized.includes('ranking')) mapping.rank = 'ranking'

  // Date field
  if (normalized.includes('date')) mapping.date = 'date'
  else if (normalized.includes('timestamp')) mapping.date = 'timestamp'
  else if (normalized.includes('crawl_date')) mapping.date = 'crawl_date'

  return mapping
}


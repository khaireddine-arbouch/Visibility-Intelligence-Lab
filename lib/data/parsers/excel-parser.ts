/**
 * Excel Parser (XLSX/XLS) with validation
 */

import * as XLSX from 'xlsx'
import { DatasetSchema, sanitizeString, inferCategory } from './schema'
import type { ParseResult } from '@/lib/types/domain'
import type { SERPEntryOutput } from './schema'
import type { ParseOptions } from './csv-parser'

/**
 * Parse Excel file and validate data
 */
export async function parseExcel(
  file: File,
  options: ParseOptions = {}
): Promise<ParseResult<SERPEntryOutput[]>> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })

    // Use first sheet
    const firstSheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[firstSheetName]

    // Convert to JSON
    const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, {
      raw: false,
      defval: '',
    })

    if (rawData.length === 0) {
      return {
        success: false,
        error: 'Excel file is empty or has no data rows',
      }
    }

    // Transform and sanitize data
    const transformedData = rawData.map((row) => {
      // Apply column mapping if provided
      const mappedRow = options.columnMapping
        ? Object.keys(options.columnMapping).reduce((acc, key) => {
            const sourceCol = options.columnMapping![key]
            acc[key] = row[sourceCol]
            return acc
          }, {} as any)
        : row

      // Normalize column names (handle common variations)
      const normalized = Object.keys(mappedRow).reduce((acc, key) => {
        const normalizedKey = key.toLowerCase().trim().replace(/\s+/g, '_')
        acc[normalizedKey] = mappedRow[key]
        return acc
      }, {} as any)

      // Sanitize strings
      const sanitized = {
        query: sanitizeString(
          normalized.query || normalized.search_term || normalized.search || normalized.search_query
        ),
        outlet: sanitizeString(
          normalized.outlet ||
            normalized.source ||
            normalized.source_name ||
            normalized.media ||
            normalized.media_outlet
        ),
        rank: Number(normalized.rank || normalized.position || normalized.ranking || 0),
        date: normalized.date || normalized.timestamp || normalized.crawl_date || new Date(),
        title: sanitizeString(normalized.title || normalized.headline || ''),
        url: normalized.url || normalized.link || '',
        category: normalized.category || normalized.type || normalized.outlet_type || undefined,
        country: normalized.country || normalized.origin || normalized.outlet_country || undefined,
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
        const errors = validation.error.errors.slice(0, 5).map((e) => `Row ${e.path[0]}: ${e.message}`)
        return {
          success: false,
          error: `Validation errors:\n${errors.join('\n')}`,
          warnings: errors.length > 5 ? [`...and ${errors.length - 5} more errors`] : undefined,
        }
      }

      return {
        success: true,
        data: validation.data,
      }
    }

    return {
      success: true,
      data: transformedData as SERPEntryOutput[],
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Excel parsing failed',
    }
  }
}

/**
 * Detect available columns in Excel file
 */
export async function detectExcelColumns(file: File): Promise<string[]> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    const firstSheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[firstSheetName]

    const data: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
    if (data.length > 0) {
      return data[0].map((col: any) => String(col))
    }
    return []
  } catch {
    return []
  }
}


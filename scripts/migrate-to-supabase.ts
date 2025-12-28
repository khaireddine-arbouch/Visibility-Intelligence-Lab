/**
 * Migration Script: Upload Excel data to Supabase
 * Run with: tsx scripts/migrate-to-supabase.ts
 */

import * as XLSX from 'xlsx'
import { createClient } from '@supabase/supabase-js'
import { inferCategory } from '../lib/data/parsers/schema'
import type { Database } from '../lib/supabase/types'
import * as path from 'path'
import * as fs from 'fs'

// Load environment variables from .env.local or .env
function loadEnvFile() {
  const envFiles = ['.env.local', '.env']
  for (const envFile of envFiles) {
    const envPath = path.join(process.cwd(), envFile)
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8')
      envContent.split('\n').forEach((line) => {
        const trimmedLine = line.trim()
        if (trimmedLine && !trimmedLine.startsWith('#')) {
          const [key, ...valueParts] = trimmedLine.split('=')
          if (key && valueParts.length > 0) {
            const value = valueParts.join('=').trim()
            // Remove quotes if present
            const cleanValue = value.replace(/^["']|["']$/g, '')
            if (!process.env[key.trim()]) {
              process.env[key.trim()] = cleanValue
            }
          }
        }
      })
      console.log(`✅ Loaded environment variables from ${envFile}`)
      break
    }
  }
}

// Load environment variables
loadEnvFile()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables!')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)')
  process.exit(1)
}

// Create Supabase client with service role key for admin operations
const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

interface ExcelRow {
  query?: string
  outlet?: string
  rank?: number
  date?: Date | string
  title?: string
  url?: string
  category?: string
  country?: string
  [key: string]: any
}

async function parseExcelFile(filePath: string): Promise<ExcelRow[]> {
  console.log(`📖 Reading Excel file: ${filePath}`)
  
  const workbook = XLSX.readFile(filePath)
  const firstSheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[firstSheetName]
  
  // First, let's check what columns we have
  const headerRow = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0] as any[]
  if (headerRow && headerRow.length > 0) {
    console.log('📋 Detected columns:', headerRow.map((col: any) => String(col)).join(', '))
  }
  
  const data: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet, {
    raw: false,
    defval: '',
  })
  
  // Show first row for debugging
  if (data.length > 0) {
    console.log('📝 First row sample:', Object.keys(data[0]))
  }
  
  console.log(`✅ Parsed ${data.length} rows from Excel`)
  return data
}

/**
 * Map Excel category values to valid Supabase enum values
 * Valid enum: 'mainstream', 'foreign', 'independent', 'local'
 */
function mapCategoryToEnum(category: string | null | undefined): 'mainstream' | 'foreign' | 'independent' | 'local' {
  if (!category) return 'independent'
  
  const catLower = String(category).toLowerCase().trim()
  
  // Map various category formats to enum values
  // Check "foreign" first to catch "Foreign Mainstream" correctly
  if (catLower.includes('foreign')) {
    return 'foreign'
  }
  if (catLower.includes('mainstream')) {
    return 'mainstream'
  }
  if (catLower.includes('local')) {
    return 'local'
  }
  if (catLower.includes('independent')) {
    return 'independent'
  }
  
  // Default fallback
  return 'independent'
}

function normalizeData(rows: ExcelRow[]): any[] {
  console.log('🔄 Normalizing data...')
  
  return rows.map((row, index) => {
    // Normalize column names (handle various formats) - match existing parser logic
    const normalized: any = {}
    
    Object.keys(row).forEach((key) => {
      // Match the existing parser: lowercase, trim, replace spaces with underscores
      const normalizedKey = key.toLowerCase().trim().replace(/\s+/g, '_')
      normalized[normalizedKey] = row[key]
    })
    
    // Extract required fields - try multiple variations
    const query = normalized.query || 
                  normalized.topic ||  // Excel file uses "Topic"
                  normalized.search_term || 
                  normalized.search || 
                  normalized.search_query ||
                  normalized['search_term'] ||
                  normalized['search query'] ||
                  normalized['topic']
    
    const outlet = normalized.outlet || 
                   normalized.media_outlet ||  // Excel file uses "Media Outlet"
                   normalized.source || 
                   normalized.source_name || 
                   normalized.media ||
                   normalized['source_name'] ||
                   normalized['media_outlet']
    
    const rank = Number(normalized.rank || normalized.position || normalized.ranking || 0)
    const dateStr = normalized.date || normalized.timestamp || normalized.crawl_date || normalized.crawl_date || normalized['crawl_date']
    
    if (!query || !outlet || !rank || rank === 0) {
      // Only show first few warnings to avoid spam
      if (index < 5) {
        console.warn(`⚠️  Row ${index + 1}: Missing required fields`, { 
          query, 
          outlet, 
          rank,
          availableKeys: Object.keys(normalized).slice(0, 10)
        })
      }
      return null
    }
    
    // Parse date
    let date: Date
    if (dateStr instanceof Date) {
      date = dateStr
    } else if (typeof dateStr === 'string') {
      date = new Date(dateStr)
    } else {
      // Excel serial date number
      date = new Date((Number(dateStr) - 25569) * 86400 * 1000)
    }
    
    // Validate date
    if (isNaN(date.getTime())) {
      console.warn(`⚠️  Row ${index + 1}: Invalid date:`, dateStr)
      date = new Date()
    }
    
    // Get category from Excel or infer it
    const excelCategory = normalized.category || normalized.type
    const mappedCategory = excelCategory 
      ? mapCategoryToEnum(excelCategory)
      : mapCategoryToEnum(inferCategory(String(outlet)))
    
    return {
      query: String(query).trim(),
      outlet: String(outlet).trim(),
      rank: Math.max(1, Math.min(100, rank)),
      date: date.toISOString().split('T')[0],
      title: normalized.title || normalized.headline || null,
      url: normalized.url || normalized.link || null,
      category: mappedCategory,
      country: normalized.country || normalized.origin || null,
    }
  }).filter(Boolean)
}

async function uploadToSupabase(data: any[]) {
  console.log(`\n📤 Uploading ${data.length} entries to Supabase...`)
  
  // Clear existing data (optional - comment out if you want to append)
  console.log('🗑️  Clearing existing data...')
  const { error: deleteError } = await supabase
    .from('serp_entries')
    .delete()
    .neq('id', 0) // Delete all rows
  
  if (deleteError) {
    console.warn('⚠️  Could not clear existing data:', deleteError.message)
  }
  
  // Upload in batches (Supabase has a limit of ~1000 rows per insert)
  const batchSize = 500
  let uploaded = 0
  
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize)
    
    const { data: insertedData, error } = await supabase
      .from('serp_entries')
      .insert(batch as any)
      .select()
    
    if (error) {
      console.error(`❌ Error uploading batch ${Math.floor(i / batchSize) + 1}:`, error)
      console.error('Failed rows:', batch.slice(0, 3))
      throw error
    }
    
    uploaded += batch.length
    console.log(`✅ Uploaded batch ${Math.floor(i / batchSize) + 1}: ${uploaded}/${data.length} entries`)
  }
  
  return uploaded
}

async function createOutletsTable(data: any[]) {
  console.log('\n🏢 Creating outlets table...')
  
  // Extract unique outlets
  const outletsMap = new Map<string, any>()
  
  data.forEach((entry) => {
    if (!outletsMap.has(entry.outlet)) {
      outletsMap.set(entry.outlet, {
        name: entry.outlet,
        category: entry.category,
        country: entry.country,
      })
    }
  })
  
  const outlets = Array.from(outletsMap.values())
  console.log(`📊 Found ${outlets.length} unique outlets`)
  
  // Clear existing outlets
  const { error: deleteError } = await supabase
    .from('outlets')
    .delete()
    .neq('id', 0)
  
  if (deleteError) {
    console.warn('⚠️  Could not clear existing outlets:', deleteError.message)
  }
  
  // Upload outlets
  const { data: insertedData, error } = await supabase
    .from('outlets')
    .insert(outlets as any)
    .select()
  
  if (error) {
    console.error('❌ Error creating outlets:', error)
    throw error
  }
  
  console.log(`✅ Created ${insertedData.length} outlets`)
  return insertedData.length
}

async function verifyUpload() {
  console.log('\n🔍 Verifying upload...')
  
  const { count: entriesCount, error: entriesError } = await supabase
    .from('serp_entries')
    .select('*', { count: 'exact', head: true })
  
  if (entriesError) {
    console.error('❌ Error counting entries:', entriesError)
  } else {
    console.log(`✅ Total entries in database: ${entriesCount}`)
  }
  
  const { count: outletsCount, error: outletsError } = await supabase
    .from('outlets')
    .select('*', { count: 'exact', head: true })
  
  if (outletsError) {
    console.error('❌ Error counting outlets:', outletsError)
  } else {
    console.log(`✅ Total outlets in database: ${outletsCount}`)
  }
  
  // Show sample data
  const { data: sampleData, error: sampleError } = await supabase
    .from('serp_entries')
    .select('*')
    .limit(3)
  
  if (!sampleError && sampleData && sampleData.length > 0) {
    console.log('\n📝 Sample data:')
    sampleData.forEach((entry: any, i: number) => {
      console.log(`${i + 1}. ${entry.query} - ${entry.outlet} (Rank: ${entry.rank})`)
    })
  }
}

async function main() {
  console.log('🚀 Starting Supabase Migration')
  console.log('================================\n')
  
  try {
    // Find the Excel file
    const excelPath = path.join(process.cwd(), 'data', 'Visibility_Table.xlsx')
    
    if (!fs.existsSync(excelPath)) {
      throw new Error(`Excel file not found: ${excelPath}`)
    }
    
    // Parse Excel file
    const rawData = await parseExcelFile(excelPath)
    
    // Normalize data
    const normalizedData = normalizeData(rawData)
    console.log(`✅ Normalized ${normalizedData.length} valid entries\n`)
    
    if (normalizedData.length === 0) {
      throw new Error('No valid data to upload')
    }
    
    // Upload to Supabase
    await uploadToSupabase(normalizedData)
    
    // Create outlets table
    await createOutletsTable(normalizedData)
    
    // Verify upload
    await verifyUpload()
    
    console.log('\n✅ Migration completed successfully!')
    console.log('================================')
    console.log('\n📋 Next steps:')
    console.log('1. Run the schema.sql in your Supabase SQL Editor if you haven\'t already')
    console.log('2. Restart your Next.js dev server: npm run dev')
    console.log('3. The app will now load data from Supabase!')
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  }
}

// Run migration
main()


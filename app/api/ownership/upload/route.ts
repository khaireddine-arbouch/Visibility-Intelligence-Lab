import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Bloomberg CSV parser
async function parseBloombergCSV(fileContent: string) {
  const lines = fileContent.split('\n')
  
  // Extract metadata from header
  let ticker = 'UNKNOWN'
  let companyName = 'Unknown Company'
  
  // Find ticker and company name in first 12 lines
  for (let i = 0; i < Math.min(12, lines.length); i++) {
    const line = lines[i]
    if (line.includes('Ticker')) {
      const match = line.match(/Ticker;;([^;]+)/)
      if (match) ticker = match[1].trim().split(' ')[0]
    }
    if (line.includes('Name')) {
      const match = line.match(/Name;;([^;]+)/)
      if (match) companyName = match[1].trim()
    }
  }
  
  // Parse data rows (skip header rows)
  const dataLines = lines.slice(12).filter(line => line.trim() && !line.match(/^;+$/))
  
  if (dataLines.length === 0) {
    throw new Error('No data found in CSV file')
  }
  
  // Get column headers
  const headerLine = lines[12]
  const headers = headerLine.split(';').map(h => h.trim())
  
  const holders: any[] = []
  const portfolios: any[] = []
  const holderMap = new Map<string, any>()
  
  // Parse each data row
  for (const line of dataLines.slice(1)) { // Skip header row
    if (!line.trim()) continue
    
    const values = line.split(';').map(v => v.trim())
    
    // Extract holder name from column 2 or "Holder Name" column
    const holderNameFromCol = values[2] || values[headers.indexOf('Holder Name')]
    if (!holderNameFromCol || holderNameFromCol === '-' || holderNameFromCol === 'nan') continue
    
    const holderName = holderNameFromCol
    const portfolioName = values[headers.indexOf('Portfolio Name')] || ''
    const treeLevel = parseInt(values[headers.indexOf('Tree Level')] || '0')
    
    // Parse numeric values - handle both US and European formats
    const parseNumeric = (val: string, isPercentage: boolean = false) => {
      if (!val || val === '-' || val === 'nan' || val === '') return 0
      
      // Remove any percentage signs
      let cleanVal = val.replace(/%/g, '').trim()
      
      // Detect format:
      // European: 1.234,56 (. for thousands, , for decimal)
      // US: 1,234.56 (. for decimal, , for thousands)
      const hasComma = cleanVal.includes(',')
      const hasDot = cleanVal.includes('.')
      
      if (hasComma && hasDot) {
        // Both present - check which comes last (that's the decimal separator)
        const lastComma = cleanVal.lastIndexOf(',')
        const lastDot = cleanVal.lastIndexOf('.')
        
        if (lastComma > lastDot) {
          // European format: 1.234,56
          cleanVal = cleanVal.replace(/\./g, '').replace(',', '.')
        } else {
          // US format: 1,234.56
          cleanVal = cleanVal.replace(/,/g, '')
        }
      } else if (hasComma && !hasDot) {
        // Only comma - check if it's a decimal separator (e.g., "6,39" = 6.39)
        // If there are exactly 2 digits after comma, treat as decimal
        const parts = cleanVal.split(',')
        if (parts.length === 2 && parts[1].length <= 2) {
          // European decimal: 6,39 -> 6.39
          cleanVal = cleanVal.replace(',', '.')
        } else {
          // US thousands separator: 1,234 -> 1234
          cleanVal = cleanVal.replace(/,/g, '')
        }
      }
      // If only dot, it's already in standard format
      
      const parsed = parseFloat(cleanVal)
      if (isNaN(parsed)) return 0
      
      // For percentages, ensure reasonable bounds (max 100% for any single holder)
      if (isPercentage) {
        return Math.min(Math.max(0, parsed), 100)
      }
      
      return parsed
    }
    
    const position = parseNumeric(values[headers.indexOf('Position')], false)
    const percentOut = parseNumeric(values[headers.indexOf('% Out')], true)
    const percentPortfolio = parseNumeric(values[headers.indexOf('% Portfolio')], true)
    const latestChange = parseNumeric(values[headers.indexOf('Latest Chg')], false)
    
    // Parse date (DD.MM.YYYY)
    const filingDateStr = values[headers.indexOf('Filing Date')] || ''
    let filingDate = null
    if (filingDateStr && filingDateStr !== '-') {
      try {
        const [day, month, year] = filingDateStr.split('.')
        filingDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
      } catch (e) {
        // Invalid date format
      }
    }
    
    const institutionType = values[headers.indexOf('Institution Type')] || null
    const country = values[headers.indexOf('Country')] || null
    const metroArea = values[headers.indexOf('Metro Area')] || null
    const insiderStatus = values[headers.indexOf('Insider Status')] || null
    const source = values[headers.indexOf('Source')] || null
    
    // Top-level holders (Tree Level 0-1)
    if (treeLevel <= 1) {
      if (!holderMap.has(holderName)) {
        const holder = {
          holder_name: holderName,
          ticker,
          total_position: position,
          total_percent_out: percentOut, // Already capped at 100% by parseNumeric
          latest_change: latestChange,
          institution_type: institutionType,
          country,
          metro_area: metroArea,
          insider_status: insiderStatus,
          tree_level: treeLevel
        }
        holders.push(holder)
        holderMap.set(holderName, holder)
      } else {
        // Aggregate: use max percentage instead of summing
        const existing = holderMap.get(holderName)
        existing.total_position += position
        existing.total_percent_out = Math.max(existing.total_percent_out, percentOut)
        existing.latest_change += latestChange
      }
    }
    
    // Portfolios (Tree Level 2+)
    if (treeLevel >= 2 && portfolioName && portfolioName !== '-' && portfolioName !== '--') {
      portfolios.push({
        holder_name: holderName,
        portfolio_name: portfolioName,
        position,
        percent_out: percentOut, // Already capped at 100% by parseNumeric
        percent_portfolio: percentPortfolio || null,
        latest_change: latestChange,
        filing_date: filingDate,
        source,
        tree_level: treeLevel
      })
    }
  }
  
  return {
    ticker,
    companyName,
    holders,
    portfolios
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }
    
    // Read file content
    const fileContent = await file.text()
    
    // Parse CSV
    const { ticker, companyName, holders, portfolios } = await parseBloombergCSV(fileContent)
    
    // Validate data
    const validationWarnings: string[] = []
    if (holders.length === 0) {
      validationWarnings.push('No holders found in CSV')
    }
    if (portfolios.length === 0) {
      validationWarnings.push('No portfolios found in CSV')
    }
    
    // Insert into Supabase
    const supabase = await createClient()
    
    let holdersInserted = 0
    let portfoliosInserted = 0
    let errors = 0
    
    const holderIdMap = new Map<string, number>()
    
    // Insert holders
    for (const holder of holders) {
      try {
        // Check if holder exists
        const { data: existing } = await supabase
          .from('ownership_holders')
          .select('id')
          .eq('holder_name', holder.holder_name)
          .eq('ticker', holder.ticker)
          .single()
        
        if (existing) {
          // Update existing
          const { error: updateError } = await supabase
            .from('ownership_holders')
            .update(holder)
            .eq('id', existing.id)
          
          if (updateError) throw updateError
          holderIdMap.set(holder.holder_name, existing.id)
        } else {
          // Insert new
          const { data, error } = await supabase
            .from('ownership_holders')
            .insert(holder)
            .select('id')
            .single()
          
          if (error) throw error
          if (data) {
            holderIdMap.set(holder.holder_name, data.id)
            holdersInserted++
          }
        }
      } catch (error) {
        console.error('Error inserting holder:', error)
        errors++
      }
    }
    
    // Insert portfolios
    for (const portfolio of portfolios) {
      try {
        // Find holder_id
        let holderId = holderIdMap.get(portfolio.holder_name)
        
        if (!holderId) {
          // Try to find by partial match
          for (const [holderName, id] of holderIdMap.entries()) {
            if (holderName.includes(portfolio.holder_name) || portfolio.holder_name.includes(holderName)) {
              holderId = id
              break
            }
          }
        }
        
        if (!holderId) {
          validationWarnings.push(`Could not find holder for portfolio: ${portfolio.portfolio_name}`)
          continue
        }
        
        // Values are already sanitized by parseNumeric
        const portfolioData = {
          holder_id: holderId,
          portfolio_name: portfolio.portfolio_name,
          position: Math.round(portfolio.position) || 0,
          percent_out: Math.round(portfolio.percent_out * 100) / 100, // Round to 2 decimal places
          percent_portfolio: portfolio.percent_portfolio != null 
            ? Math.round(portfolio.percent_portfolio * 100) / 100 
            : null,
          latest_change: Math.round(portfolio.latest_change) || 0,
          filing_date: portfolio.filing_date || null,
          source: portfolio.source || null,
          tree_level: portfolio.tree_level || 0,
          parent_holder_id: null
        }
        
        const { error } = await supabase
          .from('ownership_portfolios')
          .insert(portfolioData)
        
        if (error) {
          console.error('Error inserting portfolio:', {
            portfolio_name: portfolio.portfolio_name,
            holder_id: holderId,
            error: error.message || error,
            portfolioData
          })
          throw error
        }
        portfoliosInserted++
      } catch (error) {
        console.error('Error inserting portfolio:', {
          portfolio_name: portfolio.portfolio_name,
          holder_name: portfolio.holder_name,
          error: error instanceof Error ? error.message : String(error)
        })
        errors++
      }
    }
    
    // Refresh materialized view
    try {
      await supabase.rpc('refresh_ownership_summary')
    } catch (error) {
      console.warn('Could not refresh materialized view:', error)
    }
    
    return NextResponse.json({
      success: true,
      ticker,
      companyName,
      holdersCount: holders.length,
      portfoliosCount: portfolios.length,
      holdersInserted,
      portfoliosInserted,
      errors,
      validationWarnings
    })
    
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process file',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}


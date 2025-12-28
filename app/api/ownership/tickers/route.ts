import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get unique tickers with company names from summary view
    const { data, error } = await supabase
      .from('ownership_summary')
      .select('ticker, company_name')
      .order('ticker')
    
    if (error) {
      // Fallback: get from holders table if summary doesn't exist
      const { data: holdersData, error: holdersError } = await supabase
        .from('ownership_holders')
        .select('ticker')
        .order('ticker')
      
      if (holdersError) {
        throw holdersError
      }
      
      // Get unique tickers
      const uniqueTickers = Array.from(new Set(holdersData?.map(d => d.ticker) || []))
      return NextResponse.json(
        uniqueTickers.map(ticker => ({ ticker, company_name: ticker }))
      )
    }
    
    return NextResponse.json(data || [])
    
  } catch (error) {
    console.error('Error fetching tickers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tickers' },
      { status: 500 }
    )
  }
}


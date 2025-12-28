"use client"

import { useState, useEffect } from "react"
import { TrendingUp, TrendingDown, Building2, Globe, PieChart, BarChart3, Users, Briefcase } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { createClient } from "@/lib/supabase/client"

interface OwnershipHolder {
  id: number
  holder_name: string
  ticker: string
  total_position: number
  total_percent_out: number
  latest_change: number
  institution_type: string | null
  country: string | null
  metro_area: string | null
  insider_status: string | null
  tree_level: number
}

interface OwnershipPortfolio {
  id: number
  holder_id: number
  portfolio_name: string
  position: number
  percent_out: number
  percent_portfolio: number | null
  latest_change: number
  filing_date: string | null
  source: string | null
  tree_level: number
}

interface OwnershipSummary {
  ticker: string
  total_holders: number
  total_shares: number
  total_percent_out: number
  avg_holder_percent: number
  total_portfolios: number
  countries_represented: number
  institution_types: number
  last_updated: string
}

export function OwnershipPanel() {
  const [summary, setSummary] = useState<OwnershipSummary | null>(null)
  const [holders, setHolders] = useState<OwnershipHolder[]>([])
  const [portfolios, setPortfolios] = useState<OwnershipPortfolio[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedHolder, setSelectedHolder] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [availableTickers, setAvailableTickers] = useState<Array<{ ticker: string }>>([])
  const [currentTicker, setCurrentTicker] = useState("WBD")

  useEffect(() => {
    loadAvailableTickers()
  }, [])

  useEffect(() => {
    if (currentTicker) {
      loadOwnershipData(currentTicker)
    }
  }, [currentTicker])

  const loadAvailableTickers = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('ownership_holders')
        .select('ticker')
        .order('ticker')
      
      if (error) {
        console.error('Error loading tickers:', error)
        return
      }

      // Get unique tickers
      const uniqueTickers = Array.from(new Set(data?.map(d => d.ticker) || []))
      setAvailableTickers(uniqueTickers.map(t => ({ ticker: t })))
      
      // Set first ticker as current if available and no current ticker
      if (uniqueTickers.length > 0 && !currentTicker) {
        setCurrentTicker(uniqueTickers[0])
      }
    } catch (error) {
      console.error('Error loading available tickers:', error)
    }
  }

  const loadOwnershipData = async (ticker: string) => {
    setLoading(true)
    setSelectedHolder(null)
    setPortfolios([])
    
    try {
      const supabase = createClient()
      
      // Load top holders first (needed for summary calculation)
      const { data: holdersData } = await supabase
        .from('ownership_holders')
        .select('*')
        .eq('ticker', ticker)
        .order('total_position', { ascending: false })
        .limit(50)
      
      if (holdersData) {
        setHolders(holdersData as OwnershipHolder[])
      }

      // Load summary (try materialized view first, fallback to calculation)
      const { data: summaryData, error: summaryError } = await supabase
        .from('ownership_summary')
        .select('*')
        .eq('ticker', ticker)
        .single()
      
      if (summaryData && !summaryError) {
        setSummary(summaryData as any)
      } else if (holdersData && holdersData.length > 0) {
        // Fallback: calculate summary from holders if materialized view doesn't exist
        const { count: portfolioCount } = await supabase
          .from('ownership_portfolios')
          .select('*', { count: 'exact', head: true })
        
        const totalShares = holdersData.reduce((sum, h) => sum + (h.total_position || 0), 0)
        const totalPercent = holdersData.reduce((sum, h) => sum + (h.total_percent_out || 0), 0)
        const countries = new Set(holdersData.map(h => h.country).filter(Boolean))
        const instTypes = new Set(holdersData.map(h => h.institution_type).filter(Boolean))
        
        setSummary({
          ticker,
          total_holders: holdersData.length,
          total_shares: totalShares,
          total_percent_out: totalPercent,
          avg_holder_percent: totalPercent / holdersData.length,
          total_portfolios: portfolioCount || 0,
          countries_represented: countries.size,
          institution_types: instTypes.size,
          last_updated: new Date().toISOString()
        })
      }

      setLoading(false)
    } catch (error) {
      console.error('Error loading ownership data:', error)
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedHolder) {
      loadPortfoliosForHolder(selectedHolder)
    } else {
      setPortfolios([])
    }
  }, [selectedHolder])

  const loadPortfoliosForHolder = async (holderId: number) => {
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('ownership_portfolios')
        .select('*')
        .eq('holder_id', holderId)
        .order('position', { ascending: false })
      
      if (data) {
        setPortfolios(data as OwnershipPortfolio[])
      }
    } catch (error) {
      console.error('Error loading portfolios:', error)
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`
    return num.toString()
  }

  const topHolders = holders.slice(0, 20)
  const countries = Array.from(new Set(holders.map(h => h.country).filter(Boolean)))
  const institutionTypes = Array.from(new Set(holders.map(h => h.institution_type).filter(Boolean)))

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-32 bg-muted rounded" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Ticker Selector */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Ownership Dashboard</h1>
        <div className="flex items-center gap-2">
          <select
            value={currentTicker}
            onChange={(e) => setCurrentTicker(e.target.value)}
            className="flex h-10 w-[280px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {availableTickers.length === 0 ? (
              <option value="">No companies available</option>
            ) : (
              availableTickers.map(({ ticker }) => (
                <option key={ticker} value={ticker}>
                  {ticker}
                </option>
              ))
            )}
          </select>
          <button
            onClick={loadAvailableTickers}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
            title="Refresh ticker list"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 2v6h-6" />
              <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
              <path d="M3 22v-6h6" />
              <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Ticker Header */}
      <div className="border-b border-border pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Warner Bros Discovery Inc</h1>
            <div className="flex items-center gap-3 mt-2">
              <Badge variant="outline" className="text-lg font-mono px-3 py-1">
                WBD
              </Badge>
              <span className="text-sm text-muted-foreground font-mono">US EQUITY</span>
            </div>
          </div>
          {summary && (
            <div className="text-right">
              <div className="text-2xl font-bold">{summary.total_percent_out.toFixed(2)}%</div>
              <div className="text-sm text-muted-foreground">of Outstanding Shares</div>
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Holders</CardDescription>
              <CardTitle className="text-2xl">{summary.total_holders}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>Institutional investors</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Shares</CardDescription>
              <CardTitle className="text-2xl">{formatNumber(summary.total_shares)}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <PieChart className="h-4 w-4" />
                <span>{summary.total_percent_out.toFixed(2)}% outstanding</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Portfolios</CardDescription>
              <CardTitle className="text-2xl">{summary.total_portfolios}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Briefcase className="h-4 w-4" />
                <span>Funds & ETFs</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Countries</CardDescription>
              <CardTitle className="text-2xl">{summary.countries_represented}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Globe className="h-4 w-4" />
                <span>Geographic diversity</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="holders">Top Holders</TabsTrigger>
          <TabsTrigger value="geography">Geography</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top 10 Holders */}
            <Card>
              <CardHeader>
                <CardTitle>Top 10 Shareholders</CardTitle>
                <CardDescription>By position size</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {topHolders.slice(0, 10).map((holder, idx) => (
                      <div
                        key={holder.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => setSelectedHolder(holder.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded bg-signal-blue/10 text-signal-blue font-semibold text-sm">
                            {idx + 1}
                          </div>
                          <div>
                            <div className="font-medium">{holder.holder_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {holder.institution_type || 'Unknown'}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{holder.total_percent_out.toFixed(2)}%</div>
                          <div className="text-sm text-muted-foreground">
                            {formatNumber(holder.total_position)} shares
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Institution Types */}
            <Card>
              <CardHeader>
                <CardTitle>Institution Types</CardTitle>
                <CardDescription>Distribution by type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {institutionTypes.slice(0, 8).map((type) => {
                    const typeHolders = holders.filter(h => h.institution_type === type)
                    const totalPercent = typeHolders.reduce((sum, h) => sum + h.total_percent_out, 0)
                    const count = typeHolders.length
                    
                    return (
                      <div key={type} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{type}</span>
                          <span className="text-muted-foreground">{count} holders</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-signal-blue h-2 rounded-full transition-all"
                            style={{ width: `${(totalPercent / (summary?.total_percent_out || 100)) * 100}%` }}
                          />
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {totalPercent.toFixed(2)}% of outstanding shares
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="holders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Shareholders</CardTitle>
              <CardDescription>Complete list of institutional holders</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rank</TableHead>
                      <TableHead>Holder Name</TableHead>
                      <TableHead>Institution Type</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead className="text-right">Position</TableHead>
                      <TableHead className="text-right">% Out</TableHead>
                      <TableHead className="text-right">Change</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {holders.map((holder, idx) => (
                      <TableRow
                        key={holder.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => {
                          setSelectedHolder(holder.id)
                          setActiveTab("portfolios")
                        }}
                      >
                        <TableCell className="font-medium">{idx + 1}</TableCell>
                        <TableCell className="font-medium">{holder.holder_name}</TableCell>
                        <TableCell>{holder.institution_type || '-'}</TableCell>
                        <TableCell>{holder.country || '-'}</TableCell>
                        <TableCell className="text-right font-mono">
                          {formatNumber(holder.total_position)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {holder.total_percent_out.toFixed(2)}%
                        </TableCell>
                        <TableCell className="text-right">
                          {holder.latest_change !== 0 && (
                            <div className={`flex items-center justify-end gap-1 ${
                              holder.latest_change > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {holder.latest_change > 0 ? (
                                <TrendingUp className="h-4 w-4" />
                              ) : (
                                <TrendingDown className="h-4 w-4" />
                              )}
                              <span className="font-mono">
                                {holder.latest_change > 0 ? '+' : ''}
                                {formatNumber(holder.latest_change)}
                              </span>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="geography" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Geographic Distribution</CardTitle>
                <CardDescription>Holders by country</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {countries.slice(0, 15).map((country) => {
                    const countryHolders = holders.filter(h => h.country === country)
                    const totalPercent = countryHolders.reduce((sum, h) => sum + h.total_percent_out, 0)
                    const count = countryHolders.length
                    
                    return (
                      <div key={country} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{country}</span>
                          <span className="text-muted-foreground">{count} holders</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-signal-blue h-2 rounded-full transition-all"
                            style={{ width: `${(totalPercent / (summary?.total_percent_out || 100)) * 100}%` }}
                          />
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {totalPercent.toFixed(2)}% of outstanding shares
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Metro Areas</CardTitle>
                <CardDescription>Top metropolitan areas</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {Array.from(new Set(holders.map(h => h.metro_area).filter(Boolean)))
                      .slice(0, 20)
                      .map((metro) => {
                        const metroHolders = holders.filter(h => h.metro_area === metro)
                        const totalPercent = metroHolders.reduce((sum, h) => sum + h.total_percent_out, 0)
                        
                        return (
                          <div
                            key={metro}
                            className="flex items-center justify-between p-2 rounded border border-border"
                          >
                            <div>
                              <div className="font-medium text-sm">{metro}</div>
                              <div className="text-xs text-muted-foreground">
                                {metroHolders.length} holder{metroHolders.length !== 1 ? 's' : ''}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-sm">{totalPercent.toFixed(2)}%</div>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Portfolio Details Modal/View */}
      {selectedHolder && portfolios.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              Portfolios for {holders.find(h => h.id === selectedHolder)?.holder_name}
            </CardTitle>
            <CardDescription>Individual funds and portfolios</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Portfolio Name</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="text-right">Position</TableHead>
                    <TableHead className="text-right">% Out</TableHead>
                    <TableHead className="text-right">% Portfolio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {portfolios.map((portfolio) => (
                    <TableRow key={portfolio.id}>
                      <TableCell className="font-medium">{portfolio.portfolio_name}</TableCell>
                      <TableCell>{portfolio.source || '-'}</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatNumber(portfolio.position)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {portfolio.percent_out.toFixed(2)}%
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {portfolio.percent_portfolio ? `${portfolio.percent_portfolio.toFixed(2)}%` : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  )
}


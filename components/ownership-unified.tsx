"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { Upload, CheckCircle, XCircle, Loader2, AlertCircle, FileText, Database, TrendingUp, TrendingDown, Building2, Search, X, Filter } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { MultiSelect } from "@/components/ui/multi-select"

type LogEntry = {
  id: string
  timestamp: Date
  level: 'info' | 'success' | 'warning' | 'error'
  message: string
}

type UploadStatus = 'idle' | 'uploading' | 'parsing' | 'validating' | 'inserting' | 'complete' | 'error'

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

export function OwnershipUnified() {
  // Upload state
  const [file, setFile] = useState<File | null>(null)
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [uploadStats, setUploadStats] = useState<{
    holdersFound: number
    portfoliosFound: number
    holdersInserted: number
    portfoliosInserted: number
    errors: number
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const logsEndRef = useRef<HTMLDivElement>(null)

  // Ownership data state
  const [summary, setSummary] = useState<OwnershipSummary | null>(null)
  const [holders, setHolders] = useState<OwnershipHolder[]>([])
  const [portfolios, setPortfolios] = useState<OwnershipPortfolio[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedHolderId, setSelectedHolderId] = useState<number | null>(null)
  const [availableTickers, setAvailableTickers] = useState<Array<{ ticker: string }>>([])
  const [currentTicker, setCurrentTicker] = useState("WBD")
  const [activeTab, setActiveTab] = useState("overview")

  // Filter state
  const [holderSearch, setHolderSearch] = useState("")
  const [portfolioSearch, setPortfolioSearch] = useState("")
  const [countryFilters, setCountryFilters] = useState<string[]>([])
  const [institutionFilters, setInstitutionFilters] = useState<string[]>([])
  const [minPosition, setMinPosition] = useState<number | "">("")
  const [maxPosition, setMaxPosition] = useState<number | "">("")

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

      const uniqueTickers = Array.from(new Set(data?.map(d => d.ticker) || []))
      setAvailableTickers(uniqueTickers.map(t => ({ ticker: t })))
      
      if (uniqueTickers.length > 0 && !currentTicker) {
        setCurrentTicker(uniqueTickers[0])
      }
    } catch (error) {
      console.error('Error loading available tickers:', error)
    }
  }

  const loadOwnershipData = async (ticker: string) => {
    setLoading(true)
    setSelectedHolderId(null)
    setPortfolios([])
    
    try {
      const supabase = createClient()
      
      const { data: holdersData } = await supabase
        .from('ownership_holders')
        .select('*')
        .eq('ticker', ticker)
        .order('total_position', { ascending: false })
        .limit(100)
      
      if (holdersData) {
        setHolders(holdersData as OwnershipHolder[])
      }

      const { data: summaryData, error: summaryError } = await supabase
        .from('ownership_summary')
        .select('*')
        .eq('ticker', ticker)
        .single()
      
      if (summaryData && !summaryError) {
        setSummary(summaryData as any)
      } else if (holdersData && holdersData.length > 0) {
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

  const handleHolderClick = (holderId: number) => {
    if (selectedHolderId === holderId) {
      setSelectedHolderId(null)
      setPortfolios([])
    } else {
      setSelectedHolderId(holderId)
      loadPortfoliosForHolder(holderId)
    }
  }

  const addLog = useCallback((level: LogEntry['level'], message: string) => {
    const newLog: LogEntry = {
      id: Date.now().toString() + Math.random(),
      timestamp: new Date(),
      level,
      message
    }
    setLogs(prev => [...prev, newLog])
    setTimeout(() => logsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        addLog('error', 'Please select a valid CSV file')
        return
      }
      setFile(selectedFile)
      setLogs([])
      setUploadStats(null)
      setProgress(0)
      setUploadStatus('idle')
      addLog('info', `File selected: ${selectedFile.name} (${(selectedFile.size / 1024).toFixed(2)} KB)`)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setUploadStatus('uploading')
    setProgress(10)
    addLog('info', 'Starting upload process...')

    try {
      const formData = new FormData()
      formData.append('file', file)

      setProgress(20)
      addLog('info', 'Transmitting data to server...')

      const response = await fetch('/api/ownership/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`)
      }

      setUploadStatus('parsing')
      setProgress(40)
      addLog('success', 'Upload successful')
      addLog('info', 'Parsing Bloomberg CSV format...')

      const result = await response.json()

      setProgress(60)
      addLog('success', `Parsed ${result.holdersCount} holders and ${result.portfoliosCount} portfolios`)
      
      setUploadStatus('validating')
      addLog('info', 'Validating data integrity...')
      setProgress(70)
      
      if (result.validationWarnings?.length > 0) {
        result.validationWarnings.forEach((warning: string) => {
          addLog('warning', warning)
        })
      }

      setUploadStatus('inserting')
      setProgress(80)
      addLog('info', 'Inserting data into database...')

      await new Promise(resolve => setTimeout(resolve, 500))

      setProgress(100)
      setUploadStatus('complete')
      addLog('success', 'Mission complete! All data successfully inserted.')
      addLog('info', `Company: ${result.companyName} (${result.ticker})`)
      
      setUploadStats({
        holdersFound: result.holdersCount,
        portfoliosFound: result.portfoliosCount,
        holdersInserted: result.holdersInserted,
        portfoliosInserted: result.portfoliosInserted,
        errors: result.errors || 0
      })

      // Refresh ticker list and load new data
      await loadAvailableTickers()
      setCurrentTicker(result.ticker)

    } catch (error) {
      setUploadStatus('error')
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      addLog('error', `Mission failed: ${errorMessage}`)
      setUploadStats({
        holdersFound: 0,
        portfoliosFound: 0,
        holdersInserted: 0,
        portfoliosInserted: 0,
        errors: 1
      })
    }
  }

  const handleReset = () => {
    setFile(null)
    setUploadStatus('idle')
    setProgress(0)
    setLogs([])
    setUploadStats(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Filtered data with useMemo
  const filteredHolders = useMemo(() => {
    let filtered = holders

    if (holderSearch) {
      filtered = filtered.filter(h => 
        h.holder_name.toLowerCase().includes(holderSearch.toLowerCase())
      )
    }

    if (countryFilters.length > 0) {
      filtered = filtered.filter(h => h.country && countryFilters.includes(h.country))
    }

    if (institutionFilters.length > 0) {
      filtered = filtered.filter(h => h.institution_type && institutionFilters.includes(h.institution_type))
    }

    if (minPosition !== "") {
      filtered = filtered.filter(h => h.total_position >= minPosition)
    }

    if (maxPosition !== "") {
      filtered = filtered.filter(h => h.total_position <= maxPosition)
    }

    return filtered
  }, [holders, holderSearch, countryFilters, institutionFilters, minPosition, maxPosition])

  const filteredPortfolios = useMemo(() => {
    if (!portfolioSearch) return portfolios
    return portfolios.filter(p => 
      p.portfolio_name.toLowerCase().includes(portfolioSearch.toLowerCase())
    )
  }, [portfolios, portfolioSearch])

  const uniqueCountries = useMemo(() => 
    Array.from(new Set(holders.map(h => h.country).filter(Boolean))).sort()
  , [holders])

  const uniqueInstitutions = useMemo(() => 
    Array.from(new Set(holders.map(h => h.institution_type).filter(Boolean))).sort()
  , [holders])

  const formatNumber = (num: number | null | undefined) => {
    if (num === null || num === undefined) return "N/A"
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`
    return num.toLocaleString()
  }

  const getChangeColor = (change: number | null | undefined) => {
    if (change === null || change === undefined || change === 0) return "text-muted-foreground"
    return change > 0 ? "text-signal-blue" : "text-signal-red"
  }

  const getChangeIcon = (change: number | null | undefined) => {
    if (change === null || change === undefined || change === 0) return null
    return change > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />
  }

  const getLogIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-signal-blue" />
      case 'error':
        return <XCircle className="h-4 w-4 text-signal-red" />
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-signal-amber" />
      default:
        return <Database className="h-4 w-4 text-muted-foreground" />
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header with ticker selector */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">Ownership Intelligence</h1>
          <p className="text-sm text-muted-foreground mt-1 font-mono">
            Upload & analyze institutional ownership data
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={currentTicker}
            onChange={(e) => setCurrentTicker(e.target.value)}
            style={{ fontFamily: 'var(--font-mono)' }}
            className="flex h-9 rounded-none border border-border bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
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
          <Button
            variant="outline"
            size="sm"
            onClick={loadAvailableTickers}
            className="font-mono"
          >
            Refresh
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="font-mono">Overview</TabsTrigger>
          <TabsTrigger value="holders" className="font-mono">Holders ({filteredHolders.length})</TabsTrigger>
          <TabsTrigger value="upload" className="font-mono">Upload Data</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          {loading ? (
            <div className="space-y-4">
              <div className="h-32 bg-muted/50 animate-pulse" />
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-24 bg-muted/50 animate-pulse" />
                ))}
              </div>
            </div>
          ) : summary ? (
            <>
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    {summary.ticker}
                  </CardTitle>
                  <CardDescription className="font-mono">
                    Total Holders: {summary.total_holders} | Total Shares: {formatNumber(summary.total_shares)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-mono">Total % Outstanding</p>
                    <p className="text-2xl font-mono">{summary.total_percent_out.toFixed(2)}%</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-mono">Countries</p>
                    <p className="text-2xl font-mono">{summary.countries_represented}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-mono">Institution Types</p>
                    <p className="text-2xl font-mono">{summary.institution_types}</p>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-muted-foreground">Avg Holder %</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-mono">{summary.avg_holder_percent.toFixed(2)}%</div>
                  </CardContent>
                </Card>
                <Card className="border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-muted-foreground">Total Portfolios</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-mono">{summary.total_portfolios}</div>
                  </CardContent>
                </Card>
                <Card className="border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-muted-foreground">Last Updated</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm font-mono">{new Date(summary.last_updated).toLocaleDateString()}</div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No data available</AlertTitle>
                  <AlertDescription className="font-mono">
                    Upload ownership data or select a different ticker.
                  </AlertDescription>
                </Alert>
          )}
        </TabsContent>

        <TabsContent value="holders" className="mt-4 space-y-4">
          {/* Filters */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search holders..."
                  value={holderSearch}
                  onChange={(e) => setHolderSearch(e.target.value)}
                  className="pl-8 font-mono"
                />
              </div>
              <MultiSelect
                options={uniqueCountries.filter((c): c is string => c !== null)}
                value={countryFilters}
                onChange={setCountryFilters}
                placeholder="Select Countries"
                className="min-w-[200px]"
              />
              <MultiSelect
                options={uniqueInstitutions.filter((i): i is string => i !== null)}
                value={institutionFilters}
                onChange={setInstitutionFilters}
                placeholder="Select Institution Types"
                className="min-w-[200px]"
              />
              <Input
                type="number"
                placeholder="Min Position"
                value={minPosition}
                onChange={(e) => setMinPosition(e.target.value === "" ? "" : Number(e.target.value))}
                className="font-mono"
              />
              <Input
                type="number"
                placeholder="Max Position"
                value={maxPosition}
                onChange={(e) => setMaxPosition(e.target.value === "" ? "" : Number(e.target.value))}
                className="font-mono"
              />
            </CardContent>
          </Card>

          {/* Holders Table */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Top Holders</CardTitle>
              <CardDescription className="font-mono">
                Showing {filteredHolders.length} of {holders.length} holders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-mono">#</TableHead>
                      <TableHead className="font-mono">Holder Name</TableHead>
                      <TableHead className="font-mono">Position</TableHead>
                      <TableHead className="font-mono">% Out</TableHead>
                      <TableHead className="font-mono">Change</TableHead>
                      <TableHead className="font-mono">Type</TableHead>
                      <TableHead className="font-mono">Country</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHolders.map((holder, index) => (
                      <TableRow
                        key={holder.id}
                        onClick={() => handleHolderClick(holder.id!)}
                        className={cn(
                          "cursor-pointer hover:bg-muted/50",
                          selectedHolderId === holder.id && "bg-muted"
                        )}
                      >
                        <TableCell className="font-mono text-muted-foreground">{index + 1}</TableCell>
                        <TableCell className="font-mono">{holder.holder_name}</TableCell>
                        <TableCell className="font-mono">{formatNumber(holder.total_position)}</TableCell>
                        <TableCell className="font-mono">{holder.total_percent_out?.toFixed(2)}%</TableCell>
                        <TableCell className={cn("font-mono flex items-center gap-1", getChangeColor(holder.latest_change))}>
                          {getChangeIcon(holder.latest_change)} {formatNumber(holder.latest_change)}
                        </TableCell>
                        <TableCell className="font-mono text-muted-foreground">{holder.institution_type || 'N/A'}</TableCell>
                        <TableCell className="font-mono text-muted-foreground">{holder.country || 'N/A'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Portfolios Table */}
          {selectedHolderId && (
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Portfolios</span>
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search portfolios..."
                      value={portfolioSearch}
                      onChange={(e) => setPortfolioSearch(e.target.value)}
                      className="pl-8 font-mono"
                    />
                  </div>
                </CardTitle>
                <CardDescription className="font-mono">
                  Showing {filteredPortfolios.length} portfolios
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-mono">#</TableHead>
                        <TableHead className="font-mono">Portfolio Name</TableHead>
                        <TableHead className="font-mono">Position</TableHead>
                        <TableHead className="font-mono">% Out</TableHead>
                        <TableHead className="font-mono">% Portfolio</TableHead>
                        <TableHead className="font-mono">Source</TableHead>
                        <TableHead className="font-mono">Filing Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPortfolios.map((portfolio, index) => (
                        <TableRow key={portfolio.id}>
                          <TableCell className="font-mono text-muted-foreground">{index + 1}</TableCell>
                          <TableCell className="font-mono">{portfolio.portfolio_name}</TableCell>
                          <TableCell className="font-mono">{formatNumber(portfolio.position)}</TableCell>
                          <TableCell className="font-mono">{portfolio.percent_out?.toFixed(2)}%</TableCell>
                          <TableCell className="font-mono">{portfolio.percent_portfolio?.toFixed(2) || 'N/A'}%</TableCell>
                          <TableCell className="font-mono text-muted-foreground">{portfolio.source || 'N/A'}</TableCell>
                          <TableCell className="font-mono text-muted-foreground">
                            {portfolio.filing_date ? new Date(portfolio.filing_date).toLocaleDateString() : 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="upload" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Upload Section */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload Bloomberg CSV
                </CardTitle>
                <CardDescription className="font-mono">
                  Select ownership data exported from Bloomberg Terminal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* File Input */}
                <div className="border-2 border-dashed border-border p-8 text-center hover:border-muted-foreground transition-colors">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                    disabled={uploadStatus !== 'idle' && uploadStatus !== 'complete' && uploadStatus !== 'error'}
                  />
                  <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-3">
                    <FileText className="h-12 w-12 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-mono">
                        {file ? file.name : 'Click to select CSV file'}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono mt-1">
                        Bloomberg Ownership Map export format
                      </p>
                    </div>
                  </label>
                </div>

                {/* Progress Bar */}
                {uploadStatus !== 'idle' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm font-mono">
                      <span className="text-muted-foreground">Progress</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}

                {/* Upload Stats */}
                {uploadStats && (
                  <div className="grid grid-cols-2 gap-2 text-sm font-mono">
                    <div className="p-2 border border-border">
                      <p className="text-muted-foreground">Holders</p>
                      <p>{uploadStats.holdersInserted}/{uploadStats.holdersFound}</p>
                    </div>
                    <div className="p-2 border border-border">
                      <p className="text-muted-foreground">Portfolios</p>
                      <p>{uploadStats.portfoliosInserted}/{uploadStats.portfoliosFound}</p>
                    </div>
                    {uploadStats.errors > 0 && (
                      <div className="p-2 border border-signal-red">
                        <p className="text-signal-red">Errors</p>
                        <p className="text-signal-red">{uploadStats.errors}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    onClick={handleUpload}
                    disabled={!file || (uploadStatus !== 'idle' && uploadStatus !== 'error')}
                    className="flex-1 font-mono"
                  >
                    {uploadStatus === 'uploading' || uploadStatus === 'parsing' || uploadStatus === 'validating' || uploadStatus === 'inserting' ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload
                      </>
                    )}
                  </Button>
                  {(uploadStatus === 'complete' || uploadStatus === 'error') && (
                    <Button onClick={handleReset} variant="outline" className="font-mono">
                      Reset
                    </Button>
                  )}
                </div>

                {/* Info Alert */}
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Bloomberg CSV Format</AlertTitle>
                  <AlertDescription className="font-mono text-xs">
                    Export ownership data from Bloomberg Terminal using the "Ownership Map" view.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Mission Logs */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  System Logs
                </CardTitle>
                <CardDescription className="font-mono">
                  Real-time processing status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] border border-border p-4">
                  {logs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                      <Database className="h-12 w-12 mb-3 opacity-50" />
                      <p className="text-sm font-mono">Awaiting upload...</p>
                    </div>
                  ) : (
                    <div className="space-y-2 font-mono text-xs">
                      {logs.map((log) => (
                        <div
                          key={log.id}
                          className={cn(
                            "flex items-start gap-2 p-2",
                            log.level === 'error' && "text-signal-red",
                            log.level === 'success' && "text-signal-blue",
                            log.level === 'warning' && "text-signal-amber"
                          )}
                        >
                          {getLogIcon(log.level)}
                          <div className="flex-1">
                            <span className="text-muted-foreground">
                              [{log.timestamp.toLocaleTimeString()}]
                            </span>
                            <span className="ml-2">{log.message}</span>
                          </div>
                        </div>
                      ))}
                      <div ref={logsEndRef} />
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}


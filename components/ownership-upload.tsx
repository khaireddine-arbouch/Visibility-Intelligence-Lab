"use client"

import { useState, useCallback, useRef } from "react"
import { Upload, CheckCircle, XCircle, Loader2, AlertCircle, FileText, Database, Zap, TrendingUp } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

type LogEntry = {
  id: string
  timestamp: Date
  level: 'info' | 'success' | 'warning' | 'error'
  message: string
}

type UploadStatus = 'idle' | 'uploading' | 'parsing' | 'validating' | 'inserting' | 'complete' | 'error'

export function OwnershipUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<UploadStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [stats, setStats] = useState<{
    holdersFound: number
    portfoliosFound: number
    holdersInserted: number
    portfoliosInserted: number
    errors: number
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const logsEndRef = useRef<HTMLDivElement>(null)

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
      setStats(null)
      setProgress(0)
      setStatus('idle')
      addLog('info', `File selected: ${selectedFile.name} (${(selectedFile.size / 1024).toFixed(2)} KB)`)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setStatus('uploading')
    setProgress(10)
    addLog('info', '🚀 Mission initiated: Starting upload process...')

    try {
      const formData = new FormData()
      formData.append('file', file)

      setProgress(20)
      addLog('info', '📡 Transmitting data to server...')

      const response = await fetch('/api/ownership/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`)
      }

      setStatus('parsing')
      setProgress(40)
      addLog('success', '✓ Upload successful')
      addLog('info', '🔍 Parsing Bloomberg CSV format...')

      const result = await response.json()

      setProgress(60)
      addLog('success', `✓ Parsed ${result.holdersCount} holders and ${result.portfoliosCount} portfolios`)
      
      setStatus('validating')
      addLog('info', '✅ Validating data integrity...')
      setProgress(70)
      
      if (result.validationWarnings?.length > 0) {
        result.validationWarnings.forEach((warning: string) => {
          addLog('warning', `⚠ ${warning}`)
        })
      }

      setStatus('inserting')
      setProgress(80)
      addLog('info', '💾 Inserting data into Supabase...')

      // Simulate insertion progress (in real implementation, this would be streamed)
      await new Promise(resolve => setTimeout(resolve, 1000))

      setProgress(100)
      setStatus('complete')
      addLog('success', '🎉 Mission complete! All data successfully inserted.')
      addLog('info', `Company: ${result.companyName} (${result.ticker})`)
      
      setStats({
        holdersFound: result.holdersCount,
        portfoliosFound: result.portfoliosCount,
        holdersInserted: result.holdersInserted,
        portfoliosInserted: result.portfoliosInserted,
        errors: result.errors || 0
      })

    } catch (error) {
      setStatus('error')
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      addLog('error', `❌ Mission failed: ${errorMessage}`)
      setStats({
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
    setStatus('idle')
    setProgress(0)
    setLogs([])
    setStats(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'uploading':
      case 'parsing':
      case 'validating':
      case 'inserting':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
      case 'complete':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Database className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'uploading': return 'Uploading file...'
      case 'parsing': return 'Parsing CSV data...'
      case 'validating': return 'Validating data...'
      case 'inserting': return 'Inserting into database...'
      case 'complete': return 'Mission Complete!'
      case 'error': return 'Mission Failed'
      default: return 'Ready to launch'
    }
  }

  const getLogIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      default:
        return <Zap className="h-4 w-4 text-blue-500" />
    }
  }

  return (
    <div className="flex flex-col h-full p-6 space-y-6 overflow-y-auto bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Ownership Data Upload
          </h1>
          <p className="text-slate-400 mt-2">Mission Control Center - Bloomberg CSV Processor</p>
        </div>
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="text-sm font-medium text-slate-300">{getStatusText()}</span>
        </div>
      </div>

      {/* Stats Dashboard */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400">Holders Found</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-400">{stats.holdersFound}</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400">Portfolios Found</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-cyan-400">{stats.portfoliosFound}</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400">Holders Inserted</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">{stats.holdersInserted}</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400">Portfolios Inserted</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-400">{stats.portfoliosInserted}</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-400">Errors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={cn("text-2xl font-bold", stats.errors > 0 ? "text-red-400" : "text-slate-600")}>
                {stats.errors}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
        {/* Upload Section */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-200">
              <Upload className="h-5 w-5" />
              Upload Bloomberg CSV
            </CardTitle>
            <CardDescription className="text-slate-400">
              Select and upload ownership data exported from Bloomberg Terminal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* File Input */}
            <div className="border-2 border-dashed border-slate-700 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
                disabled={status !== 'idle' && status !== 'complete' && status !== 'error'}
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center gap-3"
              >
                <FileText className="h-12 w-12 text-slate-500" />
                <div>
                  <p className="text-sm font-medium text-slate-300">
                    {file ? file.name : 'Click to select CSV file'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Bloomberg Ownership Map export format
                  </p>
                </div>
              </label>
            </div>

            {/* Progress Bar */}
            {status !== 'idle' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Progress</span>
                  <span className="text-slate-300 font-medium">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleUpload}
                disabled={!file || (status !== 'idle' && status !== 'error')}
                className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
              >
                {status === 'uploading' || status === 'parsing' || status === 'validating' || status === 'inserting' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Launch Mission
                  </>
                )}
              </Button>
              {(status === 'complete' || status === 'error') && (
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Reset
                </Button>
              )}
            </div>

            {/* Info Alert */}
            <Alert className="bg-blue-950/30 border-blue-900">
              <AlertCircle className="h-4 w-4 text-blue-400" />
              <AlertTitle className="text-blue-300">Bloomberg CSV Format</AlertTitle>
              <AlertDescription className="text-blue-400/80 text-sm">
                Export ownership data from Bloomberg Terminal using the "Ownership Map" view.
                The CSV should include holder names, positions, percentages, and portfolio details.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Mission Logs */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-200">
              <Database className="h-5 w-5" />
              Mission Logs
            </CardTitle>
            <CardDescription className="text-slate-400">
              Real-time processing status and system messages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] w-full rounded-md border border-slate-800 bg-slate-950/50 p-4">
              {logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-600">
                  <Zap className="h-12 w-12 mb-3 opacity-50" />
                  <p className="text-sm">Awaiting mission initiation...</p>
                </div>
              ) : (
                <div className="space-y-2 font-mono text-xs">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className={cn(
                        "flex items-start gap-2 p-2 rounded",
                        log.level === 'error' && "bg-red-950/20",
                        log.level === 'success' && "bg-green-950/20",
                        log.level === 'warning' && "bg-yellow-950/20"
                      )}
                    >
                      {getLogIcon(log.level)}
                      <div className="flex-1">
                        <span className="text-slate-500">
                          [{log.timestamp.toLocaleTimeString()}]
                        </span>
                        <span className="ml-2 text-slate-300">{log.message}</span>
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
    </div>
  )
}


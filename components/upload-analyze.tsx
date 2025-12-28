"use client"

import { useState, useCallback } from "react"
import { Upload, FileText, AlertCircle, Download, Database, CheckCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MetricCard } from "@/components/metric-card"
import { useSupabaseData } from "@/lib/data/supabase-data-context"
import { convertToDataset } from "@/lib/data/dataset-utils"
import { parseCSV, detectColumns, suggestColumnMapping } from "@/lib/data/parsers/csv-parser"
import { parseExcel, detectExcelColumns } from "@/lib/data/parsers/excel-parser"
// import { useToast } from "@/hooks/use-toast"

type DatasetType = "csv" | "excel"

export function UploadAnalyze() {
  const { setLocalDataset, dataset } = useSupabaseData()
  // const { toast } = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [datasetType, setDatasetType] = useState<DatasetType>("csv")
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [availableColumns, setAvailableColumns] = useState<string[]>([])
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({})
  const [showColumnMapping, setShowColumnMapping] = useState(false)

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0]
      if (!selectedFile) return

      setUploadError(null)

      // Validate file type
      const isCSV = selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')
      const isExcel =
        selectedFile.type === 'application/vnd.ms-excel' ||
        selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        selectedFile.name.endsWith('.xlsx') ||
        selectedFile.name.endsWith('.xls')

      if (datasetType === 'csv' && !isCSV) {
        setUploadError('Please select a CSV file')
        return
      }

      if (datasetType === 'excel' && !isExcel) {
        setUploadError('Please select an Excel file (.xlsx or .xls)')
        return
      }

      // Validate file size
      const maxSize = 10 * 1024 * 1024 // 10MB
      if (selectedFile.size > maxSize) {
        setUploadError('File is too large. Maximum size is 10MB')
        return
      }

      setFile(selectedFile)

      // Detect columns
      try {
        const columns =
          datasetType === 'csv' ? await detectColumns(selectedFile) : await detectExcelColumns(selectedFile)

        setAvailableColumns(columns)
        const suggested = suggestColumnMapping(columns)
        setColumnMapping(suggested as Record<string, string>)
        
        // Check if we have all required columns
        const hasAllRequired = suggested.query && suggested.outlet && suggested.rank && suggested.date
        if (!hasAllRequired) {
          setShowColumnMapping(true)
          // toast({
          //   title: "Column mapping required",
          //   description: "Please map the columns to proceed",
          //   variant: "default",
          // })
        }
      } catch (error) {
        console.error('Column detection failed:', error)
      }
    },
    [datasetType]
  )

  const handleProcess = useCallback(async () => {
    if (!file) return

    setIsProcessing(true)
    setUploadError(null)

    try {
      const parseFunction = datasetType === 'csv' ? parseCSV : parseExcel
      const result = await parseFunction(file, {
        autoInferCategory: true,
        columnMapping,
      })

      if (!result.success) {
        setUploadError(result.error || 'Failed to parse file')
        // toast({
        //   title: "Upload failed",
        //   description: result.error,
        //   variant: "destructive",
        // })
        return
      }

      if (result.data) {
        const convertedDataset = convertToDataset(result.data, 'Uploaded Dataset')
        setLocalDataset(convertedDataset)
        // toast({
        //   title: "Dataset loaded successfully",
        //   description: `Processed ${result.data.length} entries`,
        // })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setUploadError(errorMessage)
      // toast({
      //   title: "Processing error",
      //   description: errorMessage,
      //   variant: "destructive",
      // })
    } finally {
      setIsProcessing(false)
    }
  }, [file, datasetType, columnMapping])

  const handleRemoveFile = useCallback(() => {
    setFile(null)
    setUploadError(null)
    setAvailableColumns([])
    setColumnMapping({})
    setShowColumnMapping(false)
  }, [])

  if (dataset) {
    return (
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-signal-blue" />
              Dataset Loaded Successfully
            </h2>
            <p className="text-sm text-muted-foreground mt-1 font-mono">
              {dataset.name} • {dataset.entries} entries • {dataset.dateRange.start} to {dataset.dateRange.end}
            </p>
          </div>
          <Button variant="outline" onClick={handleRemoveFile}>
            Load Different Dataset
          </Button>
        </div>

        {/* Generated Metrics */}
        <div className="grid grid-cols-3 gap-4">
          <MetricCard
            label="Total Queries"
            value={String(dataset.queries.length)}
            description="Unique search terms"
          />
          <MetricCard
            label="Total Outlets"
            value={String(dataset.outlets.length)}
            description="Unique sources detected"
          />
          <MetricCard
            label="Gini Coefficient"
            value={String(dataset.metrics.giniCoefficient)}
            description="Concentration measure"
            critical={dataset.metrics.giniCoefficient > 0.6}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <MetricCard
            label="Anglo-American"
            value={`${dataset.metrics.angloAmericanDominance.toFixed(1)}%`}
            description="Top-3 capture rate"
            critical={dataset.metrics.angloAmericanDominance > 70}
          />
          <MetricCard
            label="Independent Avg Rank"
            value={String(dataset.metrics.avgIndependentRank.toFixed(1))}
            description="Mean position"
            critical={dataset.metrics.avgIndependentRank > 7}
          />
        </div>

        {/* Top Outlets Preview */}
        <div className="border border-border bg-card p-4">
          <h4 className="text-sm font-semibold mb-3">Top Outlets by Appearances</h4>
          <div className="space-y-2">
            {dataset.outlets
              .sort((a, b) => (b.appearances || 0) - (a.appearances || 0))
              .slice(0, 5)
              .map((outlet) => (
                <div key={outlet.name} className="flex justify-between items-center text-sm">
                  <span className="font-mono">{outlet.name}</span>
                  <span className="text-muted-foreground">
                    {outlet.appearances} appearances • Avg rank {outlet.avgRank?.toFixed(1)}
                  </span>
                </div>
              ))}
          </div>
        </div>

        <div className="flex gap-3">
          <Button className="flex-1 gap-2">
            <Database className="h-4 w-4" />
            View Full Analysis
          </Button>
          <Button variant="outline" className="flex-1 gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Upload & Analyze</h2>
        <p className="text-sm text-muted-foreground mt-1 font-mono">
          Load your own visibility data for analysis
        </p>
      </div>

      {/* Dataset Type Selection */}
      <div className="border border-border bg-card p-4">
        <p className="text-sm font-semibold mb-3">Dataset Format</p>
        <div className="flex gap-3">
          <button
            onClick={() => setDatasetType("csv")}
            className={`flex-1 p-4 border rounded transition-all ${
              datasetType === "csv"
                ? "border-signal-blue bg-signal-blue/10 text-signal-blue"
                : "border-border hover:bg-muted/50"
            }`}
          >
            <FileText className="h-5 w-5 mx-auto mb-2" />
            <p className="text-sm font-semibold">CSV File</p>
            <p className="text-xs text-muted-foreground mt-1">Comma-separated values</p>
          </button>
          <button
            onClick={() => setDatasetType("excel")}
            className={`flex-1 p-4 border rounded transition-all ${
              datasetType === "excel"
                ? "border-signal-blue bg-signal-blue/10 text-signal-blue"
                : "border-border hover:bg-muted/50"
            }`}
          >
            <Database className="h-5 w-5 mx-auto mb-2" />
            <p className="text-sm font-semibold">Excel File</p>
            <p className="text-xs text-muted-foreground mt-1">.xlsx or .xls format</p>
          </button>
        </div>
      </div>

      {/* File Upload */}
      {!file ? (
        <div className="border-2 border-dashed border-border bg-card p-12 text-center">
          <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Upload Your Dataset</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
            {datasetType === "csv"
              ? "Upload a CSV file with columns: query, outlet, rank, date"
              : "Upload an Excel file (.xlsx or .xls) with columns: query, outlet, rank, date"}
          </p>
          <input
            type="file"
            accept={datasetType === "csv" ? ".csv" : ".xlsx,.xls"}
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload">
            <Button asChild className="gap-2">
              <span>
                <FileText className="h-4 w-4" />
                Select File
              </span>
            </Button>
          </label>
          <p className="text-xs text-muted-foreground mt-4 font-mono">Max file size: 10 MB</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* File Info */}
          <div className="border border-border bg-card p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-signal-blue" />
              <div>
                <p className="text-sm font-semibold">{file.name}</p>
                <p className="text-xs text-muted-foreground font-mono">
                  {(file.size / 1024).toFixed(1)} KB • {availableColumns.length} columns detected
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleRemoveFile}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Column Mapping */}
          {showColumnMapping && (
            <div className="border border-signal-amber/30 bg-signal-amber/5 p-4">
              <h3 className="text-sm font-semibold mb-3 text-signal-amber">Column Mapping Required</h3>
              <div className="grid grid-cols-2 gap-3">
                {['query', 'outlet', 'rank', 'date'].map((required) => (
                  <div key={required}>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      {required.charAt(0).toUpperCase() + required.slice(1)} *
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-border bg-background text-sm"
                      value={columnMapping[required] || ''}
                      onChange={(e) => setColumnMapping({ ...columnMapping, [required]: e.target.value })}
                    >
                      <option value="">Select column...</option>
                      {availableColumns.map((col) => (
                        <option key={col} value={col}>
                          {col}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error Display */}
          {uploadError && (
            <div className="bg-signal-red/5 border border-signal-red/20 p-4 flex gap-3">
              <AlertCircle className="h-5 w-5 text-signal-red shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-signal-red">Upload Error</p>
                <p className="text-xs text-muted-foreground mt-1">{uploadError}</p>
              </div>
            </div>
          )}

          {/* Process Button */}
          <Button
            onClick={handleProcess}
            disabled={isProcessing || !columnMapping.query || !columnMapping.outlet || !columnMapping.rank || !columnMapping.date}
            className="w-full gap-2"
          >
            {isProcessing ? (
              <>
                <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Process Dataset
              </>
            )}
          </Button>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-signal-blue/5 border border-signal-blue/20 p-4">
        <p className="text-sm font-semibold text-signal-blue mb-2">Required Columns</p>
        <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
          <li><strong>query</strong>: Search term (e.g., "Benin Coup")</li>
          <li><strong>outlet</strong>: Media outlet name (e.g., "CNN")</li>
          <li><strong>rank</strong>: Position in results (1-100)</li>
          <li><strong>date</strong>: Timestamp of crawl</li>
        </ul>
        <p className="text-xs text-muted-foreground mt-3 italic">
          Optional: title, url, category, country
        </p>
      </div>
    </div>
  )
}

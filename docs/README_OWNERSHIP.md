# Ownership Map Integration Guide

This guide explains how to set up and use the Ownership Map feature in the Visibility Intelligence Lab dashboard.

## Overview

The Ownership Map feature displays comprehensive ownership data for Warner Bros Discovery Inc (WBD), including:
- Top shareholders and their positions
- Portfolio-level breakdowns
- Geographic distribution
- Institution type analysis
- Ownership changes tracking

## Setup Steps

### 1. Create Supabase Tables

Run the ownership schema in your Supabase SQL Editor:

```bash
# Copy and paste the contents of:
supabase/ownership_schema.sql
```

This creates:
- `ownership_holders` - Top-level institutional holders
- `ownership_portfolios` - Individual funds and portfolios
- `ownership_summary` - Materialized view with aggregated metrics

### 2. Transform CSV Data

Transform the Ownership_Map.csv file into a format suitable for Supabase:

```bash
cd scripts
python transform_ownership_data.py
```

This will create `data/ownership_transformed.json` with:
- Cleaned and normalized holder data
- Portfolio mappings
- Summary statistics

### 3. Migrate to Supabase

Option A: Using Python script (recommended)
```bash
cd scripts
python migrate_ownership_to_supabase.py
```

Option B: Manual import via Supabase Dashboard
1. Open Supabase Dashboard → Table Editor
2. Import the JSON data or use the SQL insert statements

### 4. Verify Data

Check that data was inserted correctly:

```sql
-- Check holders
SELECT COUNT(*) FROM ownership_holders WHERE ticker = 'WBD';

-- Check portfolios
SELECT COUNT(*) FROM ownership_portfolios;

-- Check summary
SELECT * FROM ownership_summary WHERE ticker = 'WBD';
```

## Using the Ownership Panel

### Accessing the Panel

1. Open the Visibility Intelligence Lab dashboard
2. Click "Ownership Map" in the sidebar (Building2 icon)
3. The panel will load ownership data from Supabase

### Features

#### Ticker Header
- Displays company name: "Warner Bros Discovery Inc"
- Shows ticker symbol: "WBD"
- Total % of outstanding shares

#### Summary Cards
- **Total Holders**: Number of institutional investors
- **Total Shares**: Aggregate share count
- **Total Portfolios**: Number of funds/ETFs
- **Countries**: Geographic diversity

#### Tabs

**Overview Tab:**
- Top 10 shareholders by position
- Institution type distribution with progress bars

**Top Holders Tab:**
- Complete table of all shareholders
- Sortable columns
- Click any row to view portfolios
- Shows position changes (green/red indicators)

**Geography Tab:**
- Country distribution
- Metro area breakdown
- Visual progress bars showing ownership concentration

#### Portfolio Details
- Click any holder to view their portfolios
- Shows individual funds, ETFs, and positions
- Displays % portfolio allocation

## Data Structure

### Ownership Holders Table
```sql
- id: Primary key
- holder_name: Institution name
- ticker: Stock ticker (default: 'WBD')
- total_position: Total shares held
- total_percent_out: % of outstanding shares
- latest_change: Recent position change
- institution_type: Type of institution
- country: Country location
- metro_area: Metropolitan area
- insider_status: Insider/Non-insider
- tree_level: Hierarchical level (0-1 for top holders)
```

### Ownership Portfolios Table
```sql
- id: Primary key
- holder_id: Foreign key to ownership_holders
- portfolio_name: Fund/portfolio name
- position: Shares in this portfolio
- percent_out: % of outstanding
- percent_portfolio: % of portfolio allocation
- latest_change: Position change
- filing_date: SEC filing date
- source: Data source (ETF, MF-USA, 13F, etc.)
- tree_level: Hierarchical level (2+ for portfolios)
```

## Troubleshooting

### No Data Showing

1. **Check Supabase Connection:**
   ```typescript
   // Verify environment variables
   console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)
   ```

2. **Verify Data Exists:**
   ```sql
   SELECT * FROM ownership_holders LIMIT 5;
   ```

3. **Check RLS Policies:**
   - Ensure public read access is enabled
   - Verify policies in Supabase Dashboard → Authentication → Policies

### Data Not Loading

1. **Check Browser Console:**
   - Look for network errors
   - Verify API responses

2. **Refresh Materialized View:**
   ```sql
   SELECT refresh_ownership_summary();
   ```

### Transformation Errors

If the Python script fails:

1. **Check CSV Format:**
   - Ensure file uses semicolon (;) separator
   - Verify header rows are present

2. **Install Dependencies:**
   ```bash
   pip install pandas numpy
   ```

3. **Check File Path:**
   - Ensure CSV is in `data/Ownership_Map.csv`
   - Run script from `scripts/` directory

## Next Steps

- Add more tickers/companies
- Implement ownership change tracking over time
- Add visualization charts (pie charts, treemaps)
- Create ownership network graph
- Add filtering and search capabilities

## Files Created

- `supabase/ownership_schema.sql` - Database schema
- `scripts/transform_ownership_data.py` - Data transformation script
- `scripts/migrate_ownership_to_supabase.py` - Migration script
- `components/ownership-panel.tsx` - React component
- `data/ownership_transformed.json` - Transformed data (generated)


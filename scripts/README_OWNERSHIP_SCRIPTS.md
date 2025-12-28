# Ownership Data Transformation Scripts

## Quick Start

### 1. Transform CSV to JSON

```bash
cd scripts
python transform_ownership_data.py
```

**Output:** `data/ownership_transformed.json`

**What it does:**
- Parses the semicolon-separated CSV
- Handles European number format (dots as thousands, commas as decimals)
- Separates top-level holders from portfolios
- Aggregates holder positions
- Creates JSON structure ready for Supabase

### 2. Migrate to Supabase

**Option A: Python Script (Recommended)**
```bash
# Make sure you have python-supabase installed
pip install supabase python-dotenv

# Set environment variables in .env.local
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key

# Run migration
python migrate_ownership_to_supabase.py
```

**Option B: Manual SQL Import**

1. Transform data first (step 1)
2. Open Supabase SQL Editor
3. Use the generated JSON to create INSERT statements
4. Or use Supabase Dashboard → Import Data

### 3. Verify Migration

```sql
-- Check holders count
SELECT COUNT(*) FROM ownership_holders WHERE ticker = 'WBD';

-- Check top 5 holders
SELECT holder_name, total_position, total_percent_out 
FROM ownership_holders 
WHERE ticker = 'WBD' 
ORDER BY total_position DESC 
LIMIT 5;

-- Check portfolios
SELECT COUNT(*) FROM ownership_portfolios;

-- Check summary
SELECT * FROM ownership_summary WHERE ticker = 'WBD';
```

## Troubleshooting

### CSV Parsing Issues

If the script fails to parse the CSV:

1. **Check file encoding:**
   ```python
   # Try different encodings
   df = pd.read_csv('...', encoding='utf-8')  # or 'latin-1', 'cp1252'
   ```

2. **Verify separator:**
   - The file uses semicolons (`;`) not commas
   - Check first few lines manually

3. **Check header rows:**
   - Script skips first 12 rows (header metadata)
   - Adjust `skiprows=12` if needed

### Number Format Issues

The CSV uses European format:
- `281.212.937` = 281,212,937 (dots as thousands)
- `11,35` = 11.35 (comma as decimal)

The script handles this automatically, but if issues occur:
- Check `clean_numeric()` function
- Verify number conversion in output JSON

### Supabase Migration Issues

**Error: "Missing Supabase credentials"**
- Ensure `.env.local` has both variables
- Check variable names match exactly

**Error: "Table does not exist"**
- Run `supabase/ownership_schema.sql` first
- Verify tables were created in Supabase Dashboard

**Error: "Foreign key constraint"**
- Ensure holders are inserted before portfolios
- Check `holder_id` references exist

## Data Validation

After migration, validate data quality:

```sql
-- Check for missing holders
SELECT COUNT(*) FROM ownership_holders WHERE holder_name IS NULL;

-- Check position totals
SELECT 
  SUM(total_position) as total_shares,
  SUM(total_percent_out) as total_percent
FROM ownership_holders 
WHERE ticker = 'WBD';

-- Check portfolio linkage
SELECT 
  COUNT(*) as total_portfolios,
  COUNT(DISTINCT holder_id) as holders_with_portfolios
FROM ownership_portfolios;
```

## Next Steps

1. ✅ Transform data
2. ✅ Create Supabase tables
3. ✅ Migrate data
4. ✅ Verify in dashboard
5. 🔄 Refresh materialized view periodically:
   ```sql
   SELECT refresh_ownership_summary();
   ```


# Supabase Setup Guide

Complete guide to connect your Visibility Intelligence Lab to Supabase for faster performance and cloud storage.

Based on: https://supabase.com/docs/guides/getting-started/quickstarts/nextjs

---

## 📋 Prerequisites

- ✅ Supabase account (create at [database.new](https://database.new))
- ✅ Supabase project created
- ✅ Environment variables in `.env.local`:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Optional: `SUPABASE_SERVICE_ROLE_KEY` (for migrations)

---

## 🚀 Step 1: Run Database Schema

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy the entire contents of `supabase/schema.sql`
5. Paste and click **Run**

This will create:
- ✅ `serp_entries` table (your SERP data)
- ✅ `outlets` table (media outlet information)
- ✅ Indexes for performance
- ✅ Row Level Security (RLS) policies
- ✅ Materialized view for aggregated metrics

**Expected output:** "Success. No rows returned"

---

## 📤 Step 2: Migrate Your Data

Run the migration script to upload your Excel data to Supabase:

```bash
# Make sure your .env.local has the correct variables
pnpm tsx scripts/migrate-to-supabase.ts
```

### What the script does:
1. 📖 Reads `data/Visibility_Table.xlsx`
2. 🔄 Normalizes column names and data
3. 🗑️ Clears existing data (optional)
4. 📤 Uploads data in batches
5. 🏢 Creates outlets table from unique outlets
6. ✅ Verifies upload success

### Expected Output:
```
🚀 Starting Supabase Migration
================================

📖 Reading Excel file: data/Visibility_Table.xlsx
✅ Parsed 303 rows from Excel
🔄 Normalizing data...
✅ Normalized 303 valid entries

📤 Uploading 303 entries to Supabase...
🗑️  Clearing existing data...
✅ Uploaded batch 1: 303/303 entries

🏢 Creating outlets table...
📊 Found 42 unique outlets
✅ Created 42 outlets

🔍 Verifying upload...
✅ Total entries in database: 303
✅ Total outlets in database: 42

📝 Sample data:
1. Benin Coup - CNN (Rank: 1)
2. Benin Coup - BBC News (Rank: 2)
3. Benin Coup - Reuters (Rank: 3)

✅ Migration completed successfully!
```

---

## 🔌 Step 3: Switch to Supabase Data Provider

Update `app/layout.tsx` to use Supabase instead of local data:

```typescript
// BEFORE (local data)
import { DataProvider } from "@/lib/data/data-context"

// AFTER (Supabase data)
import { SupabaseDataProvider as DataProvider } from "@/lib/data/supabase-data-context"
```

Then in your layout:

```typescript
<ErrorBoundary>
  <DataProvider>
    {children}
  </DataProvider>
</ErrorBoundary>
```

---

## 🧪 Step 4: Test the Integration

1. Restart your development server:
```bash
pnpm dev
```

2. Open [http://localhost:3000](http://localhost:3000)

3. Navigate to **Overview** - you should see:
   - ✅ Metrics loading from Supabase
   - ✅ Visualizations populated
   - ✅ Faster load times

4. Check browser console for any errors

---

## ✅ Verify Supabase Connection

### In Supabase Dashboard

1. Go to **Table Editor**
2. Click **serp_entries**
3. You should see all your data rows

### In Your App

1. Navigate to different views (Concentration, Outlet Power, etc.)
2. All visualizations should render with real data
3. Metrics should match your Excel data

---

## 📊 Query Your Data (Optional)

You can now run SQL queries in Supabase SQL Editor:

```sql
-- Get top 10 outlets by appearance count
SELECT outlet, COUNT(*) as appearances, AVG(rank) as avg_rank
FROM serp_entries
GROUP BY outlet
ORDER BY appearances DESC
LIMIT 10;

-- Get data for a specific query
SELECT *
FROM serp_entries
WHERE query = 'Benin Coup'
ORDER BY rank;

-- Get outlet metrics
SELECT * FROM outlet_metrics
ORDER BY total_appearances DESC;
```

---

## 🔐 Security Notes

### Row Level Security (RLS)
- ✅ **Read access**: Anyone can view data (public research tool)
- ✅ **Write access**: Only authenticated users can insert/update
- ✅ **Delete access**: Only authenticated users can delete

### API Keys
- **Anon Key** (`NEXT_PUBLIC_SUPABASE_ANON_KEY`): Safe to expose, respects RLS
- **Service Role Key** (`SUPABASE_SERVICE_ROLE_KEY`): Bypasses RLS, keep secret!

---

## 🚨 Troubleshooting

### Migration Script Fails

**Error: "Missing Supabase environment variables"**
```bash
# Check your .env.local file
cat .env.local | grep SUPABASE
```

Should show:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
```

**Error: "Excel file not found"**
- Ensure `data/Visibility_Table.xlsx` exists
- Check file permissions

**Error: "Module not found"**
```bash
# Reinstall dependencies
pnpm install
```

### App Shows No Data

**Check Supabase Connection:**
```typescript
// Add to app/page.tsx temporarily
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
```

**Check Browser Console:**
- Look for network errors
- Check for CORS issues
- Verify API key is correct

**Verify RLS Policies:**
```sql
-- In Supabase SQL Editor
SELECT * FROM serp_entries LIMIT 5;
```

If this returns data but app doesn't:
1. Check RLS policies are enabled
2. Verify anon role has SELECT permission

### Performance Issues

**Enable Caching:**
```typescript
// In lib/supabase/client.ts
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: {
        schema: 'public',
      },
      global: {
        headers: { 'x-application-name': 'visibility-intelligence-lab' },
      },
    }
  )
}
```

**Refresh Materialized View:**
```sql
-- Run in SQL Editor periodically
SELECT refresh_outlet_metrics();
```

---

## 🎯 Benefits of Supabase

- ⚡ **Faster**: Data loads from cloud, no client-side parsing
- 🔄 **Real-time**: Optional real-time subscriptions
- 📊 **Scalable**: Handles large datasets efficiently
- 🔍 **Queryable**: Run SQL queries directly
- 🔐 **Secure**: Row Level Security built-in
- 📈 **Analytics**: Built-in performance monitoring
- 🌐 **Accessible**: Access from anywhere

---

## 📚 Next Steps

### Add Real-time Updates (Optional)

```typescript
// In supabase-data-context.tsx
useEffect(() => {
  const channel = supabase
    .channel('serp_changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'serp_entries' },
      () => {
        console.log('Data changed, refreshing...')
        fetchData()
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [supabase, fetchData])
```

### Add Upload to Supabase Feature

Modify `components/upload-analyze.tsx` to save uploaded data directly to Supabase:

```typescript
const handleProcess = async () => {
  // ... parse file ...
  
  // Upload to Supabase
  const { error } = await supabase
    .from('serp_entries')
    .insert(normalizedData)
  
  if (error) {
    console.error('Upload failed:', error)
    return
  }
  
  // Refresh data
  refreshData()
}
```

### Enable Auth (Optional)

Follow [Supabase Auth guide](https://supabase.com/docs/guides/auth) to add user authentication.

---

## 📖 Documentation

- [Supabase Next.js Quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Realtime](https://supabase.com/docs/guides/realtime)

---

## ✅ Checklist

- [ ] Supabase project created
- [ ] Environment variables in `.env.local`
- [ ] Database schema created (run `supabase/schema.sql`)
- [ ] Data migrated (run `pnpm tsx scripts/migrate-to-supabase.ts`)
- [ ] Data verified in Supabase Table Editor
- [ ] App switched to `SupabaseDataProvider`
- [ ] Dev server restarted
- [ ] App shows data from Supabase
- [ ] All visualizations working

---

**🎉 Congratulations!** Your Visibility Intelligence Lab is now powered by Supabase!


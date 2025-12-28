-- Visibility Intelligence Lab Database Schema
-- Run this in your Supabase SQL Editor

-- Create custom types
CREATE TYPE outlet_category AS ENUM ('mainstream', 'foreign', 'independent', 'local');

-- Create serp_entries table
CREATE TABLE IF NOT EXISTS public.serp_entries (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  query TEXT NOT NULL,
  outlet TEXT NOT NULL,
  rank INTEGER NOT NULL CHECK (rank >= 1 AND rank <= 100),
  date DATE NOT NULL,
  title TEXT,
  url TEXT,
  category outlet_category DEFAULT 'independent',
  country TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create outlets table
CREATE TABLE IF NOT EXISTS public.outlets (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL UNIQUE,
  category outlet_category DEFAULT 'independent',
  country TEXT,
  headquarters TEXT,
  parent TEXT,
  ownership TEXT,
  affiliations TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_serp_entries_query ON public.serp_entries(query);
CREATE INDEX IF NOT EXISTS idx_serp_entries_outlet ON public.serp_entries(outlet);
CREATE INDEX IF NOT EXISTS idx_serp_entries_date ON public.serp_entries(date);
CREATE INDEX IF NOT EXISTS idx_serp_entries_rank ON public.serp_entries(rank);
CREATE INDEX IF NOT EXISTS idx_serp_entries_category ON public.serp_entries(category);
CREATE INDEX IF NOT EXISTS idx_outlets_name ON public.outlets(name);
CREATE INDEX IF NOT EXISTS idx_outlets_category ON public.outlets(category);

-- Enable Row Level Security
ALTER TABLE public.serp_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outlets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public read access
CREATE POLICY "Public can read serp_entries"
  ON public.serp_entries
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public can read outlets"
  ON public.outlets
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Create RLS policies for authenticated write access
CREATE POLICY "Authenticated users can insert serp_entries"
  ON public.serp_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update serp_entries"
  ON public.serp_entries
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete serp_entries"
  ON public.serp_entries
  FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert outlets"
  ON public.outlets
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update outlets"
  ON public.outlets
  FOR UPDATE
  TO authenticated
  USING (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_serp_entries_updated_at
  BEFORE UPDATE ON public.serp_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_outlets_updated_at
  BEFORE UPDATE ON public.outlets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create materialized view for aggregated metrics (optional, for performance)
CREATE MATERIALIZED VIEW IF NOT EXISTS public.outlet_metrics AS
SELECT
  outlet,
  COUNT(*) as total_appearances,
  AVG(rank) as avg_rank,
  MIN(rank) as best_rank,
  MAX(rank) as worst_rank,
  COUNT(*) FILTER (WHERE rank <= 3) as top_three_count,
  COUNT(*) FILTER (WHERE rank <= 5) as top_five_count,
  COUNT(*) FILTER (WHERE rank <= 10) as top_ten_count,
  STDDEV(rank) as rank_volatility,
  mode() WITHIN GROUP (ORDER BY category) as primary_category,
  MIN(date) as first_appearance,
  MAX(date) as last_appearance
FROM public.serp_entries
GROUP BY outlet;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_outlet_metrics_outlet ON public.outlet_metrics(outlet);

-- Function to refresh metrics view
CREATE OR REPLACE FUNCTION refresh_outlet_metrics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.outlet_metrics;
END;
$$ LANGUAGE plpgsql;


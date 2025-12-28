-- Ownership Map Database Schema
-- Run this in your Supabase SQL Editor

-- Create ownership_holders table (top-level holders)
CREATE TABLE IF NOT EXISTS public.ownership_holders (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  holder_name TEXT NOT NULL,
  ticker TEXT NOT NULL DEFAULT 'WBD',
  total_position BIGINT NOT NULL DEFAULT 0,
  total_percent_out NUMERIC(5, 2) NOT NULL DEFAULT 0,
  latest_change BIGINT DEFAULT 0,
  institution_type TEXT,
  country TEXT,
  metro_area TEXT,
  insider_status TEXT,
  tree_level INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(holder_name, ticker)
);

-- Create ownership_portfolios table (individual portfolios/funds)
CREATE TABLE IF NOT EXISTS public.ownership_portfolios (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  holder_id BIGINT NOT NULL REFERENCES public.ownership_holders(id) ON DELETE CASCADE,
  portfolio_name TEXT NOT NULL,
  position BIGINT NOT NULL DEFAULT 0,
  percent_out NUMERIC(5, 2) NOT NULL DEFAULT 0,
  percent_portfolio NUMERIC(5, 2),
  latest_change BIGINT DEFAULT 0,
  filing_date DATE,
  source TEXT,
  tree_level INTEGER NOT NULL DEFAULT 0,
  parent_holder_id BIGINT REFERENCES public.ownership_holders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ownership_holders_ticker ON public.ownership_holders(ticker);
CREATE INDEX IF NOT EXISTS idx_ownership_holders_country ON public.ownership_holders(country);
CREATE INDEX IF NOT EXISTS idx_ownership_holders_institution_type ON public.ownership_holders(institution_type);
CREATE INDEX IF NOT EXISTS idx_ownership_holders_tree_level ON public.ownership_holders(tree_level);
CREATE INDEX IF NOT EXISTS idx_ownership_portfolios_holder_id ON public.ownership_portfolios(holder_id);
CREATE INDEX IF NOT EXISTS idx_ownership_portfolios_filing_date ON public.ownership_portfolios(filing_date);
CREATE INDEX IF NOT EXISTS idx_ownership_portfolios_source ON public.ownership_portfolios(source);

-- Enable Row Level Security
ALTER TABLE public.ownership_holders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ownership_portfolios ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public read access
CREATE POLICY "Public can read ownership_holders"
  ON public.ownership_holders
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public can read ownership_portfolios"
  ON public.ownership_portfolios
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Create RLS policies for authenticated write access
CREATE POLICY "Authenticated users can insert ownership_holders"
  ON public.ownership_holders
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update ownership_holders"
  ON public.ownership_holders
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete ownership_holders"
  ON public.ownership_holders
  FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert ownership_portfolios"
  ON public.ownership_portfolios
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update ownership_portfolios"
  ON public.ownership_portfolios
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete ownership_portfolios"
  ON public.ownership_portfolios
  FOR DELETE
  TO authenticated
  USING (true);

-- Create updated_at trigger
CREATE TRIGGER update_ownership_holders_updated_at
  BEFORE UPDATE ON public.ownership_holders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ownership_portfolios_updated_at
  BEFORE UPDATE ON public.ownership_portfolios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create materialized view for ownership summary
CREATE MATERIALIZED VIEW IF NOT EXISTS public.ownership_summary AS
SELECT
  h.ticker,
  COUNT(DISTINCT h.id) as total_holders,
  SUM(h.total_position) as total_shares,
  SUM(h.total_percent_out) as total_percent_out,
  AVG(h.total_percent_out) as avg_holder_percent,
  COUNT(DISTINCT p.id) as total_portfolios,
  COUNT(DISTINCT h.country) as countries_represented,
  COUNT(DISTINCT h.institution_type) as institution_types,
  MAX(h.updated_at) as last_updated
FROM public.ownership_holders h
LEFT JOIN public.ownership_portfolios p ON p.holder_id = h.id
GROUP BY h.ticker;

CREATE UNIQUE INDEX IF NOT EXISTS idx_ownership_summary_ticker ON public.ownership_summary(ticker);

-- Function to refresh ownership summary
CREATE OR REPLACE FUNCTION refresh_ownership_summary()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.ownership_summary;
END;
$$ LANGUAGE plpgsql;


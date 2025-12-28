"""
Migrate transformed ownership data to Supabase
Run this after transforming the data with transform_ownership_data.py
"""

import json
import os
from pathlib import Path
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables from .env.local in project root
env_path = Path(__file__).parent.parent / '.env.local'
load_dotenv(env_path)

def migrate_ownership_data(json_path='../data/ownership_transformed.json'):
    """
    Migrate ownership data from JSON to Supabase
    """
    print("=" * 80)
    print("MIGRATING OWNERSHIP DATA TO SUPABASE")
    print("=" * 80)
    
    # Initialize Supabase client
    # Use service role key for migrations to bypass RLS
    supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    
    if not supabase_url or not supabase_key:
        print("ERROR: Supabase credentials not found in environment variables")
        print("Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)")
        return
    
    if 'SERVICE_ROLE' in supabase_key or len(supabase_key) > 100:
        print("Using service role key (bypasses RLS)")
    else:
        print("WARNING: Using anon key - RLS policies may block inserts")
    
    supabase: Client = create_client(supabase_url, supabase_key)
    
    # Load transformed data
    print("\n1. Loading transformed data...")
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    holders = data['holders']
    portfolios = data['portfolios']
    
    print(f"   Found {len(holders)} holders and {len(portfolios)} portfolios")
    
    # Insert holders
    print("\n2. Inserting holders...")
    holder_id_map = {}  # Map holder_name to database ID
    
    for holder in holders:
        try:
            # Prepare holder data - only include fields that exist in the schema
            # Cap total_percent_out at 100% (no holder can own more than 100% of a company)
            total_percent_out = float(holder['total_percent_out'])
            if total_percent_out > 100:
                print(f"   ⚠ Capping total_percent_out for {holder['holder_name']}: {total_percent_out}% -> 100%")
                total_percent_out = 100
            
            holder_data = {
                'holder_name': holder['holder_name'],
                'ticker': holder['ticker'],
                'total_position': holder['total_position'],
                'total_percent_out': round(total_percent_out, 2),
                'latest_change': holder['latest_change'],
                'institution_type': holder.get('institution_type'),
                'country': holder.get('country'),
                'metro_area': holder.get('metro_area'),
                'insider_status': holder.get('insider_status'),
                'tree_level': holder.get('tree_level', 0)
            }
            
            # Check if holder already exists
            existing = supabase.table('ownership_holders').select('id, holder_name').eq('holder_name', holder['holder_name']).eq('ticker', holder['ticker']).execute()
            
            if existing.data:
                holder_id = existing.data[0]['id']
                # Update existing holder
                supabase.table('ownership_holders').update(holder_data).eq('id', holder_id).execute()
            else:
                # Insert new holder
                result = supabase.table('ownership_holders').insert(holder_data).execute()
                holder_id = result.data[0]['id']
            
            holder_id_map[holder['holder_name']] = holder_id
            print(f"   ✓ {holder['holder_name']}")
        except Exception as e:
            print(f"   ✗ Error inserting {holder['holder_name']}: {str(e)}")
    
    # Insert portfolios
    print(f"\n3. Inserting portfolios...")
    inserted_count = 0
    error_count = 0
    missing_holder_count = 0
    
    for portfolio in portfolios:
        try:
            # Find holder_id by name matching (don't use holder_id from transform script - it's a temp index)
            holder_name = portfolio.get('holder_name', '')
            holder_id = None
            
            if holder_name:
                # First try exact match
                if holder_name in holder_id_map:
                    holder_id = holder_id_map[holder_name]
                else:
                    # Try to find by partial matching (holder name might be a substring or vice versa)
                    for h_name, h_id in holder_id_map.items():
                        if holder_name in h_name or h_name in holder_name:
                            holder_id = h_id
                            break
            
            if not holder_id:
                missing_holder_count += 1
                if missing_holder_count <= 10:  # Only print first 10 to avoid spam
                    print(f"   ⚠ Could not find holder for portfolio: {portfolio.get('portfolio_name', 'unknown')} (holder: {holder_name})")
                elif missing_holder_count == 11:
                    print(f"   ⚠ ... (suppressing further missing holder warnings)")
                error_count += 1
                continue
            
            # Cap percent_out at 100% (no portfolio can own more than 100% of a company)
            percent_out = float(portfolio['percent_out'])
            if percent_out > 100:
                print(f"   ⚠ Capping percent_out for portfolio {portfolio.get('portfolio_name', 'unknown')}: {percent_out}% -> 100%")
                percent_out = 100
            
            # Cap percent_portfolio at 100% (normal max allocation in a portfolio)
            # Note: Leveraged positions could theoretically exceed 100%, but we cap at 100% for data quality
            percent_portfolio = portfolio.get('percent_portfolio')
            if percent_portfolio is not None:
                percent_portfolio = float(percent_portfolio)
                if percent_portfolio > 100:
                    print(f"   ⚠ Capping percent_portfolio for portfolio {portfolio.get('portfolio_name', 'unknown')}: {percent_portfolio}% -> 100%")
                    percent_portfolio = 100
            
            # Ensure tree_level is set
            tree_level = portfolio.get('tree_level')
            if tree_level is None:
                tree_level = 0
            
            portfolio_data = {
                'holder_id': holder_id,
                'portfolio_name': portfolio['portfolio_name'],
                'position': int(portfolio.get('position', 0)),
                'percent_out': round(percent_out, 2),
                'percent_portfolio': round(percent_portfolio, 2) if percent_portfolio is not None else None,
                'latest_change': int(portfolio.get('latest_change', 0)),
                'filing_date': portfolio.get('filing_date'),
                'source': portfolio.get('source'),
                'tree_level': int(tree_level),
                'parent_holder_id': None  # Don't use parent_holder_id from transform - it's a temp index
            }
            
            result = supabase.table('ownership_portfolios').insert(portfolio_data).execute()
            inserted_count += 1
            
            if inserted_count % 100 == 0:
                print(f"   Processed {inserted_count} portfolios...")
        except Exception as e:
            error_count += 1
            if error_count <= 10:  # Only print first 10 errors to avoid spam
                print(f"   ✗ Error inserting portfolio {portfolio.get('portfolio_name', 'unknown')}: {str(e)}")
            elif error_count == 11:
                print(f"   ✗ ... (suppressing further error messages)")
    
    print("\n" + "=" * 80)
    print("MIGRATION COMPLETE")
    print("=" * 80)
    print(f"Holders inserted/updated: {len(holder_id_map)}")
    print(f"Portfolios inserted: {inserted_count}")
    print(f"Portfolios with missing holders: {missing_holder_count}")
    print(f"Other portfolio errors: {error_count - missing_holder_count}")
    print(f"Total portfolio errors: {error_count}")
    
    # Refresh materialized view
    print("\n4. Refreshing materialized view...")
    try:
        supabase.rpc('refresh_ownership_summary').execute()
        print("   ✓ Materialized view refreshed")
    except Exception as e:
        print(f"   ⚠ Could not refresh materialized view: {str(e)}")
        print("   (You can refresh it manually in Supabase SQL Editor)")

if __name__ == '__main__':
    migrate_ownership_data()


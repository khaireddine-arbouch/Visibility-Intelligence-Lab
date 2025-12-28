"""
Transform Ownership_Map.csv data for Supabase migration
This script processes the hierarchical ownership data and prepares it for database insertion.
"""

import pandas as pd
import numpy as np
from datetime import datetime
import json
import re

def clean_numeric(value, is_percentage=False):
    """
    Convert number format to standard numeric
    Handles both US format (1,234.56) and European format (1.234,56)
    For percentages, caps at 100% (no holder can own more than 100% of a company)
    """
    if pd.isna(value) or value == '' or value == '-':
        return 0
    
    value_str = str(value).strip()
    # Remove percentage signs
    value_str = value_str.replace('%', '').strip()
    
    # Detect format:
    # European: 1.234,56 (. for thousands, , for decimal)
    # US: 1,234.56 (. for decimal, , for thousands)
    has_comma = ',' in value_str
    has_dot = '.' in value_str
    
    if has_comma and has_dot:
        # Both present - check which comes last (that's the decimal separator)
        last_comma = value_str.rfind(',')
        last_dot = value_str.rfind('.')
        
        if last_comma > last_dot:
            # European format: 1.234,56
            value_str = value_str.replace('.', '').replace(',', '.')
        else:
            # US format: 1,234.56
            value_str = value_str.replace(',', '')
    elif has_comma and not has_dot:
        # Only comma - check if it's a decimal separator
        # If there are 1-2 digits after comma, treat as decimal (e.g., "6,39" = 6.39)
        parts = value_str.split(',')
        if len(parts) == 2 and len(parts[1]) <= 2:
            # European decimal: 6,39 -> 6.39
            value_str = value_str.replace(',', '.')
        else:
            # US thousands separator: 1,234 -> 1234
            value_str = value_str.replace(',', '')
    # If only dot, it's already in standard format
    
    try:
        parsed = float(value_str)
        # For percentages, cap at 100% (no holder can own more than 100% of a company)
        if is_percentage:
            parsed = min(max(0, parsed), 100)
        return parsed
    except:
        return 0

def parse_date(date_str):
    """Parse date from DD.MM.YYYY format"""
    if pd.isna(date_str) or date_str == '':
        return None
    try:
        return pd.to_datetime(date_str, format='%d.%m.%Y')
    except:
        return None

def transform_ownership_data(csv_path='../data/Ownership_Map.csv', output_path='../data/ownership_transformed.json'):
    """
    Transform the ownership CSV data into a format suitable for Supabase insertion
    """
    print("=" * 80)
    print("TRANSFORMING OWNERSHIP DATA FOR SUPABASE")
    print("=" * 80)
    
    # Read the CSV with semicolon separator
    print("\n1. Reading CSV file...")
    df_raw = pd.read_csv(csv_path, sep=';', skiprows=12, encoding='utf-8')
    
    # Clean column names
    df_raw.columns = df_raw.columns.str.strip()
    
    # Remove empty rows and separator rows
    df = df_raw.dropna(how='all')
    df = df[~df.iloc[:, 0].astype(str).str.contains('^;+$', regex=True, na=False)]
    
    # Extract ticker from header (if available)
    ticker = 'WBD'  # Default to WBD for Warner Bros Discovery
    
    # Fix Holder Name: when it's "-", the actual name is in "Unnamed: 2"
    if 'Holder Name' in df.columns and 'Unnamed: 2' in df.columns:
        def extract_holder_name(row):
            holder_name = str(row.get('Holder Name', '')).strip()
            if holder_name in ['-', 'nan', '', '--']:
                # Try to get from Unnamed: 2
                alt_name = str(row.get('Unnamed: 2', '')).strip()
                if alt_name and alt_name not in ['nan', '', '--', '-']:
                    return alt_name
            return holder_name if holder_name not in ['-', 'nan', '', '--'] else None
        df['Holder Name'] = df.apply(extract_holder_name, axis=1)
    
    # Remove rows without valid holder names (but keep portfolio rows for later processing)
    df = df[df['Holder Name'].notna()]
    
    # Transform numeric columns
    print("\n2. Transforming numeric columns...")
    if 'Position' in df.columns:
        # Convert to numeric values using clean_numeric, then ensure proper type conversion
        df['Position'] = df['Position'].apply(lambda x: clean_numeric(x, is_percentage=False))
        # Convert to float64 first (this handles object dtype), fill NaN, then convert to int
        df['Position'] = pd.Series(df['Position'], dtype='float64').fillna(0).astype('int64').astype('Int64')
    
    if 'Latest Chg' in df.columns:
        # Convert to numeric values using clean_numeric, then ensure proper type conversion
        df['Latest Chg'] = df['Latest Chg'].apply(lambda x: clean_numeric(x, is_percentage=False))
        # Convert to float64 first (this handles object dtype), fill NaN, then convert to int
        df['Latest Chg'] = pd.Series(df['Latest Chg'], dtype='float64').fillna(0).astype('int64').astype('Int64')
    
    # Transform percentage columns (cap at 100%)
    for col in ['% Out', '% Portfolio']:
        if col in df.columns:
            df[col] = df[col].apply(lambda x: clean_numeric(x, is_percentage=True))
            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
    
    # Transform date
    if 'Filing Date' in df.columns:
        df['Filing Date'] = df['Filing Date'].apply(parse_date)
    
    # Clean text columns
    text_cols = ['Portfolio Name', 'Source', 'Insider Status', 'Institution Type', 'Metro Area', 'Country']
    for col in text_cols:
        if col in df.columns:
            df[col] = df[col].astype(str).str.strip()
            df[col] = df[col].replace(['nan', 'N/A', '--', '-'], None)
    
    # Transform Tree Level
    if 'Tree Level' in df.columns:
        df['Tree Level'] = pd.to_numeric(df['Tree Level'], errors='coerce').fillna(0).astype(int)
    
    print(f"   Processed {len(df)} rows")
    
    # Build hierarchy: Tree Level 0-1 are top-level holders, Level 2+ are portfolios
    print("\n3. Separating holders and portfolios...")
    
    # Get all unique holders (Tree Level 0-1) - these are the main holders
    top_level = df[df['Tree Level'] <= 1].copy()
    portfolio_level = df[df['Tree Level'] >= 2].copy()
    
    # Aggregate top-level holders
    print("\n4. Aggregating top-level holders...")
    holders_data = []
    holder_map = {}  # Map holder name to holder data
    
    for idx, row in top_level.iterrows():
        holder_name = str(row.get('Holder Name', '')).strip()
        if not holder_name or holder_name in ['-', 'nan', '']:
            continue
        
        position = int(clean_numeric(row.get('Position', 0), is_percentage=False))
        percent_out = float(clean_numeric(row.get('% Out', 0), is_percentage=True))
        latest_change = int(clean_numeric(row.get('Latest Chg', 0), is_percentage=False))
        
        if holder_name not in holder_map:
            holder_data = {
                'holder_name': holder_name,
                'ticker': ticker,
                'total_position': position,
                'total_percent_out': percent_out,
                'latest_change': latest_change,
                'institution_type': row.get('Institution Type') if pd.notna(row.get('Institution Type')) else None,
                'country': row.get('Country') if pd.notna(row.get('Country')) else None,
                'metro_area': row.get('Metro Area') if pd.notna(row.get('Metro Area')) else None,
                'insider_status': row.get('Insider Status') if pd.notna(row.get('Insider Status')) else None,
                'tree_level': int(row.get('Tree Level', 0) or 0),
                'filing_date': row.get('Filing Date').strftime('%Y-%m-%d') if pd.notna(row.get('Filing Date')) else None
            }
            holder_map[holder_name] = holder_data
            holders_data.append(holder_data)
        else:
            # Aggregate if same holder appears multiple times
            # Note: Don't sum percentages - they represent the same ownership, just at different tree levels
            # Take the maximum percentage instead, or recalculate from total position
            holder_map[holder_name]['total_position'] += position
            # Use max percentage instead of summing (percentages shouldn't be summed)
            holder_map[holder_name]['total_percent_out'] = max(holder_map[holder_name]['total_percent_out'], percent_out)
            holder_map[holder_name]['latest_change'] += latest_change
    
    # Process portfolios
    print("\n5. Processing portfolios...")
    portfolios_data = []
    
    # Create a mapping of holder names to their data for portfolio linking
    holder_name_to_id = {h['holder_name']: idx + 1 for idx, h in enumerate(holders_data)}
    
    # Build a hierarchy map: for each row, find its parent holder by looking up the tree
    # We'll match portfolios to holders by finding the closest parent holder name
    for idx, row in portfolio_level.iterrows():
        portfolio_name = str(row.get('Portfolio Name', '')).strip()
        holder_name = str(row.get('Holder Name', '')).strip()
        
        if not portfolio_name or portfolio_name in ['-', 'nan', '', '--']:
            continue
        
        # Find parent holder: look for holder names that contain or are contained in the current holder name
        parent_holder_id = None
        if holder_name:
            # First try exact match
            if holder_name in holder_name_to_id:
                parent_holder_id = holder_name_to_id[holder_name]
            else:
                # Try to find parent by name matching (holder name might be a substring)
                for h_name, h_id in holder_name_to_id.items():
                    # Check if holder_name contains h_name or vice versa (for hierarchical matching)
                    if h_name in holder_name or holder_name in h_name:
                        parent_holder_id = h_id
                        break
        
        position = int(clean_numeric(row.get('Position', 0), is_percentage=False))
        percent_out = float(clean_numeric(row.get('% Out', 0), is_percentage=True))
        percent_portfolio = float(clean_numeric(row.get('% Portfolio', 0), is_percentage=True)) if pd.notna(row.get('% Portfolio')) else None
        latest_change = int(clean_numeric(row.get('Latest Chg', 0), is_percentage=False))
        
        portfolio_data = {
            'holder_id': parent_holder_id,  # Will be used to link to holder
            'holder_name': holder_name,  # Keep for reference
            'ticker': ticker,
            'portfolio_name': portfolio_name,
            'position': position,
            'percent_out': percent_out,
            'percent_portfolio': percent_portfolio,
            'latest_change': latest_change,
            'filing_date': row.get('Filing Date').strftime('%Y-%m-%d') if pd.notna(row.get('Filing Date')) else None,
            'source': row.get('Source') if pd.notna(row.get('Source')) else None
        }
        portfolios_data.append(portfolio_data)
    
    # Prepare output structure
    output = {
        'ticker': ticker,
        'company_name': 'Warner Bros Discovery Inc',
        'transformed_at': datetime.now().isoformat(),
        'holders': holders_data,
        'portfolios': portfolios_data,
        'summary': {
            'total_holders': len(holders_data),
            'total_portfolios': len(portfolios_data),
            'total_shares': sum(h['total_position'] for h in holders_data),
            'total_percent_out': sum(h['total_percent_out'] for h in holders_data)
        }
    }
    
    # Save to JSON
    print(f"\n6. Saving transformed data to {output_path}...")
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False, default=str)
    
    print("\n" + "=" * 80)
    print("TRANSFORMATION COMPLETE")
    print("=" * 80)
    print(f"Total holders: {len(holders_data)}")
    print(f"Total portfolios: {len(portfolios_data)}")
    print(f"Total shares: {output['summary']['total_shares']:,}")
    print(f"Total % outstanding: {output['summary']['total_percent_out']:.2f}%")
    print(f"\nOutput saved to: {output_path}")
    print("\nNext steps:")
    print("1. Review the transformed JSON file")
    print("2. Run the Supabase migration script to insert data")
    print("3. Or use the Supabase dashboard to import the data")
    
    return output

if __name__ == '__main__':
    transform_ownership_data()


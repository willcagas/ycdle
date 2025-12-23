"""
YC Company Scraper - Downloads all YC company data and exports to JSON.

Usage:
    python scrape_yc_to_json.py
    python scrape_yc_to_json.py --out yc.json
    python scrape_yc_to_json.py --out yc.json --max-pages 5
"""

import argparse
import json
import os
import time
from datetime import date
from typing import Any, Dict, List, Optional

import requests


def sanitize_text(s: str) -> str:
    """Replace newlines/tabs with spaces, collapse multiple spaces, strip."""
    if not s:
        return ""
    s = s.replace("\n", " ").replace("\r", " ").replace("\t", " ")
    while "  " in s:
        s = s.replace("  ", " ")
    return s.strip()


def parse_batch_index(batch: str) -> str:
    """
    Parse batch string to numeric index.
    WYY -> 2000+YY+0.25, SYY -> 2000+YY+0.75
    Invalid/weird formats -> blank string.
    """
    if not batch:
        return ""
    
    batch = batch.strip().upper()
    
    # Handle WYY format (e.g., W24 -> 2000+24+0.25 = 2024.25)
    if batch.startswith("W") and len(batch) >= 3:
        try:
            yy = int(batch[1:])
            return str(2000 + yy + 0.25)
        except ValueError:
            pass
    
    # Handle SYY format (e.g., S24 -> 2000+24+0.75 = 2024.75)
    if batch.startswith("S") and len(batch) >= 3:
        try:
            yy = int(batch[1:])
            return str(2000 + yy + 0.75)
        except ValueError:
            pass
    
    # Weird formats like "IK12" -> blank
    return ""


def to_array(value: Any) -> List[str]:
    """
    Convert value to array of strings.
    If list, filter None values and convert to strings.
    If dict, return list of keys as strings.
    If missing/None/empty, return empty list.
    """
    if value is None:
        return []
    
    if isinstance(value, list):
        return [str(item) for item in value if item is not None]
    
    if isinstance(value, dict):
        return [str(k) for k in value.keys() if k is not None]
    
    return []


def fetch_companies(max_pages: Optional[int] = None) -> List[Dict[str, Any]]:
    """
    Fetch all companies from YC API with pagination.
    Returns list of company dictionaries.
    """
    url = "https://api.ycombinator.com/v0.1/companies"
    companies = []
    page_count = 0
    
    while url:
        if max_pages and page_count >= max_pages:
            break
        
        try:
            response = requests.get(url)
            response.raise_for_status()
            payload = response.json()
            
            page_companies = payload.get("companies", [])
            companies.extend(page_companies)
            page_count += 1
            
            print(f"Fetched page {page_count}: {len(page_companies)} companies (total: {len(companies)})")
            
            # Get next page URL
            url = payload.get("nextPage")
            
            # Rate limiting: sleep 0.2s between pages
            if url:
                time.sleep(0.2)
        
        except requests.RequestException as e:
            print(f"Error fetching page: {e}")
            break
    
    return companies


def process_company(company: Dict[str, Any]) -> Dict[str, Any]:
    """
    Process a single company record into JSON format.
    Returns dictionary with company fields as keys.
    """
    # Extract fields with safe .get()
    company_id = company.get("id")
    slug = str(company.get("slug", ""))
    name = sanitize_text(company.get("name", ""))
    small_logo_url = str(company.get("smallLogoUrl", ""))
    one_liner = sanitize_text(company.get("oneLiner", ""))
    batch = str(company.get("batch", ""))
    batch_index = parse_batch_index(batch)
    status = str(company.get("status", ""))
    
    # Primary industry: first element of industries array or blank
    industries = company.get("industries", [])
    primary_industry = ""
    if isinstance(industries, list) and industries:
        primary_industry = str(industries[0]) if industries[0] is not None else ""
    
    # Industries: keep as array
    industries_array = to_array(industries)
    
    # Badges: keep as array
    badges = company.get("badges", [])
    badges_array = to_array(badges)
    
    # Regions: keep as array
    regions = company.get("regions", [])
    regions_array = to_array(regions)
    
    return {
        "id": company_id,
        "slug": slug,
        "name": name,
        "smallLogoUrl": small_logo_url,
        "oneLiner": one_liner,
        "batch": batch,
        "batchIndex": batch_index if batch_index else "",
        "status": status,
        "primaryIndustry": primary_industry,
        "industries": industries_array,
        "badges": badges_array,
        "regions": regions_array,
    }


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description="Scrape YC companies and export to JSON")
    parser.add_argument(
        "--out",
        type=str,
        default="data/yc_companies.json",
        help="Output JSON file path (default: data/yc_companies.json)",
    )
    parser.add_argument(
        "--max-pages",
        type=int,
        default=None,
        help="Maximum number of pages to fetch (for testing)",
    )
    
    args = parser.parse_args()
    
    # Fetch companies
    print("Starting YC company data fetch...")
    companies = fetch_companies(max_pages=args.max_pages)
    print(f"\nTotal companies collected: {len(companies)}")
    
    if not companies:
        print("No companies found. Exiting.")
        return
    
    # Process companies
    print("Processing companies...")
    processed = [process_company(c) for c in companies]
    
    # Sort: batchIndex descending (blank last), then name ascending
    def sort_key(row: Dict[str, Any]) -> tuple:
        batch_idx = row.get("batchIndex", "")
        name = row.get("name", "").lower()
        # Convert batchIndex to float for sorting, use -inf for blank
        try:
            batch_val = float(batch_idx) if batch_idx else float("-inf")
        except ValueError:
            batch_val = float("-inf")
        # Return tuple: (is_blank, -batch_val, name)
        # This puts blanks last (True > False), then sorts by -batch_val (descending), then name (ascending)
        is_blank = not batch_idx
        return (is_blank, -batch_val, name)
    
    processed.sort(key=sort_key)
    
    # Create output directory if needed
    output_path = args.out
    os.makedirs(os.path.dirname(output_path) if os.path.dirname(output_path) else ".", exist_ok=True)
    
    # Create output structure with version, count, and companies
    output_data = {
        "version": date.today().isoformat(),
        "count": len(processed),
        "companies": processed
    }
    
    # Write JSON
    print(f"Writing JSON to {output_path}...")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)
    
    print(f"Successfully wrote {len(processed)} companies to {output_path}")


if __name__ == "__main__":
    main()


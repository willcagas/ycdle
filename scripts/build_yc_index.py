"""
Build YC Companies Index - Generates index files for fast lookup.

Usage:
    python scripts/build_yc_index.py
    python scripts/build_yc_index.py --in data/yc_companies.json --out-dir data/
"""

import argparse
import json
import sys
from collections import defaultdict
from pathlib import Path
from typing import Any, Dict, List


def load_companies(input_path: str) -> Dict[str, Any]:
    """Load companies JSON from input file."""
    with open(input_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    if "companies" not in data:
        raise ValueError(f"Input file {input_path} does not contain 'companies' field")
    
    return data


def build_index(companies: List[Dict[str, Any]]) -> Dict[str, Dict[str, int]]:
    """
    Build index mappings from companies array.
    Returns dict with 'bySlug' and 'byId' mappings.
    Raises ValueError if duplicates are found.
    """
    by_slug: Dict[str, int] = {}
    by_id: Dict[str, int] = {}
    
    # Track duplicates
    slug_occurrences: Dict[str, List[int]] = defaultdict(list)
    id_occurrences: Dict[str, List[int]] = defaultdict(list)
    
    for index, company in enumerate(companies):
        # Process slug - skip None, empty strings, and invalid string values
        slug = company.get("slug")
        if slug is not None and slug != "":
            slug_str = str(slug).strip()
            # Skip if empty, or if it's "None", "none", "null", or "Null"
            if slug_str and slug_str.lower() not in ("none", "null"):
                slug_occurrences[slug_str].append(index)
                by_slug[slug_str] = index
        
        # Process id - skip None values
        company_id = company.get("id")
        if company_id is not None:
            id_str = str(company_id)
            id_occurrences[id_str].append(index)
            by_id[id_str] = index
    
    # Check for duplicate slugs
    duplicate_slugs = {slug: indices for slug, indices in slug_occurrences.items() if len(indices) > 1}
    if duplicate_slugs:
        error_msg = "Duplicate slugs found:\n"
        for slug, indices in duplicate_slugs.items():
            error_msg += f"  '{slug}' at indices: {indices}\n"
        raise ValueError(error_msg.strip())
    
    # Check for duplicate ids
    duplicate_ids = {id_str: indices for id_str, indices in id_occurrences.items() if len(indices) > 1}
    if duplicate_ids:
        error_msg = "Duplicate ids found:\n"
        for id_str, indices in duplicate_ids.items():
            error_msg += f"  '{id_str}' at indices: {indices}\n"
        raise ValueError(error_msg.strip())
    
    return {
        "bySlug": by_slug,
        "byId": by_id,
    }


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Build YC companies index files for fast lookup"
    )
    parser.add_argument(
        "--in",
        dest="input_file",
        type=str,
        default="data/yc_companies.json",
        help="Input JSON file path (default: data/yc_companies.json)",
    )
    parser.add_argument(
        "--out-dir",
        type=str,
        default="data/",
        help="Output directory for index file (default: data/)",
    )
    
    args = parser.parse_args()
    
    # Load companies data
    print(f"Loading companies from {args.input_file}...")
    try:
        data = load_companies(args.input_file)
        companies = data.get("companies", [])
    except FileNotFoundError:
        print(f"Error: Input file not found: {args.input_file}")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in {args.input_file}: {e}")
        sys.exit(1)
    except ValueError as e:
        print(f"Error: {e}")
        sys.exit(1)
    
    print(f"Loaded {len(companies)} companies")
    
    # Build index
    print("Building index...")
    try:
        index_data = build_index(companies)
    except ValueError as e:
        print(f"Error: {e}")
        sys.exit(1)
    
    # Create output directory if needed
    output_dir = Path(args.out_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Write index file
    output_path = output_dir / "yc_index.json"
    print(f"Writing index to {output_path}...")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(index_data, f, indent=2, ensure_ascii=False)
    
    # Print summary
    print("\n" + "=" * 50)
    print("Summary:")
    print(f"  Companies count: {len(companies)}")
    print(f"  Unique slugs: {len(index_data['bySlug'])}")
    print(f"  Unique ids: {len(index_data['byId'])}")
    print(f"  Output path: {output_path}")
    print("=" * 50)


if __name__ == "__main__":
    main()


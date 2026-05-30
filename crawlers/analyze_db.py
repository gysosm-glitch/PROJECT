import os
import sys
from supabase import create_client

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from contest_crawler import is_target_region

from dotenv import load_dotenv

load_dotenv('.env.local')
url = os.environ.get('NEXT_PUBLIC_SUPABASE_URL', '')
key = os.environ.get('SUPABASE_SERVICE_KEY', '')

supabase = create_client(url, key)

def analyze_db():
    resp = supabase.table('contests').select('*').execute()
    contests = resp.data

    total = len(contests)
    sources = {}
    valid_count = 0
    invalid_count = 0
    
    invalid_titles = []

    for c in contests:
        src = c.get('source', 'unknown')
        sources[src] = sources.get(src, 0) + 1
        
        if is_target_region(c):
            valid_count += 1
        else:
            invalid_count += 1
            if len(invalid_titles) < 10:
                invalid_titles.append(f"[{src}] {c.get('title')}")

    print(f"Total contests in DB: {total}")
    print(f"By Source: {sources}")
    print(f"Pass current strict region filter: {valid_count}")
    print(f"Fail current strict region filter (Old/Garbage): {invalid_count}")
    
    print("\nSample of contests failing the current strict filter:")
    for t in invalid_titles:
        print(f" - {t}")

if __name__ == '__main__':
    analyze_db()

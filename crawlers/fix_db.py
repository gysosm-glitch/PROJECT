import os
import sys
from datetime import datetime
from supabase import create_client

# Add current dir to path to import crawler logic
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from contest_crawler import _extract_region

from dotenv import load_dotenv

load_dotenv('.env.local')
url = os.environ.get('NEXT_PUBLIC_SUPABASE_URL', '')
key = os.environ.get('SUPABASE_SERVICE_KEY', '')

supabase = create_client(url, key)

def fix_db():
    resp = supabase.table('contests').select('*').execute()
    contests = resp.data

    to_update = []
    
    for c in contests:
        needs_update = False
        updates = {}
        
        # Check start_date
        if c.get('start_date') is None:
            # Fallback to created_at or last_crawled_at or today
            created = c.get('created_at') or c.get('last_crawled_at')
            if created:
                # '2026-05-28T10:00:00Z' -> '2026-05-28'
                updates['start_date'] = created.split('T')[0]
            else:
                updates['start_date'] = datetime.now().strftime("%Y-%m-%d")
            needs_update = True
            
        # Check region
        if c.get('region') is None:
            region = _extract_region(c)
            updates['region'] = region
            needs_update = True
            
        if needs_update:
            # Update row in DB based on URL
            try:
                supabase.table('contests').update(updates).eq('url', c['url']).execute()
                to_update.append(c['title'])
            except Exception as e:
                print(f"Error updating {c['title']}: {e}")

    print(f"Fixed {len(to_update)} records with missing start_date or region.")

if __name__ == '__main__':
    fix_db()

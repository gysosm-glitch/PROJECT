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

def clean_db():
    resp = supabase.table('contests').select('*').execute()
    contests = resp.data

    to_delete_urls = []
    
    for c in contests:
        if not is_target_region(c):
            to_delete_urls.append(c['url'])

    print(f"Found {len(to_delete_urls)} contests that do not match the strict Chungcheong rule.")
    
    deleted_count = 0
    for url_val in to_delete_urls:
        try:
            supabase.table('contests').delete().eq('url', url_val).execute()
            deleted_count += 1
        except Exception as e:
            print(f"Error deleting {url_val}: {e}")

    print(f"Successfully deleted {deleted_count} garbage/old contests from DB.")

if __name__ == '__main__':
    clean_db()

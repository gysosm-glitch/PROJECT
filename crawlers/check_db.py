import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv('.env.local')
url = os.environ.get('NEXT_PUBLIC_SUPABASE_URL', '')
key = os.environ.get('SUPABASE_SERVICE_KEY', '')

supabase = create_client(url, key)

resp = supabase.table('contests').select('*').execute()
contests = resp.data

null_start = [c for c in contests if c.get('start_date') is None]
null_region = [c for c in contests if c.get('region') is None]

print(f"Total contests: {len(contests)}")
print(f"NULL start_date: {len(null_start)}")
print(f"NULL region: {len(null_region)}")

if null_start:
    print("\nSample NULL start_date sources:")
    for c in null_start[:5]:
        print(f" - {c.get('source')}: {c.get('title')}")

if null_region:
    print("\nSample NULL region sources:")
    for c in null_region[:5]:
        print(f" - {c.get('source')}: {c.get('title')}")

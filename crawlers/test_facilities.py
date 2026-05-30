import os
import sys
from dotenv import load_dotenv

load_dotenv('.env.local')
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import sports_crawler

if not sports_crawler.login():
    print("Login failed")
    sys.exit(1)

urls = [
    'https://sports.cbnu.ac.kr/cbnu_facilities1_2_4',
    'https://sports.cbnu.ac.kr/cbnu_facilities2_1_6'
]

for url in urls:
    resp = sports_crawler.SESSION.get(url, verify=False)
    print(f"--- URL: {url} ---")
    
    # Try to find act=dispFacilityView... in HTML
    import re
    # We look for something like index.php?mid=cbnu_facilities1_2_4&act=dispFacilityView&code=XXXXXXXX
    matches = re.findall(r'code=([a-zA-Z0-9]{30,})', resp.text)
    if not matches:
        # Maybe search for facility_item_srl
        matches = re.findall(r'facility_item_srl=([a-zA-Z0-9]{30,})', resp.text)
        
    for c in set(matches):
        print(f"Found code: {c}")
        cache = {}
        try:
            sports_crawler.get_schedule('test', c, "20260601", cache)
            raw = cache.get((c, "20260601"))
            if raw:
                day_items = raw.get("day_2026-06-01", [])
                if day_items:
                    names = [item.get('facility_item_detail_name') for item in day_items]
                    print(f"  -> Courts: {names}")
        except Exception as e:
            print(f"  Error checking code {c}: {e}")

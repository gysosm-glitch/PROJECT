import os
import sys
import datetime
from dotenv import load_dotenv

load_dotenv('.env.local')

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import sports_crawler

if not sports_crawler.login():
    print("Login failed")
    sys.exit(1)

target_date = "20260601"
code = sports_crawler.FACILITIES['tennis_a']

cache = {}
data = sports_crawler.get_schedule('tennis_a', code, target_date, cache)

raw_data = cache[(code, target_date)]
day_items = raw_data.get(f"day_{target_date[:4]}-{target_date[4:6]}-{target_date[6:]}", [])

print(f"Total courts found in API response: {len(day_items)}")
for idx, item in enumerate(day_items):
    print(f"Court {idx}: {item.get('facility_item_detail_name')}")


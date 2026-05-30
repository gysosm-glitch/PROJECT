import os, sys, requests, re, json
from dotenv import load_dotenv
load_dotenv('.env.local')
sys.path.append('crawlers')
import sports_crawler
sports_crawler.login()

BASE = 'https://sports.cbnu.ac.kr'
headers = {
    'User-Agent': 'Mozilla/5.0',
    'Origin': BASE + '/',
    'Referer': f'{BASE}/index.php?mid=cbnu_facilities3_2'
}

r = sports_crawler.SESSION.get(f'{BASE}/index.php?mid=cbnu_facilities3_2', headers=headers, verify=False, timeout=8)
codes = re.findall(r'[a-zA-Z0-9]{30,42}', r.text)
unique_codes = set(codes)
print(f'cbnu_facilities3_2 codes: {unique_codes}')

for code in unique_codes:
    try:
        print(f'\n--- code: {code} ---')
        payload = f'code={code}&days=20260605&module=its&act=get_schedule'
        resp = sports_crawler.SESSION.post(BASE + '/', data=payload, headers={'Content-Type': 'application/x-www-form-urlencoded', **headers}, timeout=15, verify=False)
        data = resp.json()
        items = data.get('day_2026-06-05', [])
        for idx, item in enumerate(items):
            print(f"  [{idx}] {item.get('facility_item_detail_name')} | 시설: {item.get('facility_item_name')} | 예약: {item.get('unavailable', [])}")
    except Exception as e:
        print(f'  에러: {e}')

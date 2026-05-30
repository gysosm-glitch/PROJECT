"""
A코트, B코트 page code로 get_schedule 테스트 + 전체 시설 점검
"""
import os, sys, json
from dotenv import load_dotenv

load_dotenv('.env.local')
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import sports_crawler

if not sports_crawler.login():
    print("Login failed"); sys.exit(1)

BASE = 'https://sports.cbnu.ac.kr'
TARGET_DATE = "20260605"

headers_base = {
    'Accept': 'application/json, text/javascript, */*; q=0.01',
    'Content-Type': 'application/x-www-form-urlencoded',
    'X-Requested-With': 'XMLHttpRequest',
    'Origin': BASE + '/',
}

def test_code(label, code, date=TARGET_DATE):
    headers = {**headers_base, 'Referer': f'{BASE}/index.php?mid=cbnu_facilities3_1&act=dispFacilityView&code={code}'}
    payload = f'code={code}&days={date}&module=its&act=get_schedule'
    resp = sports_crawler.SESSION.post(BASE + '/', data=payload, headers=headers, timeout=12, verify=False)
    data = resp.json()
    date_key = f"day_{date[:4]}-{date[4:6]}-{date[6:]}"
    items = data.get(date_key, [])
    print(f"\n[{label}] 코드: {code[:25]}...")
    print(f"  코트 {len(items)}개: {[i.get('facility_item_detail_name') for i in items]}")
    for idx, item in enumerate(items):
        print(f"    [{idx}] 이름={item.get('facility_item_detail_name')} | 시설={item.get('facility_item_name')} | unavailable={item.get('unavailable', [])[:3]}")
    return items

print("=" * 60)
print("새로 발견된 A,B코트 page code 테스트")
print("=" * 60)
a_items = test_code("A코트 page code", "mMSXwWaYZMNqkZXEacNuxGmQmZCTlG2Xkmpv")
b_items = test_code("B코트 page code", "lsScwWOYacNkkZfEasNuxGWQmpCTlG2Xkmpv")

print("\n" + "=" * 60)
print("기존 등록 시설 전체 점검")
print("=" * 60)
seen = set()
for ftype, code in sports_crawler.FACILITIES.items():
    if code in seen:
        continue
    seen.add(code)
    test_code(ftype, code)

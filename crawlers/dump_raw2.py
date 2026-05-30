"""
기존 코드(mMSbw...) 전체 raw 응답 - facility_item_name 확인
"""
import os, sys, json
from dotenv import load_dotenv

load_dotenv('.env.local')
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import sports_crawler

if not sports_crawler.login():
    print("Login failed"); sys.exit(1)

BASE = 'https://sports.cbnu.ac.kr'

codes = {
    '기존 테니스 코드': 'mMSbwWGYZMNkkZXEasNuxGiQkpCTlG2Xkmpv',
    '새 코드(curl에서 발견)': 'msSbwWKYZcNskZfEbMNpxGSQl5CTlG2Xkmpv',
}

for label, code in codes.items():
    headers = {
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Requested-With': 'XMLHttpRequest',
        'Origin': BASE + '/',
        'Referer': f'{BASE}/index.php?mid=cbnu_facilities3_1&act=dispFacilityView&code={code}',
    }
    payload = f'code={code}&days=20260601&module=its&act=get_schedule'
    resp = sports_crawler.SESSION.post(BASE + '/', data=payload, headers=headers, timeout=15, verify=False)
    data = resp.json()

    items = data.get('day_2026-06-01', [])
    print(f"\n[{label}]")
    for item in items:
        print(f"  코트명: {item.get('facility_item_detail_name')}")
        print(f"  시설명: {item.get('facility_item_name')}")
        print(f"  facility_item_srl: {item.get('facility_item_srl')}")
        print()

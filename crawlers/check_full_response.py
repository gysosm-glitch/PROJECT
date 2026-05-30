"""
새 코드의 전체 응답 구조 확인 - rentitem_info 포함
여러 날짜로 테스트해서 A,B코트가 나오는지 확인
"""
import os, sys, json, requests
from dotenv import load_dotenv

load_dotenv('.env.local')
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import sports_crawler

if not sports_crawler.login():
    print("Login failed"); sys.exit(1)

BASE = 'https://sports.cbnu.ac.kr'
new_code = 'msSbwWKYZcNskZfEbMNpxGSQl5CTlG2Xkmpv'
old_code = 'mMSbwWGYZMNkkZXEasNuxGiQkpCTlG2Xkmpv'

headers = {
    'Accept': 'application/json, text/javascript, */*; q=0.01',
    'Content-Type': 'application/x-www-form-urlencoded',
    'X-Requested-With': 'XMLHttpRequest',
    'Origin': BASE + '/',
    'Referer': f'{BASE}/index.php?mid=cbnu_facilities3_1&act=dispFacilityView&code={new_code}',
}

for code_label, code in [('새 코드(msSbw...)', new_code), ('기존 코드(mMSbw...)', old_code)]:
    print(f"\n{'='*60}")
    print(f"코드: {code_label}")
    for test_date in ['20260530', '20260601', '20260615']:
        payload = f'code={code}&days={test_date}&module=its&act=get_schedule'
        resp = sports_crawler.SESSION.post(BASE + '/', data=payload, headers=headers, timeout=15, verify=False)
        data = resp.json()

        # rentitem_info 확인
        rentitem = data.get('rentitem_info', {})
        if rentitem:
            print(f"\n  [{test_date}] rentitem_info:")
            print(f"    {json.dumps(rentitem, ensure_ascii=False)[:400]}")

        # day_items 확인
        date_key = f"day_{test_date[:4]}-{test_date[4:6]}-{test_date[6:]}"
        day_items = data.get(date_key, [])
        names = [i.get('facility_item_detail_name', '?') for i in day_items]
        print(f"  [{test_date}] 코트 {len(day_items)}개: {names}")

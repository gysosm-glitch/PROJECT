"""
새로 발견된 코드 msSbwWKYZcNskZfEbMNpxGSQl5CTlG2Xkmpv 검증
"""
import os, sys, re, json, requests
from dotenv import load_dotenv

load_dotenv('.env.local')
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import sports_crawler

if not sports_crawler.login():
    print("Login failed"); sys.exit(1)

TARGET_DATE = "20260601"
BASE = 'https://sports.cbnu.ac.kr'

new_code = 'msSbwWKYZcNskZfEbMNpxGSQl5CTlG2Xkmpv'

headers = {
    'Accept': 'application/json, text/javascript, */*; q=0.01',
    'Content-Type': 'application/x-www-form-urlencoded',
    'X-Requested-With': 'XMLHttpRequest',
    'Origin': BASE + '/',
    'Referer': f'{BASE}/index.php?mid=cbnu_facilities3_1&act=dispFacilityView&code={new_code}',
}

print(f"=== 새 코드 검증: {new_code} ===")

# get_schedule API 호출
payload = f'code={new_code}&days={TARGET_DATE}&module=its&act=get_schedule'
resp = sports_crawler.SESSION.post(BASE + '/', data=payload, headers=headers, timeout=15, verify=False)
data = resp.json()

print(f"전체 응답 키: {list(data.keys())[:10]}")

date_key = "day_2026-06-01"
day_items = data.get(date_key, [])
print(f"\n코트 수: {len(day_items)}")
for i, item in enumerate(day_items):
    name = item.get('facility_item_detail_name', '?')
    time_s = item.get('time_s', '?')
    time_e = item.get('time_e', '?')
    print(f"  [{i}] 이름: {name}, 운영: {time_s}~{time_e}")

# cbnu_facilities3_x 페이지들도 추가 탐색
print("\n=== cbnu_facilities3_x 페이지에서 추가 코드 탐색 ===")
for suffix in ['1', '2', '3', '4', '5']:
    url = f'{BASE}/cbnu_facilities3_{suffix}'
    try:
        r = sports_crawler.SESSION.get(url, verify=False, timeout=8)
        codes = re.findall(r'code=([a-zA-Z0-9]{25,})', r.text)
        # JS 내 코드도 탐색
        codes += re.findall(r'"([a-zA-Z0-9]{30,40})"', r.text)
        known = set(sports_crawler.FACILITIES.values()) | {new_code}
        fresh = set(codes) - known
        if fresh:
            print(f"  cbnu_facilities3_{suffix}: 새 코드 {fresh}")
        elif codes:
            print(f"  cbnu_facilities3_{suffix}: 기존 코드만 ({set(codes) & known})")
        else:
            title_match = re.search(r'<title>(.*?)</title>', r.text)
            title = title_match.group(1) if title_match else '?'
            print(f"  cbnu_facilities3_{suffix}: 코드 없음 (제목: {title})")
    except Exception as e:
        print(f"  cbnu_facilities3_{suffix}: 오류 ({e})")

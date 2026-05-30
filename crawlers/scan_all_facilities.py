"""
사이트 실제 시설 목록 페이지에서 모든 시설 코드 수집
"""
import os, sys, re, requests
from dotenv import load_dotenv

load_dotenv('.env.local')
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import sports_crawler

if not sports_crawler.login():
    print("Login failed"); sys.exit(1)

TARGET_DATE = "20260601"
BASE = 'https://sports.cbnu.ac.kr'

# 시설 목록 메인 페이지
main_url = f'{BASE}/cbnu_facilities'

print(f"=== {main_url} 접속 ===")
resp = sports_crawler.SESSION.get(main_url, verify=False, timeout=15)
html = resp.text

# 모든 href 추출
all_hrefs = re.findall(r'href=["\']([^"\']+)["\']', html)
print(f"총 링크 수: {len(all_hrefs)}")

# cbnu 관련 링크
cbnu_links = [h for h in all_hrefs if 'cbnu' in h.lower()]
print(f"cbnu 링크: {set(cbnu_links)}")

# 긴 코드 패턴 수집 (30자 이상 알파벳+숫자)
codes_in_html = re.findall(r'[a-zA-Z0-9]{30,40}', html)
known_codes = set(sports_crawler.FACILITIES.values())
new_codes = set(codes_in_html) - known_codes

print(f"\n기존 코드 {len(known_codes)}개, 새 코드 후보 {len(new_codes)}개")

# 새 코드들에 대해 API 호출
if new_codes:
    for code in new_codes:
        try:
            payload = f'code={code}&days={TARGET_DATE}&module=its&act=get_schedule'
            headers = {
                'Accept': 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-Requested-With': 'XMLHttpRequest',
                'Origin': BASE + '/',
                'Referer': BASE + '/',
            }
            resp2 = sports_crawler.SESSION.post(BASE + '/', data=payload, headers=headers, timeout=10, verify=False)
            data = resp2.json()
            day_items = data.get("day_2026-06-01", [])
            if day_items:
                court_names = [item.get('facility_item_detail_name', '?') for item in day_items]
                print(f"  [HIT] {code} → {court_names}")
        except:
            pass

# index.php?mid=cbnu_facilities&act=dispFacilityReservation 형태의 링크에서 코드 추출
print("\n=== index.php 형태 탐색 ===")
# 각 코트 페이지 URL 직접 시도
test_urls = [
    f'{BASE}/index.php?mid=cbnu_facilities&act=dispFacilityView',
    f'{BASE}/index.php?mid=cbnu_facilities',
]

for u in test_urls:
    try:
        r = sports_crawler.SESSION.get(u, verify=False, timeout=10)
        codes = re.findall(r'code=([a-zA-Z0-9]{25,})', r.text)
        codes_new = set(codes) - known_codes
        if codes_new:
            print(f"  [{u}] 새 코드: {codes_new}")
        elif codes:
            print(f"  [{u}] 기존 코드만: {set(codes)}")
    except Exception as e:
        print(f"  오류: {e}")

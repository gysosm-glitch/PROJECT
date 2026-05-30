"""
발견된 시설 URL들을 전부 순회하며 새 API 코드 탐색
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

# 메인 페이지에서 발견된 시설 URL들
facility_urls = [
    f'{BASE}/cbnu_facilities1_1',
    f'{BASE}/cbnu_facilities1_2',
    f'{BASE}/cbnu_facilities1_2_1',
    f'{BASE}/cbnu_facilities1_2_2',
    f'{BASE}/cbnu_facilities1_2_3',
    f'{BASE}/cbnu_facilities1_2_4',
    f'{BASE}/cbnu_facilities1_2_5',
    f'{BASE}/cbnu_facilities2_1_1',
    f'{BASE}/cbnu_facilities2_1_2',
    f'{BASE}/cbnu_facilities2_1_3',
    f'{BASE}/cbnu_facilities2_1_4',
    f'{BASE}/cbnu_facilities2_1_5',
    f'{BASE}/cbnu_facilities2_1_6',
    f'{BASE}/cbnu_facilities2_2',
    f'{BASE}/cbnu_facilities3_1',
    f'{BASE}/cbnu_facilities3_2',
    f'{BASE}/cbnu_facilities3_3',
    f'{BASE}/cbnu_facilities4_1',
    f'{BASE}/cbnu_facilities4_6',
    f'{BASE}/cbnu_center',
]

known_codes = set(sports_crawler.FACILITIES.values())
discovered = {}  # code -> (court_names, source_url)

print("=== 각 시설 URL 탐색 ===")
for url in facility_urls:
    try:
        resp = sports_crawler.SESSION.get(url, verify=False, timeout=10)
        html = resp.text
        
        # code 패턴 추출
        codes = set(re.findall(r'code=([a-zA-Z0-9]{25,})', html))
        # data-code 패턴도 추출
        codes |= set(re.findall(r'data-code=["\']([a-zA-Z0-9]{25,})["\']', html))
        
        new_codes = codes - known_codes
        if new_codes:
            print(f"\n[!] {url}")
            for c in new_codes:
                try:
                    payload = f'code={c}&days={TARGET_DATE}&module=its&act=get_schedule'
                    headers = {
                        'Accept': 'application/json',
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'X-Requested-With': 'XMLHttpRequest',
                        'Origin': BASE + '/',
                        'Referer': url,
                    }
                    r2 = sports_crawler.SESSION.post(BASE + '/', data=payload, headers=headers, timeout=10, verify=False)
                    data = r2.json()
                    day_items = data.get("day_2026-06-01", [])
                    court_names = [item.get('facility_item_detail_name', '?') for item in day_items]
                    print(f"  코드: {c}")
                    print(f"  코트: {court_names}")
                    discovered[c] = (court_names, url)
                except Exception as e:
                    print(f"  코드 {c[:15]}... API 오류: {e}")
    except Exception as e:
        print(f"  접속 오류 ({url}): {e}")

print(f"\n=== 발견된 새 코드 총 {len(discovered)}개 ===")
for code, (names, src) in discovered.items():
    print(f"  {code} → {names}")
    print(f"  출처: {src}")

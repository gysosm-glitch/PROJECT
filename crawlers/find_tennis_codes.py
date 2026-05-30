"""
테니스 시설 코드 탐색 스크립트
- 사이트 HTML에서 act=dispFacilityView 링크를 찾아 code 값 추출
- 각 코드로 API 호출해 실제 코트 이름 확인
"""
import os
import sys
import re
import json
from dotenv import load_dotenv

load_dotenv('.env.local')
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import sports_crawler

if not sports_crawler.login():
    print("Login failed")
    sys.exit(1)

TARGET_DATE = "20260601"

# 탐색할 테니스 관련 URL들
urls_to_check = [
    'https://sports.cbnu.ac.kr/cbnu_facilities1_2_4',  # 테니스장 관련 URL 1
    'https://sports.cbnu.ac.kr/cbnu_facilities2_1_6',  # 테니스장 관련 URL 2
    'https://sports.cbnu.ac.kr/',                        # 메인
]

print("=== HTML에서 시설 코드 탐색 ===")
found_codes = set()

for url in urls_to_check:
    try:
        resp = sports_crawler.SESSION.get(url, verify=False, timeout=15)
        html = resp.text

        # 패턴 1: act=dispFacilityView&code=XXX
        codes1 = re.findall(r'act=dispFacilityView[^"\']*code=([a-zA-Z0-9]{20,})', html)
        # 패턴 2: code=XXX (일반적인 쿼리스트링)
        codes2 = re.findall(r'[?&]code=([a-zA-Z0-9]{20,})', html)
        # 패턴 3: JavaScript 내 코드 문자열
        codes3 = re.findall(r'["\']([a-zA-Z0-9]{30,})["\']', html)

        all_codes = set(codes1 + codes2)
        # codes3에서 기존 코드들과 비슷한 패턴만 필터링 (35자 전후)
        for c in codes3:
            if 30 <= len(c) <= 40:
                all_codes.add(c)

        print(f"\nURL: {url}")
        print(f"  발견된 코드: {len(all_codes)}개")
        for c in all_codes:
            found_codes.add(c)
            print(f"  - {c} (len={len(c)})")
    except Exception as e:
        print(f"  오류: {e}")

print(f"\n=== 총 {len(found_codes)}개 고유 코드 발견 ===")

# 이미 알고 있는 코드와 비교
known_codes = set(sports_crawler.FACILITIES.values())
new_codes = found_codes - known_codes

print(f"기존 등록 코드: {len(known_codes)}개")
print(f"새 코드 후보: {len(new_codes)}개")

# 모든 코드에 대해 API 호출해서 코트 이름 확인
all_codes_to_check = found_codes | known_codes

print("\n=== 각 코드별 API 응답 확인 ===")
cache = {}
for code in sorted(all_codes_to_check, key=lambda x: (x not in known_codes, x)):
    marker = "[기존]" if code in known_codes else "[NEW] "
    try:
        payload = f'code={code}&days={TARGET_DATE}&module=its&act=get_schedule'
        headers = {
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Requested-With': 'XMLHttpRequest',
            'Origin': 'https://sports.cbnu.ac.kr/',
            'Referer': f'https://sports.cbnu.ac.kr/',
        }
        resp = sports_crawler.SESSION.post('https://sports.cbnu.ac.kr/', data=payload, headers=headers, timeout=10)
        data = resp.json()

        date_key = f"day_2026-06-01"
        day_items = data.get(date_key, [])

        court_names = [item.get('facility_item_detail_name', '?') for item in day_items]
        print(f"{marker} {code[:20]}... → 코트 {len(day_items)}개: {court_names}")
    except Exception as e:
        print(f"{marker} {code[:20]}... → 오류: {e}")

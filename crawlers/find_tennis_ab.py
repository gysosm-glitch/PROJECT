"""
테니스 A, B코트의 API 코드를 사이트에서 직접 탐색
- 시설 목록 페이지들을 전부 순회하며 dispFacilityView 링크 수집
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

# 가능한 테니스 관련 페이지 URL 패턴들을 시도
# 사이트 구조: cbnu_facilities{카테고리}_{번호}
# 기존에 확인된 URL: cbnu_facilities1_2_4, cbnu_facilities2_1_6
tennis_candidate_urls = [
    # 테니스 1코트 그룹
    f'{BASE}/cbnu_facilities1_2_1',
    f'{BASE}/cbnu_facilities1_2_2',
    f'{BASE}/cbnu_facilities1_2_3',
    f'{BASE}/cbnu_facilities1_2_4',
    f'{BASE}/cbnu_facilities1_2_5',
    f'{BASE}/cbnu_facilities1_2_6',
    # 테니스 2코트 그룹
    f'{BASE}/cbnu_facilities2_1_1',
    f'{BASE}/cbnu_facilities2_1_2',
    f'{BASE}/cbnu_facilities2_1_3',
    f'{BASE}/cbnu_facilities2_1_4',
    f'{BASE}/cbnu_facilities2_1_5',
    f'{BASE}/cbnu_facilities2_1_6',
    f'{BASE}/cbnu_facilities2_1_7',
    f'{BASE}/cbnu_facilities2_1_8',
    # 테니스 3코트 그룹
    f'{BASE}/cbnu_facilities3_1',
    f'{BASE}/cbnu_facilities3_2',
    f'{BASE}/cbnu_facilities3_3',
    f'{BASE}/cbnu_facilities3_4',
]

known_codes = set(sports_crawler.FACILITIES.values())
found_new = {}

print("=== 페이지 순회 시작 ===")
for url in tennis_candidate_urls:
    try:
        resp = sports_crawler.SESSION.get(url, verify=False, timeout=10)
        if resp.status_code != 200:
            continue
        html = resp.text
        
        # dispFacilityView 링크에서 code 추출
        codes = re.findall(r'act=dispFacilityView[^"\'<>]*?code=([a-zA-Z0-9]{25,})', html)
        # 또는 href에서
        codes += re.findall(r'code=([a-zA-Z0-9]{25,})', html)
        
        unique = set(codes) - known_codes
        if unique:
            print(f"\n[NEW CODE FOUND] {url}")
            for c in unique:
                print(f"  코드: {c}")
                found_new[c] = url
        elif codes:
            # 기존 코드만 나온 경우
            pass
        else:
            pass
    except Exception as e:
        print(f"  오류 ({url}): {e}")

print(f"\n=== 새 코드 {len(found_new)}개 발견 ===")
for code, src_url in found_new.items():
    try:
        payload = f'code={code}&days={TARGET_DATE}&module=its&act=get_schedule'
        headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Requested-With': 'XMLHttpRequest',
            'Origin': BASE + '/',
            'Referer': src_url,
        }
        resp = sports_crawler.SESSION.post(BASE + '/', data=payload, headers=headers, timeout=10, verify=False)
        data = resp.json()
        day_items = data.get("day_2026-06-01", [])
        court_names = [item.get('facility_item_detail_name', '?') for item in day_items]
        print(f"  {code[:20]}... → 코트 {len(day_items)}개: {court_names}")
        print(f"  출처: {src_url}")
    except Exception as e:
        print(f"  {code[:20]}... → API 오류: {e}")

if not found_new:
    print("새 코드를 못 찾았습니다.")
    print("\n사이트 메인 네비게이션에서 직접 찾아봅니다...")
    resp = sports_crawler.SESSION.get(BASE, verify=False, timeout=15)
    # 시설예약 관련 링크들 추출
    links = re.findall(r'href=["\']([^"\']*(?:facilit|tennis|court)[^"\']*)["\']', resp.text, re.IGNORECASE)
    nav_links = re.findall(r'href=["\']([^"\']*cbnu_facilit[^"\']*)["\']', resp.text)
    print(f"시설 관련 링크 {len(set(nav_links))}개:")
    for l in set(nav_links):
        print(f"  {l}")

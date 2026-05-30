"""
시설 목록 API 직접 호출로 모든 시설 코드 수집
XE CMS의 시설예약 모듈 API를 직접 호출
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

headers = {
    'Accept': 'application/json, text/javascript, */*; q=0.01',
    'Content-Type': 'application/x-www-form-urlencoded',
    'X-Requested-With': 'XMLHttpRequest',
    'Origin': BASE + '/',
    'Referer': BASE + '/',
}

# XE CMS 시설예약 모듈 - 시설 목록 조회 API
list_payloads = [
    'module=its&act=get_facility_list',
    'module=its&act=getFacilityList',
    'module=its&act=dispFacilityList',
    'module=its&act=get_facility',
    'mid=cbnu_facilities&module=its&act=get_facility_list',
    'mid=cbnu_facilities3_1&module=its&act=get_facility_list',
    'mid=cbnu_facilities1_2&module=its&act=get_facility_list',
]

print("=== ITS 모듈 시설 목록 API 탐색 ===")
for payload in list_payloads:
    try:
        resp = sports_crawler.SESSION.post(BASE + '/', data=payload, headers=headers, timeout=10, verify=False)
        if resp.status_code == 200:
            try:
                data = resp.json()
                if data and data != {'error': -1} and 'error' not in str(data)[:50]:
                    print(f"\n[!] payload: {payload}")
                    print(f"  응답: {json.dumps(data, ensure_ascii=False)[:500]}")
            except:
                text = resp.text[:200]
                if text and '<html' not in text.lower() and len(text) > 10:
                    print(f"  payload: {payload} → {text}")
    except Exception as e:
        pass

# mid별로 시설 코드 가져오는 API 시도
print("\n=== mid별 시설 코드 조회 ===")
mids_to_try = [
    'cbnu_facilities1_2_1', 'cbnu_facilities1_2_2', 'cbnu_facilities1_2_3',
    'cbnu_facilities1_2_4', 'cbnu_facilities1_2_5',
    'cbnu_facilities2_1_1', 'cbnu_facilities2_1_2', 'cbnu_facilities2_1_3',
    'cbnu_facilities2_1_4', 'cbnu_facilities2_1_5', 'cbnu_facilities2_1_6',
    'cbnu_facilities3_1', 'cbnu_facilities3_2', 'cbnu_facilities3_3',
]

known_codes = set(sports_crawler.FACILITIES.values())

for mid in mids_to_try:
    payload = f'mid={mid}&module=its&act=get_facility_list'
    try:
        resp = sports_crawler.SESSION.post(BASE + '/', data=payload, headers=headers, timeout=8, verify=False)
        try:
            data = resp.json()
            codes_in_resp = re.findall(r'[a-zA-Z0-9]{25,40}', json.dumps(data))
            new_codes = set(codes_in_resp) - known_codes
            if new_codes:
                print(f"  [{mid}] 새 코드: {new_codes}")
                for c in new_codes:
                    # API로 확인
                    p2 = f'code={c}&days={TARGET_DATE}&module=its&act=get_schedule'
                    r2 = sports_crawler.SESSION.post(BASE + '/', data=p2, headers=headers, timeout=8, verify=False)
                    d2 = r2.json()
                    items = d2.get('day_2026-06-01', [])
                    names = [i.get('facility_item_detail_name', '?') for i in items]
                    print(f"    코드 {c} → {names}")
        except:
            pass
    except:
        pass

# get_facility_item_list 등도 시도
print("\n=== 시설 상세 항목 목록 API 시도 ===")
known_code_sample = 'mMSbwWGYZMNkkZXEasNuxGiQkpCTlG2Xkmpv'  # 테니스 C,D,E 코드
item_payloads = [
    f'module=its&act=get_facility_item_list&code={known_code_sample}',
    f'module=its&act=dispFacilityView&code={known_code_sample}',
    f'code={known_code_sample}&module=its&act=get_info',
]
for payload in item_payloads:
    try:
        resp = sports_crawler.SESSION.post(BASE + '/', data=payload, headers=headers, timeout=10, verify=False)
        try:
            data = resp.json()
            print(f"  payload: {payload[:60]}")
            print(f"  응답: {json.dumps(data, ensure_ascii=False)[:400]}")
        except:
            pass
    except:
        pass

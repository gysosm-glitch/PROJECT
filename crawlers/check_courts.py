"""
각 시설 코드가 어떤 코트를 반환하는지 정확히 확인
"""
import os, sys, requests
from dotenv import load_dotenv

load_dotenv('.env.local')
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import sports_crawler

if not sports_crawler.login():
    print("Login failed"); sys.exit(1)

TARGET_DATE = "20260601"

# 현재 FACILITIES의 모든 고유 코드들
unique_codes = {
    'k8SXwWKYYsNokZnEbsNsxGSQkpCTlG2Xkmpv': '종합운동장',
    'lcSWwWiYacNmkZfEbsNsxGyQlJCTlG2Xkmpv': '소운동장',
    'lMSUwWWYZcNpkZTEZ8NtxGSQmZCTlG2Xkmpv': '풋살(기존)',
    'mcSVwWaYZ8NkkZLEbMNwxGiQk5CTlG2Xkmpv': '농구(기존)',
    'mMSbwWGYZMNkkZXEasNuxGiQkpCTlG2Xkmpv': '테니스(기존)',
}

print(f"{'코드':<45} {'시설명':<15} {'코트 수':>6}  코트 이름")
print("-" * 90)

for code, label in unique_codes.items():
    try:
        payload = f'code={code}&days={TARGET_DATE}&module=its&act=get_schedule'
        headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Requested-With': 'XMLHttpRequest',
            'Origin': 'https://sports.cbnu.ac.kr/',
            'Referer': 'https://sports.cbnu.ac.kr/',
        }
        resp = sports_crawler.SESSION.post(
            'https://sports.cbnu.ac.kr/', data=payload, headers=headers, timeout=10, verify=False
        )
        data = resp.json()
        day_items = data.get("day_2026-06-01", [])
        court_names = [item.get('facility_item_detail_name', '?') for item in day_items]
        print(f"{code}  {label:<15} {len(day_items):>6}  {court_names}")
    except Exception as e:
        print(f"{code}  {label:<15}  오류: {e}")

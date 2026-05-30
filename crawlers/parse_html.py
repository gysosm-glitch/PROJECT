"""
테니스 예약 페이지 HTML에서 A,B,C,D,E 코트 스케줄 데이터 직접 파싱
"""
import os, sys, re, json
from dotenv import load_dotenv

load_dotenv('.env.local')
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import sports_crawler

if not sports_crawler.login():
    print("Login failed"); sys.exit(1)

BASE = 'https://sports.cbnu.ac.kr'
# 사용자가 제공한 실제 페이지 URL
code = 'mMSXwWaYZMNqkZXEacNuxGmQmZCTlG2Xkmpv'
url = f'{BASE}/index.php?mid=cbnu_facilities3_1&act=dispFacilityView&code={code}'

print(f"페이지 접속: {url}")
resp = sports_crawler.SESSION.get(url, verify=False, timeout=20)
html = resp.text

print(f"HTML 길이: {len(html)} bytes")

# 1) JavaScript 변수에서 스케줄 데이터 탐색
# XE CMS는 보통 JS 변수로 데이터를 넘김
js_patterns = [
    r'var\s+schedule_data\s*=\s*(\{.*?\});',
    r'var\s+facility_data\s*=\s*(\{.*?\});',
    r'schedule\s*=\s*(\[.*?\]);',
    r'unavailable\s*:\s*(\[.*?\])',
    r'"facility_item_detail_name"\s*:\s*"([^"]+)"',
    r'A코트|B코트|C코트|D코트|E코트',
]

print("\n=== 코트명 직접 검색 ===")
for pattern in [r'A코트', r'B코트', r'C코트', r'D코트', r'E코트']:
    matches = re.findall(pattern, html)
    print(f"  '{pattern}': {len(matches)}개 발견")

# 2) facility_item_detail_name 탐색
print("\n=== facility_item_detail_name 탐색 ===")
names = re.findall(r'facility_item_detail_name["\s:]+([^"<,}]+)', html)
print(f"  발견: {names[:20]}")

# 3) 코트 관련 div/section 탐색
print("\n=== 코트 관련 클래스/ID 탐색 ===")
court_divs = re.findall(r'class=["\'][^"\']*(?:court|facility|schedule)[^"\']*["\']', html, re.IGNORECASE)
print(f"  발견: {set(court_divs)}")

# 4) JS 변수 블록 탐색
print("\n=== JS var/let/const 변수 목록 ===")
js_vars = re.findall(r'(?:var|let|const)\s+(\w+)\s*=', html)
print(f"  {set(js_vars)}")

# 5) JSON 형태 데이터 탐색 (facility 관련)
print("\n=== facility 관련 JSON 블록 ===")
json_blocks = re.findall(r'\{[^{}]*facility[^{}]*\}', html)
for block in json_blocks[:5]:
    print(f"  {block[:200]}")

# HTML 일부 저장 (디버깅용)
with open('crawlers/page_html.txt', 'w', encoding='utf-8', errors='replace') as f:
    f.write(html)
print(f"\nHTML 전체를 crawlers/page_html.txt 에 저장했습니다.")

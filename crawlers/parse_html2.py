"""
로그인 후 테니스 예약 페이지 HTML에서 A~E 코트 스케줄 파싱
"""
import os, sys, re, json
from dotenv import load_dotenv

load_dotenv('.env.local')
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import sports_crawler

if not sports_crawler.login():
    print("Login failed"); sys.exit(1)

# 로그인 확인
print(f"쿠키: {dict(sports_crawler.SESSION.cookies)}")

BASE = 'https://sports.cbnu.ac.kr'
code = 'mMSXwWaYZMNqkZXEacNuxGmQmZCTlG2Xkmpv'
url = f'{BASE}/index.php?mid=cbnu_facilities3_1&act=dispFacilityView&code={code}'

resp = sports_crawler.SESSION.get(url, verify=False, timeout=20, headers={
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Referer': BASE + '/',
})
html = resp.text

# 로그인 상태 확인
if 'dispMemberLoginForm' in html and 'xe_logged' not in str(sports_crawler.SESSION.cookies):
    print("❌ 로그인 안 됨")
else:
    print("✅ 로그인 됨")

# 페이지에서 코드 관련 JS 변수 추출
print(f"\nHTML 길이: {len(html)}")

# 코트 관련 데이터 찾기
# XE CMS facility 모듈은 보통 initSchedule() 함수에 데이터를 넘김
init_match = re.search(r'initSchedule\s*\((.*?)\)', html, re.DOTALL)
if init_match:
    print(f"initSchedule 호출: {init_match.group(1)[:500]}")

# 또는 data-* 속성에 있을 수 있음
data_attrs = re.findall(r'data-(?:code|schedule|facility|court)[^=]*=["\'][^"\']+["\']', html, re.IGNORECASE)
print(f"data-* 속성: {data_attrs[:10]}")

# facility_group 등의 패턴
groups = re.findall(r'facility_(?:group|item|srl)[^=\s]*\s*[=:]\s*["\']([^"\']+)["\']', html)
print(f"facility 관련 값: {groups[:20]}")

# 30자 이상 알파벳+숫자 모두 추출
all_codes = re.findall(r'[a-zA-Z0-9]{30,42}', html)
known = set(sports_crawler.FACILITIES.values()) | {code, 'msSbwWKYZcNskZfEbMNpxGSQl5CTlG2Xkmpv', 'mMSbwWGYZMNkkZXEasNuxGiQkpCTlG2Xkmpv'}
new_codes = set(all_codes) - known
print(f"\n새 코드 후보 (30~42자): {new_codes}")

# HTML 일부 출력 (205~230줄 주변)
lines = html.split('\n')
for i, line in enumerate(lines[200:250], start=200):
    if any(kw in line for kw in ['code', 'schedule', 'facility', 'init', 'court']):
        print(f"  L{i}: {line.strip()[:120]}")

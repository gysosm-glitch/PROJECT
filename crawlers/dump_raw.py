"""
get_schedule 전체 raw 응답 덤프
"""
import os, sys, json
from dotenv import load_dotenv

load_dotenv('.env.local')
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import sports_crawler

if not sports_crawler.login():
    print("Login failed"); sys.exit(1)

BASE = 'https://sports.cbnu.ac.kr'
code = 'msSbwWKYZcNskZfEbMNpxGSQl5CTlG2Xkmpv'

headers = {
    'Accept': 'application/json, text/javascript, */*; q=0.01',
    'Content-Type': 'application/x-www-form-urlencoded',
    'X-Requested-With': 'XMLHttpRequest',
    'Origin': BASE + '/',
    'Referer': f'{BASE}/index.php?mid=cbnu_facilities3_1&act=dispFacilityView&code={code}',
}

payload = f'code={code}&days=20260601&module=its&act=get_schedule'
resp = sports_crawler.SESSION.post(BASE + '/', data=payload, headers=headers, timeout=15, verify=False)
data = resp.json()

# 전체 JSON 덤프
print("=== 전체 응답 키 ===")
print(list(data.keys()))

print("\n=== 전체 JSON (pretty) ===")
print(json.dumps(data, ensure_ascii=False, indent=2))

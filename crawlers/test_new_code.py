import os, sys, json
from dotenv import load_dotenv
load_dotenv('.env.local')
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import sports_crawler
sports_crawler.login()

BASE = 'https://sports.cbnu.ac.kr'
code = 'mMSXwWaYZMNqkZXEacNuxGmQmZCTlG2Xkmpv'

headers = {
    'Accept': 'application/json, text/javascript, */*; q=0.01',
    'Content-Type': 'application/x-www-form-urlencoded',
    'X-Requested-With': 'XMLHttpRequest',
    'Origin': BASE + '/',
    'Referer': f'{BASE}/index.php?mid=cbnu_facilities3_1&act=dispFacilityView&code={code}',
}

payload = f'code={code}&days=20260605&module=its&act=get_schedule'
resp = sports_crawler.SESSION.post(BASE + '/', data=payload, headers=headers, timeout=15, verify=False)
data = resp.json()

print("=== 전체 응답 ===")
print(json.dumps(data, ensure_ascii=False, indent=2))

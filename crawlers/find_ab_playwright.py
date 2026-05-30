"""
Playwright로 브라우저를 직접 렌더링해 테니스 A,B코트 API 코드 추출
"""
import os, sys, re, asyncio
from dotenv import load_dotenv

load_dotenv('.env.local')

USERNAME = os.environ['SPORTS_USERNAME']
PASSWORD = os.environ['SPORTS_PASSWORD']
BASE = 'https://sports.cbnu.ac.kr'
TARGET_DATE = "20260601"

# 이미 알고 있는 코드
KNOWN_CODES = {
    'k8SXwWKYYsNokZnEbsNsxGSQkpCTlG2Xkmpv': '종합운동장',
    'lcSWwWiYacNmkZfEbsNsxGyQlJCTlG2Xkmpv': '소운동장',
    'lMSUwWWYZcNpkZTEZ8NtxGSQmZCTlG2Xkmpv': '풋살(A,B코트)',
    'mcSVwWaYZ8NkkZLEbMNwxGiQk5CTlG2Xkmpv': '농구(A,B코트)',
    'mMSbwWGYZMNkkZXEasNuxGiQkpCTlG2Xkmpv': '테니스(C,D,E코트)',
}

async def main():
    from playwright.async_api import async_playwright

    # 탐색할 시설 페이지들 (테니스 관련)
    facility_pages = [
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
        f'{BASE}/cbnu_facilities3_1',
        f'{BASE}/cbnu_facilities3_2',
        f'{BASE}/cbnu_facilities3_3',
    ]

    found = {}

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ctx = await browser.new_context(ignore_https_errors=True)

        # 로그인
        page = await ctx.new_page()
        print("로그인 중...")
        await page.goto(f'{BASE}/index.php?mid=cbnu_main&act=dispMemberLoginForm', timeout=20000)
        await page.fill('input[name="user_id"]', USERNAME)
        await page.fill('input[name="password"]', PASSWORD)
        await page.click('button[type="submit"], input[type="submit"], .btn_login')
        await page.wait_for_timeout(2000)
        print(f"로그인 완료: {page.url}")

        # 각 시설 페이지 탐색
        for url in facility_pages:
            try:
                # 네트워크 요청 모니터링
                api_codes_from_requests = []

                def on_request(request):
                    if 'get_schedule' in request.url or 'act=get_schedule' in (request.post_data or ''):
                        post_data = request.post_data or ''
                        codes = re.findall(r'code=([a-zA-Z0-9]{25,})', post_data)
                        api_codes_from_requests.extend(codes)

                page.on('request', on_request)

                await page.goto(url, timeout=15000)
                await page.wait_for_timeout(3000)  # JS 실행 대기

                # 페이지 소스에서 코드 추출
                content = await page.content()
                codes_in_page = re.findall(r'code[=:]["\s]*([a-zA-Z0-9]{25,40})', content)
                codes_in_page += re.findall(r'["\']([a-zA-Z0-9]{30,40})["\']', content)

                # 페이지 타이틀 확인
                title = await page.title()

                all_codes = set(codes_in_page + api_codes_from_requests) - set(KNOWN_CODES.keys())
                # 가짜 코드 필터링 (길이 30~40)
                valid_codes = {c for c in all_codes if 28 <= len(c) <= 42}

                if valid_codes:
                    print(f"\n[!] {url} (제목: {title})")
                    for code in valid_codes:
                        print(f"  새 코드 발견: {code}")
                        found[code] = url
                else:
                    print(f"  {url.split('/')[-1]:30} → '{title}' (새 코드 없음)")

                page.remove_listener('request', on_request)

            except Exception as e:
                print(f"  오류 ({url}): {e}")

        await browser.close()

    print(f"\n=== 총 {len(found)}개 새 코드 발견 ===")
    for code, src in found.items():
        print(f"  {code}")
        print(f"  출처: {src}")

    # 새 코드들을 API로 확인
    if found:
        import requests as req
        import json

        sess = req.Session()
        # 로그인
        sess.post(
            f'{BASE}/index.php?mid=cbnu_main&act=procMemberLogin',
            data={'user_id': USERNAME, 'password': PASSWORD, 'module': 'member', 'act': 'procMemberLogin', 'mid': 'cbnu_main'},
            headers={'Content-Type': 'application/x-www-form-urlencoded', 'X-Requested-With': 'XMLHttpRequest'},
            verify=False, timeout=15
        )

        print("\n=== API 응답 확인 ===")
        for code in found:
            payload = f'code={code}&days={TARGET_DATE}&module=its&act=get_schedule'
            headers = {
                'Accept': 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-Requested-With': 'XMLHttpRequest',
                'Origin': BASE + '/',
            }
            try:
                r = sess.post(BASE + '/', data=payload, headers=headers, verify=False, timeout=10)
                data = r.json()
                items = data.get('day_2026-06-01', [])
                names = [i.get('facility_item_detail_name', '?') for i in items]
                print(f"  {code} → 코트 {len(items)}개: {names}")
            except Exception as e:
                print(f"  {code} → 오류: {e}")

asyncio.run(main())

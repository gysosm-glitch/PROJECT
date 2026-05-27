"""
충북대 매칭 플랫폼 - 공모전 크롤러
대상: 공모전닷컴, 위비티, 링커리어
실행: GitHub Actions - 매일 KST 02:00 (UTC 17:00)
"""

import os
import re
import time
import logging
from datetime import datetime, date
from typing import Optional

import requests
from bs4 import BeautifulSoup
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv('.env.local')

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s'
)
logger = logging.getLogger(__name__)

SUPABASE_URL = os.environ.get('NEXT_PUBLIC_SUPABASE_URL', '')
SUPABASE_KEY = os.environ.get('SUPABASE_SERVICE_KEY', '')

def supabase_upsert(table: str, data: dict, on_conflict: str):
    url = f"{SUPABASE_URL}/rest/v1/{table}?on_conflict={on_conflict}"
    headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}',
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
    }
    resp = requests.post(url, json=data, headers=headers)
    resp.raise_for_status()
    return resp

def supabase_update(table: str, data: dict, conditions: dict):
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    # This is a simplified query builder
    params = []
    for k, v in conditions.items():
        if k == 'lt_end_date':
            params.append(f"end_date=lt.{v}")
        elif k == 'eq_is_active':
            params.append(f"is_active=eq.{v}")
    
    if params:
        url += "?" + "&".join(params)
    
    headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}',
        'Content-Type': 'application/json'
    }
    resp = requests.patch(url, json=data, headers=headers)
    resp.raise_for_status()
    return resp

# 분야 매핑 규칙
FIELD_KEYWORDS = {
    'marketing': ['마케팅', '아이디어', '광고', '홍보', 'PR', '브랜드'],
    'video': ['영상', 'UCC', '사진', '영화', '유튜브', '단편'],
    'design': ['디자인', 'UI', 'UX', '캐릭터', '타이포', '그래픽'],
    'literature': ['문학', '글쓰기', '시', '소설', '수필', '시나리오', '웹툰'],
    'it': ['IT', '소프트웨어', '개발', '해커톤', '앱', '인공지능', 'AI', '빅데이터', '블록체인'],
    'arts': ['예체능', '음악', '미술', '공연', '댄스', '사진', '조각'],
    'academic': ['학술', '창업', '논술', '스타트업', '논문', '정책', '사회'],
}

def map_field(title: str, category: str = '') -> str:
    """공모전 제목/카테고리로 분야 자동 매핑"""
    text = (title + ' ' + category).lower()
    for field, keywords in FIELD_KEYWORDS.items():
        for kw in keywords:
            if kw.lower() in text:
                return field
    return 'academic'  # 기본값

def upsert_contest(contest: dict) -> bool:
    """Supabase에 공모전 upsert (URL 기준 중복 방지)"""
    try:
        supabase_upsert('contests', contest, on_conflict='url')
        return True
    except Exception as e:
        logger.error(f"Upsert 실패: {e} | URL: {contest.get('url', '')[:80]}")
        return False

def deactivate_expired():
    """마감일 지난 공모전 비활성화"""
    today = date.today().isoformat()
    try:
        supabase_update(
            'contests',
            {'is_active': False},
            {'lt_end_date': today, 'eq_is_active': 'true'}
        )
        logger.info(f"만료 공모전 비활성화 완료")
    except Exception as e:
        logger.error(f"비활성화 오류: {e}")


# ================================================
# 공모전닷컴 크롤러
# ================================================
def crawl_contestkorea():
    """공모전닷컴 (www.contestkorea.com) 크롤링"""
    logger.info("=== 공모전닷컴 크롤링 시작 ===")
    base_url = 'https://www.contestkorea.com'
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'ko-KR,ko;q=0.9',
    }

    count = 0
    for page in range(1, 6):  # 최대 5페이지
        try:
            url = f'{base_url}/sub/list.php?Txt_bcode=1&page={page}'
            resp = requests.get(url, headers=headers, timeout=15)
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, 'lxml')

            items = soup.select('.list_style_con li')
            if not items:
                break

            for item in items:
                try:
                    title_el = item.select_one('.list_text_box h2 a')
                    if not title_el:
                        continue

                    title = title_el.get_text(strip=True)
                    detail_url = base_url + title_el.get('href', '')
                    thumbnail = item.select_one('img')
                    thumbnail_url = thumbnail.get('src', '') if thumbnail else None

                    # 날짜 파싱
                    date_el = item.select_one('.contest_date')
                    end_date = None
                    if date_el:
                        date_text = date_el.get_text(strip=True)
                        match = re.search(r'(\d{4})[.\-](\d{2})[.\-](\d{2})', date_text)
                        if match:
                            end_date = f"{match.group(1)}-{match.group(2)}-{match.group(3)}"

                    if not end_date:
                        continue

                    # 주최기관
                    organizer_el = item.select_one('.contest_organizer')
                    organizer = organizer_el.get_text(strip=True) if organizer_el else None

                    # 분야 태그
                    category_el = item.select_one('.list_icon span')
                    category = category_el.get_text(strip=True) if category_el else ''

                    contest = {
                        'title': title,
                        'organizer': organizer,
                        'field': map_field(title, category),
                        'end_date': end_date,
                        'url': detail_url,
                        'thumbnail_url': thumbnail_url,
                        'is_active': True,
                        'source': 'contestkorea',
                        'last_crawled_at': datetime.utcnow().isoformat(),
                    }

                    if upsert_contest(contest):
                        count += 1

                except Exception as e:
                    logger.warning(f"항목 파싱 오류: {e}")

            time.sleep(1)

        except Exception as e:
            logger.error(f"공모전닷컴 페이지 {page} 오류: {e}")

    logger.info(f"공모전닷컴: {count}건 처리 완료")


# ================================================
# 위비티 크롤러
# ================================================
def crawl_wevity():
    """위비티 (www.wevity.com) 크롤링"""
    logger.info("=== 위비티 크롤링 시작 ===")
    base_url = 'https://www.wevity.com'
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'ko-KR,ko;q=0.9',
    }

    count = 0
    for page in range(1, 6):
        try:
            url = f'{base_url}/?c=find&s=1&gub=1&sGub=1&cate=1&page={page}'
            resp = requests.get(url, headers=headers, timeout=15)
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, 'lxml')

            items = soup.select('.list-item')
            if not items:
                break

            for item in items:
                try:
                    title_el = item.select_one('.list-tit a')
                    if not title_el:
                        continue

                    title = title_el.get_text(strip=True)
                    href = title_el.get('href', '')
                    detail_url = base_url + href if href.startswith('/') else href

                    thumbnail_el = item.select_one('img')
                    thumbnail_url = None
                    if thumbnail_el:
                        src = thumbnail_el.get('src', '')
                        thumbnail_url = (base_url + src) if src.startswith('/') else src

                    # 마감일
                    date_el = item.select_one('.due-date')
                    end_date = None
                    if date_el:
                        match = re.search(r'(\d{4})[.\-](\d{2})[.\-](\d{2})', date_el.get_text())
                        if match:
                            end_date = f"{match.group(1)}-{match.group(2)}-{match.group(3)}"

                    if not end_date:
                        continue

                    # 주최
                    org_el = item.select_one('.organizer')
                    organizer = org_el.get_text(strip=True) if org_el else None

                    # 카테고리
                    cat_el = item.select_one('.category')
                    category = cat_el.get_text(strip=True) if cat_el else ''

                    contest = {
                        'title': title,
                        'organizer': organizer,
                        'field': map_field(title, category),
                        'end_date': end_date,
                        'url': detail_url,
                        'thumbnail_url': thumbnail_url,
                        'is_active': True,
                        'source': 'wevity',
                        'last_crawled_at': datetime.utcnow().isoformat(),
                    }

                    if upsert_contest(contest):
                        count += 1

                except Exception as e:
                    logger.warning(f"항목 파싱 오류: {e}")

            time.sleep(1)

        except Exception as e:
            logger.error(f"위비티 페이지 {page} 오류: {e}")

    logger.info(f"위비티: {count}건 처리 완료")


# ================================================
# 링커리어 크롤러 (Playwright - JS 렌더링)
# ================================================
def crawl_linkareer():
    """링커리어 (linkareer.com) 크롤링 - Playwright 사용"""
    logger.info("=== 링커리어 크롤링 시작 ===")
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        logger.error("playwright가 설치되지 않았습니다. pip install playwright && playwright install chromium")
        return

    count = 0
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.set_extra_http_headers({'Accept-Language': 'ko-KR'})

        try:
            for pg in range(1, 4):  # 최대 3페이지
                page.goto(f'https://linkareer.com/list/contest?page={pg}', timeout=30000)
                page.wait_for_selector('.activity-list-item', timeout=10000)

                items = page.query_selector_all('.activity-list-item')
                if not items:
                    break

                for item in items:
                    try:
                        title_el = item.query_selector('h3, .title')
                        if not title_el:
                            continue
                        title = title_el.inner_text().strip()

                        link_el = item.query_selector('a')
                        href = link_el.get_attribute('href') if link_el else ''
                        detail_url = f'https://linkareer.com{href}' if href.startswith('/') else href

                        img_el = item.query_selector('img')
                        thumbnail_url = img_el.get_attribute('src') if img_el else None

                        date_el = item.query_selector('.deadline, .date')
                        end_date = None
                        if date_el:
                            match = re.search(r'(\d{4})[.\-](\d{2})[.\-](\d{2})', date_el.inner_text())
                            if match:
                                end_date = f"{match.group(1)}-{match.group(2)}-{match.group(3)}"

                        if not end_date or not detail_url:
                            continue

                        cat_el = item.query_selector('.category, .tag')
                        category = cat_el.inner_text().strip() if cat_el else ''

                        contest = {
                            'title': title,
                            'field': map_field(title, category),
                            'end_date': end_date,
                            'url': detail_url,
                            'thumbnail_url': thumbnail_url,
                            'is_active': True,
                            'source': 'linkareer',
                            'last_crawled_at': datetime.utcnow().isoformat(),
                        }

                        if upsert_contest(contest):
                            count += 1

                    except Exception as e:
                        logger.warning(f"항목 파싱 오류: {e}")

                time.sleep(2)

        except Exception as e:
            logger.error(f"링커리어 크롤링 오류: {e}")
        finally:
            browser.close()

    logger.info(f"링커리어: {count}건 처리 완료")


if __name__ == '__main__':
    logger.info("===== 공모전 크롤러 시작 =====")
    start = datetime.now()

    crawl_contestkorea()
    crawl_wevity()
    crawl_linkareer()
    deactivate_expired()

    elapsed = (datetime.now() - start).seconds
    logger.info(f"===== 크롤링 완료 ({elapsed}초) =====")

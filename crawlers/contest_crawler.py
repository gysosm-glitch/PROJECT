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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'ko-KR,ko;q=0.9',
    }

    count = 0
    for page in range(1, 6):  # 최대 5페이지
        try:
            url = f'{base_url}/sub/list.php?int_gbn=1&page={page}'
            resp = requests.get(url, headers=headers, timeout=15)
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, 'lxml')

            items = soup.select('.list_style_2 li')
            if not items:
                # Fallback check
                items = [li for li in soup.find_all("li") if li.find("div", class_="title") and li.find("ul", class_="host")]
                
            if not items:
                break

            for item in items:
                try:
                    title_el = item.select_one('.title .txt')
                    if not title_el:
                        title_el = item.select_one('.title a')
                    if not title_el:
                        continue

                    title = title_el.get_text(strip=True)
                    
                    link_el = item.select_one('.title a')
                    if not link_el:
                        continue
                    detail_url = base_url + link_el.get('href', '')

                    # 주최기관
                    organizer_el = item.select_one('.host .icon_1')
                    organizer = None
                    if organizer_el:
                        organizer = organizer_el.get_text(strip=True).replace('주최', '').strip().lstrip('.').strip()

                    # 분야 태그
                    category_el = item.select_one('.title .category')
                    category = category_el.get_text(strip=True) if category_el else ''

                    # 날짜 파싱
                    date_el = item.select_one('.date .step-1')
                    if not date_el:
                        date_el = item.select_one('.date')
                        
                    end_date = None
                    if date_el:
                        date_text = date_el.get_text(strip=True)
                        # Match formats like 05.25~07.12
                        match = re.search(r'(\d{2})[.\-/](\d{2})~(\d{2})[.\-/](\d{2})', date_text)
                        if match:
                            end_month = match.group(3)
                            end_day = match.group(4)
                            current_year = datetime.now().year
                            if int(end_month) < datetime.now().month:
                                end_year = current_year + 1
                            else:
                                end_year = current_year
                            end_date = f"{end_year}-{end_month}-{end_day}"

                    if not end_date:
                        continue

                    contest = {
                        'title': title,
                        'organizer': organizer,
                        'field': map_field(title, category),
                        'end_date': end_date,
                        'url': detail_url,
                        'thumbnail_url': None,
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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'ko-KR,ko;q=0.9',
    }

    count = 0
    for page in range(1, 6):
        try:
            url = f'{base_url}/?c=find&s=1&gub=1&sGub=1&cate=1&page={page}'
            resp = requests.get(url, headers=headers, timeout=15)
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, 'lxml')

            items = soup.select('ul.list li')
            if not items:
                break

            for item in items:
                try:
                    # Skip table header item
                    if 'top' in item.get('class', []):
                        continue
                        
                    title_el = item.select_one('div.tit a')
                    if not title_el:
                        continue

                    # Extract title cleanly
                    title_a = BeautifulSoup(str(title_el), 'lxml').find('a')
                    span = title_a.find('span')
                    if span:
                        span.decompose()
                    title = title_a.get_text(strip=True)

                    href = title_el.get('href', '')
                    detail_url = base_url + '/' + href if not href.startswith('http') else href

                    # 카테고리
                    cat_el = item.select_one('div.tit div.sub-tit')
                    category = cat_el.get_text(strip=True) if cat_el else ''

                    # 주최
                    org_el = item.select_one('div.organ')
                    organizer = org_el.get_text(strip=True) if org_el else None

                    # 마감일 (D-Day 계산)
                    date_el = item.select_one('div.day')
                    end_date = None
                    if date_el:
                        date_text = date_el.get_text(strip=True)
                        match = re.search(r'D\-(\d+)', date_text)
                        days_offset = None
                        if match:
                            days_offset = int(match.group(1))
                        elif 'd-day' in date_text.lower():
                            days_offset = 0
                            
                        if days_offset is not None:
                            from datetime import timedelta
                            dt = datetime.utcnow() + timedelta(days=days_offset)
                            # Adjust to KST
                            kst_dt = dt + timedelta(hours=9)
                            end_date = kst_dt.strftime("%Y-%m-%d")

                    if not end_date:
                        continue

                    contest = {
                        'title': title,
                        'organizer': organizer,
                        'field': map_field(title, category),
                        'end_date': end_date,
                        'url': detail_url,
                        'thumbnail_url': None,
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
# 링커리어 크롤러 (Next.js SSR __NEXT_DATA__ JSON 파싱 기반)
# ================================================
def crawl_linkareer():
    """링커리어 (linkareer.com) 크롤링 - Next.js SSR __NEXT_DATA__ JSON 파싱 기반 (초고속/안정적)"""
    logger.info("=== 링커리어 크롤링 시작 ===")
    import json
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'ko-KR,ko;q=0.9',
    }

    count = 0
    for page in range(1, 4):  # 최대 3페이지
        try:
            url = f'https://linkareer.com/list/contest?page={page}'
            resp = requests.get(url, headers=headers, timeout=15)
            resp.raise_for_status()
            
            soup = BeautifulSoup(resp.text, 'lxml')
            script = soup.find('script', id='__NEXT_DATA__')
            if not script:
                logger.warning(f"링커리어 페이지 {page}: __NEXT_DATA__ 태그를 찾을 수 없습니다.")
                break
                
            data = json.loads(script.string)
            apollo = data.get("props", {}).get("pageProps", {}).get("__APOLLO_STATE__", {})
            
            items_found = False
            for key, value in apollo.items():
                if key.startswith("Activity:"):
                    items_found = True
                    try:
                        act_id = value.get("id")
                        title = value.get("title", "").strip()
                        if not title:
                            continue
                            
                        detail_url = f"https://linkareer.com/activity/{act_id}"
                        
                        # 주최기관
                        organizer = value.get("organizationName", "").strip()
                        
                        # 썸네일
                        thumb = value.get("thumbnailImage")
                        thumbnail_url = None
                        if thumb and isinstance(thumb, dict):
                            file_key = thumb.get("__ref")
                            if file_key in apollo:
                                thumbnail_url = apollo[file_key].get("url", "")
                        
                        # 마감일 (recruitCloseAt 밀리초 타임스탬프)
                        recruit_close = value.get("recruitCloseAt")
                        end_date = None
                        if recruit_close:
                            dt = datetime.fromtimestamp(recruit_close / 1000.0)
                            end_date = dt.strftime("%Y-%m-%d")
                            
                        if not end_date:
                            continue
                            
                        # 카테고리
                        category = value.get("category", "")
                        
                        contest = {
                            'title': title,
                            'organizer': organizer,
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
                            
                    except Exception as item_e:
                        logger.warning(f"항목 파싱 오류: {item_e}")
            
            if not items_found:
                logger.info(f"링커리어 페이지 {page}: 더 이상 항목이 없습니다.")
                break
                
            time.sleep(1)
            
        except Exception as e:
            logger.error(f"링커리어 페이지 {page} 오류: {e}")
            
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

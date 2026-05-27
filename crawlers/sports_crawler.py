"""
충북대 매칭 플랫폼 - 시설 예약 현황 크롤러
대상: sports.cbnu.ac.kr (충북대 스포츠 시설 예약 시스템)
실행: GitHub Actions - 매 1시간마다
인증: 충북대 계정 세션 기반
"""

import os
import time
import logging
from datetime import datetime, date, timedelta
from typing import Optional

import requests
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

def supabase_upsert(table: str, data: list, on_conflict: str):
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

# 시설 코드 매핑
FACILITIES = {
    'main_field':   'k8SXwWKYYsNokZnEbsNsxGSQkpCTlG2Xkmpv',  # 종합운동장
    'small_field':  'lcSWwWiYacNmkZfEbsNsxGyQlJCTlG2Xkmpv',  # 소운동장
    'futsal':       'lMSUwWWYZcNpkZTEZ8NtxGSQmZCTlG2Xkmpv',  # 풋살장 (A/B코트)
    'basketball':   'mcSVwWaYZ8NkkZLEbMNwxGiQk5CTlG2Xkmpv',  # 농구장 (A/B코트)
    'tennis':       'mMSbwWGYZMNkkZXEasNuxGiQkpCTlG2Xkmpv',  # 테니스장 (A~E코트)
}

BASE_URL = 'https://sports.cbnu.ac.kr/'
SESSION = requests.Session()


def login() -> bool:
    """충북대 스포츠 사이트 로그인 → PHPSESSID 획득"""
    login_url = BASE_URL + 'index.php?mid=cbnu_main&act=procMemberLogin'
    payload = {
        'user_id': os.environ['SPORTS_USERNAME'],
        'password': os.environ['SPORTS_PASSWORD'],
        'module': 'member',
        'act': 'procMemberLogin',
        'mid': 'cbnu_main',
    }
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Origin': BASE_URL,
        'Referer': BASE_URL,
        'X-Requested-With': 'XMLHttpRequest',
    }

    try:
        resp = SESSION.post(login_url, data=payload, headers=headers, timeout=15)
        # 로그인 성공 여부 확인 (xe_logged 쿠키 존재)
        if 'xe_logged' in SESSION.cookies or resp.status_code == 200:
            logger.info("로그인 성공")
            return True
        logger.error(f"로그인 실패: status={resp.status_code}")
        return False
    except Exception as e:
        logger.error(f"로그인 오류: {e}")
        return False


def get_schedule(facility_type: str, code: str, target_date: str) -> list[dict]:
    """특정 날짜의 예약 스케줄 조회"""
    headers = {
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Accept-Language': 'ko-KR,ko;q=0.9',
        'Content-Type': 'application/json',
        'Origin': BASE_URL,
        'Referer': f'{BASE_URL}index.php?mid=cbnu_facilities3_1&act=dispFacilityView&code={code}',
        'X-Requested-With': 'XMLHttpRequest',
    }
    payload = f'code={code}&days={target_date}&module=its&act=get_schedule'

    try:
        resp = SESSION.post(
            BASE_URL,
            data=payload,
            headers=headers,
            timeout=15
        )
        resp.raise_for_status()
        data = resp.json()

        slots = []
        # API 응답 파싱 (rentitem_info 구조 기반)
        schedule_data = data.get('rentitem_info', data)

        if isinstance(schedule_data, dict):
            # 시간대별 슬롯 파싱
            for key, value in schedule_data.items():
                if isinstance(value, dict) and 'start_time' in value:
                    start_time = value.get('start_time', '')
                    end_time = value.get('end_time', '')
                    status_raw = value.get('status', 'available')

                    # 상태 정규화
                    if status_raw in ['reserved', '예약완료', '1']:
                        status = 'reserved'
                    elif status_raw in ['closed', '마감', '불가']:
                        status = 'closed'
                    else:
                        status = 'available'

                    if start_time and end_time:
                        slots.append({
                            'facility': facility_type,
                            'reservation_date': target_date[:4] + '-' + target_date[4:6] + '-' + target_date[6:],
                            'start_time': start_time,
                            'end_time': end_time,
                            'status': status,
                            'last_crawled_at': datetime.utcnow().isoformat(),
                        })

        elif isinstance(schedule_data, list):
            for item in schedule_data:
                start_time = item.get('start_time') or item.get('stime', '')
                end_time = item.get('end_time') or item.get('etime', '')
                status_raw = item.get('status', 'available')

                if status_raw in ['reserved', '예약완료', '1']:
                    status = 'reserved'
                elif status_raw in ['closed', '마감', '불가']:
                    status = 'closed'
                else:
                    status = 'available'

                if start_time and end_time:
                    slots.append({
                        'facility': facility_type,
                        'reservation_date': target_date[:4] + '-' + target_date[4:6] + '-' + target_date[6:],
                        'start_time': start_time,
                        'end_time': end_time,
                        'status': status,
                        'last_crawled_at': datetime.utcnow().isoformat(),
                    })

        return slots

    except Exception as e:
        logger.error(f"get_schedule 오류 ({facility_type}, {target_date}): {e}")
        return []


def upsert_slots(slots: list[dict]) -> int:
    """예약 슬롯 Supabase upsert"""
    if not slots:
        return 0
    try:
        supabase_upsert('sports_reservations', slots, on_conflict='facility,reservation_date,start_time')
        return len(slots)
    except Exception as e:
        logger.error(f"슬롯 upsert 오류: {e}")
        return 0


def crawl_all():
    """전체 시설 × 오늘~7일 크롤링"""
    if not login():
        logger.error("로그인 실패로 크롤링 중단")
        return

    today = date.today()
    dates = [(today + timedelta(days=i)).strftime('%Y%m%d') for i in range(7)]

    total = 0
    for facility_type, code in FACILITIES.items():
        logger.info(f"--- {facility_type} 크롤링 ---")
        for d in dates:
            slots = get_schedule(facility_type, code, d)
            count = upsert_slots(slots)
            total += count
            logger.info(f"  {d}: {count}슬롯 처리")
            time.sleep(0.5)  # Rate limiting

    logger.info(f"총 {total}개 슬롯 처리 완료")


if __name__ == '__main__':
    logger.info("===== 시설 예약 크롤러 시작 =====")
    start = datetime.now()
    crawl_all()
    elapsed = (datetime.now() - start).seconds
    logger.info(f"===== 크롤링 완료 ({elapsed}초) =====")

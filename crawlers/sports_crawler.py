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
        logger.error(f"로그인 네트워크 오류 (학교 방화벽 차단 가능성 매우 높음): {e}")
        import socket
        try:
            host = "sports.cbnu.ac.kr"
            ip = socket.gethostbyname(host)
            logger.info(f"DNS 조회 성공: {host} -> {ip} (서버는 존재하나 포트가 막혔을 수 있습니다.)")
        except Exception as dns_e:
            logger.error(f"DNS 조회 실패 (네트워크 연결이 끊겼거나 DNS가 유효하지 않습니다): {dns_e}")
        return False


def get_schedule(facility_type: str, code: str, target_date: str) -> list[dict]:
    """특정 날짜의 예약 스케줄 조회 (신규 API 포맷 파싱 지원)"""
    headers = {
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Accept-Language': 'ko-KR,ko;q=0.9',
        'Content-Type': 'application/x-www-form-urlencoded',
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
        
        # 신규 API 날짜 키 매핑: 예: "day_2026-05-29"
        formatted_date = f"{target_date[:4]}-{target_date[4:6]}-{target_date[6:]}"
        date_key = f"day_{formatted_date}"
        
        day_items = data.get(date_key)
        if day_items and isinstance(day_items, list):
            for item in day_items:
                time_s = item.get('time_s', '') # 예: "07:00"
                time_e = item.get('time_e', '') # 예: "18:00"
                unavailable = item.get('unavailable', [])
                msg = item.get('msg', '')
                
                # 예약 불가 여부 판단
                is_closed = False
                if "예약가능한 날짜가 아닙니다" in msg or not time_s or not time_e:
                    is_closed = True
                    
                if time_s and time_e:
                    try:
                        start_hour = int(time_s.split(":")[0])
                        end_hour = int(time_e.split(":")[0])
                        
                        for h in range(start_hour, end_hour):
                            slot_start = f"{h:02d}:00"
                            slot_end = f"{h+1:02d}:00"
                            
                            if is_closed:
                                status = 'closed'
                            else:
                                # unavailable 목록에 해당 시간대(예: "08-00:2")가 있는지 체크
                                is_unavailable = False
                                for unav in unavailable:
                                    if unav.startswith(f"{h:02d}-00") or unav.startswith(f"{h:02d}:00"):
                                        is_unavailable = True
                                        break
                                status = 'reserved' if is_unavailable else 'available'
                                
                            slots.append({
                                'facility': facility_type,
                                'reservation_date': formatted_date,
                                'start_time': slot_start,
                                'end_time': slot_end,
                                'status': status,
                                'last_crawled_at': datetime.utcnow().isoformat(),
                            })
                    except Exception as parse_e:
                        logger.error(f"시간 파싱 오류 ({facility_type}, {target_date}): {parse_e}")
                        
        # 중복 슬롯 제거 및 병합 (예: 풋살장 A코트, B코트가 동시에 존재할 때 하나의 시설 상태로 병합)
        deduped_slots = {}
        for slot in slots:
            key = (slot['facility'], slot['reservation_date'], slot['start_time'])
            if key not in deduped_slots:
                deduped_slots[key] = slot
            else:
                existing_status = deduped_slots[key]['status']
                new_status = slot['status']
                
                # 병합 규칙: 하나라도 'available'이면 예약 가능, 둘 다 reserved이면 reserved, 그 외엔 closed
                if existing_status == 'available' or new_status == 'available':
                    merged_status = 'available'
                elif existing_status == 'reserved' or new_status == 'reserved':
                    merged_status = 'reserved'
                else:
                    merged_status = 'closed'
                    
                deduped_slots[key]['status'] = merged_status
                
        return list(deduped_slots.values())

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

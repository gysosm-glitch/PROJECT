@echo off
chcp 65001 > nul
echo ===================================================
echo 충북대 매칭 플랫폼 - 로컬 스포츠 크롤러 실행기 🏃
echo ===================================================
echo.
echo 이 실행기는 학교 방화벽(외부 클라우드 대역 차단)을 우회하여
echo 본인의 국내 인터넷망 환경을 이용해 예약 현황을 수집합니다.
echo.
echo [알림] .env.local 파일에 SPORTS_USERNAME 과 SPORTS_PASSWORD가
echo 정확히 등록되어 있는지 확인해주세요!
echo.
echo 크롤링을 시작합니다...
echo.

call .venv\Scripts\activate.bat
python crawlers\sports_crawler.py

echo.
echo ===================================================
echo 크롤링 작업이 완료되었습니다! (Supabase 웹사이트 즉시 반영)
echo ===================================================
pause

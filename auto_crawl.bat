@echo off
chcp 65001 > nul

set "PROJECTDIR=c:\Users\gysos\OneDrive\Desktop\PROJECT"
set "LOGDIR=%PROJECTDIR%\crawlers\logs"

if not exist "%LOGDIR%" mkdir "%LOGDIR%"

:: 날짜/시간 생성 (PowerShell 사용)
for /f "usebackq" %%i in (`powershell -NoProfile -Command "Get-Date -Format 'yyyyMMdd_HHmm'"`) do set "DT=%%i"
set "LOGFILE=%LOGDIR%\sports_crawl_%DT%.log"

cd /d "%PROJECTDIR%"

echo [%date% %time%] === Sports Auto crawl started === >> "%LOGFILE%" 2>&1

call "%PROJECTDIR%\.venv\Scripts\activate.bat"

echo [%date% %time%] Sports crawler starting >> "%LOGFILE%" 2>&1
python "%PROJECTDIR%\crawlers\sports_crawler.py" >> "%LOGFILE%" 2>&1

echo [%date% %time%] === Sports Auto crawl finished === >> "%LOGFILE%" 2>&1

:: 7일 이상 된 로그 자동 삭제
forfiles /p "%LOGDIR%" /m "sports_crawl_*.log" /d -7 /c "cmd /c del @path" 2>nul

exit /b 0

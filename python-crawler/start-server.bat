@echo off
echo Meta Crawler Python Server 시작...
echo.

REM Python 가상환경 활성화 (있는 경우)
if exist "venv\Scripts\activate.bat" (
    echo 가상환경 활성화 중...
    call venv\Scripts\activate.bat
)

REM 필요한 패키지 설치
echo 필요한 패키지 설치 중...
pip install -r requirements.txt

REM Chrome 드라이버 확인
echo Chrome 드라이버 확인 중...
python -c "from selenium import webdriver; from selenium.webdriver.chrome.options import Options; print('Chrome 드라이버 준비 완료')"

REM 서버 시작
echo.
echo Meta Crawler Server 시작 중...
echo 서버 주소: http://localhost:5000
echo.
python server.py

pause


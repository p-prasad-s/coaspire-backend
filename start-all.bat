@echo off
setlocal

echo Starting CoAspire local stack...

start "CoAspire AI Engine" cmd /k "cd /d ""%~dp0ai_engine"" && if not exist venv python -m venv venv && call venv\Scripts\activate && pip install -r requirements.txt && set PYTHONIOENCODING=utf-8 && python app.py"

start "CoAspire Server" cmd /k "cd /d ""%~dp0server"" && npm install && set AI_ENGINE_URL=http://127.0.0.1:5000 && node server.js"

start "CoAspire Client" cmd /k "cd /d ""%~dp0client"" && npm install && set PORT=3001 && set BROWSER=none && set REACT_APP_API_BASE=http://127.0.0.1:3000 && npm start"

echo.
echo Wait for all three windows to finish starting, then open:
echo http://localhost:3001
echo.

endlocal

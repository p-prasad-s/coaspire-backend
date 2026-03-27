# CoAspire Local Run Guide

This package contains three parts:

- `ai_engine` - Python AI service
- `server` - Node.js API gateway
- `client` - React frontend

## Recommended prerequisites

- Windows 10 or 11
- Node.js 18 or newer
- Python 3.10 or 3.11 recommended

## Fastest way on Windows

Double-click `start-all.bat`.

That script opens three terminals and starts:

- AI engine on `http://127.0.0.1:5000`
- Node API on `http://127.0.0.1:3000`
- React app on `http://127.0.0.1:3001`

Then open:

- `http://localhost:3001`

## Manual run steps

### 1. Start AI engine

Open PowerShell in `ai_engine` and run:

```powershell
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
$env:PYTHONIOENCODING="utf-8"
python app.py
```

### 2. Start Node server

Open another PowerShell window in `server` and run:

```powershell
npm install
$env:AI_ENGINE_URL="http://127.0.0.1:5000"
node server.js
```

### 3. Start React client

Open another PowerShell window in `client` and run:

```powershell
npm install
$env:PORT="3001"
$env:BROWSER="none"
$env:REACT_APP_API_BASE="http://127.0.0.1:3000"
npm start
```

## Notes

- The frontend uses port `3001` because the Node API uses `3000`.
- If Python shows a Unicode encoding error, make sure `PYTHONIOENCODING=utf-8` is set as shown above.
- The first startup may take a few minutes because dependencies are installed fresh.

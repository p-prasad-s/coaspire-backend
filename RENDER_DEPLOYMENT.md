# CoAspire Deployment Guide - Render.com

## Prerequisites
- GitHub repository: https://github.com/p-prasad-s/coaspire-backend
- Render.com account (sign up at https://render.com)

## Step 1: Deploy Python AI Engine

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub account if not already connected
4. Select repository: **p-prasad-s/coaspire-backend**
5. Configure the service:
   - **Name**: `coaspire-ai-engine` (or any name you prefer)
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: `ai_engine`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app --bind 0.0.0.0:$PORT`
   - **Instance Type**: `Free` (or paid if you prefer)
6. Click **"Create Web Service"**
7. Wait for deployment to complete (~2-5 minutes)
8. **Copy the deployed URL** (e.g., `https://coaspire-ai-engine.onrender.com`)

## Step 2: Deploy Node.js Gateway Server

1. Click **"New +"** → **"Web Service"** again
2. Select repository: **p-prasad-s/coaspire-backend**
3. Configure the service:
   - **Name**: `coaspire-server` (or any name you prefer)
   - **Region**: Same as AI engine
   - **Branch**: `main`
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free` (or paid if you prefer)
4. **Add Environment Variable**:
   - Key: `AI_ENGINE_URL`
   - Value: `https://coaspire-ai-engine.onrender.com` (paste the URL from Step 1)
5. Click **"Create Web Service"**
6. Wait for deployment to complete (~2-5 minutes)
7. **Copy the deployed URL**: `https://coaspire-backend-1.onrender.com`

## Step 3: Update React App for Production

Update `client/src/App.js` with your actual Render server URL:

```javascript
const resolveApiBaseUrl = () => {
  if (Capacitor?.isNativePlatform?.()) {
    return 'https://coaspire-backend-1.onrender.com';
  }
  return process.env.REACT_APP_API_BASE || 'http://localhost:3000';
};
```

## Step 4: Test Your Deployment

1. Visit your Node server URL: `https://coaspire-backend-1.onrender.com`
2. Test the API endpoints:
   - POST `/api/coastal-analysis` - Should return overlay and metrics
   - POST `/api/generate-report` - Should return timeline data
   - POST `/api/ai-predictor` - Should return prediction data

## Step 5: Configure Custom Domain (digigoods.tech)

### Option A: Using Render Custom Domains (Recommended)

1. In Render dashboard, go to your `coaspire-server` service
2. Click **"Settings"** → **"Custom Domain"**
3. Add domain: `api.digigoods.tech`
4. Render will show you DNS records to add in your get.tech control panel:
   - Type: `CNAME`
   - Name: `api`
   - Value: `coaspire-backend-1.onrender.com`
   - TTL: `3600` (1 hour)

### Option B: Direct DNS Configuration

In your get.tech control panel:
1. Go to DNS Management for `digigoods.tech`
2. Add a new CNAME record:
   - Type: `CNAME`
   - Name: `api` (will create api.digigoods.tech)
   - Target: Your Render server URL without https:// (e.g., `coaspire-backend-1.onrender.com`)
   - TTL: `3600`
3. Save and wait 5-30 minutes for DNS propagation

After DNS propagation, update App.js:
```javascript
return 'https://api.digigoods.tech';
```

## Step 6: Rebuild Android APK

After updating the production URL in App.js:

```powershell
cd client
npm run build
npx cap copy android
cd android
$env:JAVA_HOME="C:\Program Files\Microsoft\jdk-21.0.9.10-hotspot"
$env:PATH="$env:JAVA_HOME\bin;" + $env:PATH
.\gradlew assembleDebug
```

APK will be at: `client/android/app/build/outputs/apk/debug/app-debug.apk`

## Important Notes

- **Free tier limitations**: Services sleep after 15 minutes of inactivity, first request after sleep takes ~30 seconds
- **Cold starts**: First request may be slow, subsequent requests are fast
- **Logs**: Monitor logs in Render dashboard to debug issues
- **Environment variables**: Can be updated in Render dashboard Settings → Environment
- **Automatic deploys**: Render automatically redeploys on git push to main branch

## Troubleshooting

- **503 errors**: Service is starting up (cold start), wait 30 seconds
- **CORS errors**: Check if flask-cors is installed in ai_engine
- **404 on API calls**: Verify AI_ENGINE_URL environment variable in server service
- **DNS not working**: DNS propagation can take up to 24 hours, use Render URL meanwhile

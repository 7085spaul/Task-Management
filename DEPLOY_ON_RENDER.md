# 🚀 Deploy Everything on Render (Easiest - One Platform!)

## ✅ Yes! You Can Deploy Both Backend & Frontend on Render

This is actually **simpler** - everything in one place!

**Time**: ~20 minutes  
**Cost**: FREE (free tier available)

---

## Step 1: Prepare Your Code

### 1.1 Update Prisma Schema for PostgreSQL

Edit `backend/prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"  // Change from "sqlite" to "postgresql"
  url      = env("DATABASE_URL")
}
```

### 1.2 Push Code to GitHub

Make sure your code is on GitHub:
```bash
git add .
git commit -m "Ready for deployment"
git push
```

---

## Step 2: Create PostgreSQL Database on Render

1. **Go to**: [render.com](https://render.com)
2. **Sign up** with GitHub (free)
3. **Click**: "New +" → "PostgreSQL"
4. **Configure**:
   - Name: `track-a-database`
   - Database: `track_a`
   - User: `track_a_user`
   - Region: Choose closest to you
   - Plan: **Free** (or paid if you prefer)
5. **Click**: "Create Database"
6. **Copy** the "Internal Database URL" (you'll need this)

---

## Step 3: Deploy Backend on Render

1. **Click**: "New +" → "Web Service"
2. **Connect** your GitHub repository
3. **Configure**:
   - Name: `track-a-backend`
   - Region: Same as database
   - Branch: `main` (or your default branch)
   - Root Directory: `backend`
   - Runtime: **Node**
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
4. **Environment Variables** (click "Advanced"):
   ```
   DATABASE_URL=<paste the Internal Database URL from Step 2>
   JWT_ACCESS_SECRET=<generate random string, min 32 chars>
   JWT_REFRESH_SECRET=<generate different random string, min 32 chars>
   ACCESS_TOKEN_EXPIRY=15m
   REFRESH_TOKEN_EXPIRY=7d
   PORT=3001
   NODE_ENV=production
   ```
5. **Click**: "Create Web Service"
6. **Wait** for deployment (takes 2-3 minutes)
7. **Copy** your backend URL: `https://track-a-backend.onrender.com` (or similar)

---

## Step 4: Run Database Migrations

1. **Go to** your backend service on Render
2. **Click**: "Shell" tab (or "Logs" → "Open Shell")
3. **Run**:
   ```bash
   cd backend
   npx prisma db push
   ```
4. **Wait** for it to complete (creates tables)

---

## Step 5: Deploy Frontend on Render

1. **Click**: "New +" → "Web Service"
2. **Connect** your GitHub repository (same repo)
3. **Configure**:
   - Name: `track-a-frontend`
   - Region: Same as backend
   - Branch: `main`
   - Root Directory: `frontend`
   - Runtime: **Node**
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
4. **Environment Variables**:
   ```
   NEXT_PUBLIC_API_URL=https://track-a-backend.onrender.com
   ```
   (Use your actual backend URL from Step 3)
5. **Click**: "Create Web Service"
6. **Wait** for deployment

---

## Step 6: Update Backend CORS

1. **Go back to** your backend service
2. **Click**: "Environment" tab
3. **Add**:
   ```
   FRONTEND_URL=https://track-a-frontend.onrender.com
   ```
   (Use your actual frontend URL)
4. **Save** - Render will auto-redeploy

---

## Step 7: Test Your Live Website! 🎉

1. **Visit**: Your frontend URL (`https://track-a-frontend.onrender.com`)
2. **Register** a new account
3. **Login**
4. **Create tasks**
5. **Test all features**

---

## ✅ Done! Share This URL

**Your Live Website**: `https://track-a-frontend.onrender.com`

---

## 📋 What You'll Have

After deployment:
- ✅ **Frontend**: `https://track-a-frontend.onrender.com` ← **Share this!**
- ✅ **Backend**: `https://track-a-backend.onrender.com` (internal use)
- ✅ **Database**: PostgreSQL (managed by Render)

All on **one platform** - Render! 🎯

---

## ⚠️ Important Notes

### Free Tier Limitations:
- **Spins down after 15 minutes** of inactivity
- **First request** after spin-down takes ~30 seconds (cold start)
- **750 hours/month** free (enough for testing/demo)

### To Avoid Spin-down:
- Use **Paid Plan** ($7/month) for always-on
- Or accept the cold start (fine for demos)

### Environment Variables:
- Never commit `.env` files
- Always use Render's environment variables

---

## 🔧 Troubleshooting

### Backend won't start?
- Check logs: Service → "Logs" tab
- Verify `DATABASE_URL` is correct
- Make sure Prisma schema uses `postgresql`

### Frontend can't connect to backend?
- Check `NEXT_PUBLIC_API_URL` is set correctly
- Verify backend URL is accessible
- Check CORS settings in backend

### Database errors?
- Make sure you ran `npx prisma db push` in Step 4
- Verify `DATABASE_URL` format: `postgresql://user:pass@host:port/db`
- Check database is running (green status)

### Build fails?
- Check "Logs" tab for error messages
- Verify `package.json` has correct scripts
- Make sure all dependencies are listed

---

## 🎯 What to Submit

When submitting your assignment:
- ✅ **Live Website URL**: `https://track-a-frontend.onrender.com`
- ✅ **GitHub Repository**: `https://github.com/your-username/repo`
- ✅ **Note**: "Deployed on Render (both frontend and backend)"

---

## 💡 Pro Tips

1. **Keep services in same region** (faster communication)
2. **Use Internal Database URL** for backend (faster, free)
3. **Monitor logs** during first deployment
4. **Test thoroughly** before sharing

---

## 🚀 Alternative: Render Blueprint (Advanced)

If you want to automate everything, create `render.yaml` in your repo root:

```yaml
services:
  - type: web
    name: track-a-backend
    env: node
    buildCommand: cd backend && npm install && npm run build
    startCommand: cd backend && npm start
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: track-a-database
          property: connectionString
      - key: JWT_ACCESS_SECRET
        generateValue: true
      - key: JWT_REFRESH_SECRET
        generateValue: true
      - key: PORT
        value: 3001
      - key: NODE_ENV
        value: production

  - type: web
    name: track-a-frontend
    env: node
    buildCommand: cd frontend && npm install && npm run build
    startCommand: cd frontend && npm start
    envVars:
      - key: NEXT_PUBLIC_API_URL
        fromService:
          name: track-a-backend
          type: web
          property: host

databases:
  - name: track-a-database
    databaseName: track_a
    user: track_a_user
```

Then deploy via "New +" → "Blueprint" → Connect repo.

---

**That's it! Everything on Render - simple and easy!** 🎉

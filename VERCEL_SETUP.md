# Vercel Environment Variables Setup

## **Required Steps to Fix MissingCSRF Error**

### **Step 1: Go to Vercel Dashboard**
1. Open https://vercel.com/dashboard
2. Click on your project: **ElectronicLab**
3. Go to **Settings** → **Environment Variables**

---

### **Step 2: Add These Environment Variables**

Add each of these in Vercel's Environment Variables page. For each:
- Paste the key and value
- Select: **Production**, **Preview**, and **Development**
- Click **Save**

#### **1. NEXTAUTH_SECRET**
```
Key: NEXTAUTH_SECRET
Value: kz0EBnabFSCPJDGXhpz9k0sSP5PEJ3+8NIH/z/TgTGc=
```

#### **2. NEXTAUTH_URL** ⭐ CRITICAL FOR CSRF FIX
```
Key: NEXTAUTH_URL
Value: https://elabrru.vercel.app
```

#### **3. DATABASE_URL** ⭐ CRITICAL FOR AUTH TO WORK
```
Key: DATABASE_URL
Value: postgresql://neondb_owner:npg_tRekZhguVW71@ep-flat-dust-a1hd05go-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

---

### **Step 3: Redeploy**
1. Go to **Deployments**
2. Find the latest deployment
3. Click the **...** menu
4. Select **Redeploy**

Wait 2-3 minutes for the deployment to complete.

---

### **Why This Fixes the CSRF Error**

| Variable | Why It's Needed |
|---|---|
| `NEXTAUTH_URL` | Tells NextAuth the callback URL for CSRF validation. Without it, it defaults to `http://localhost:3000` |
| `DATABASE_URL` | Needed to query the database for user authentication. Without it, auth queries fail |
| `NEXTAUTH_SECRET` | Required for encrypting JWT tokens |

---

### **Verification Checklist**

- [ ] All 5 environment variables are set in Vercel
- [ ] Each variable is enabled for: **Production**, **Preview**, **Development**
- [ ] Deployment has been redeployed (not just updated)
- [ ] Waited 2-3 minutes for deployment to complete

---

### **If It Still Doesn't Work**

1. **Clear browser cache and cookies**
   - Press `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac)
   - Clear cookies for `elabrru.vercel.app`

2. **Check Vercel Logs**
   - In Vercel dashboard
   - Go to **Deployments** → Click latest deployment
   - Click **Runtime logs** to see errors

3. **Test with local dev server**
   - Run `npm run dev` locally
   - Try login at `http://localhost:3004`
   - If it works locally, it's a Vercel environment variable issue

---

### **Local Development Note**

Your `.env.local` is ONLY for local development. It's never uploaded to Vercel. That's why you must set variables in the Vercel dashboard.

```
Local Dev:    .env.local (never sent to Vercel)
↓
Vercel Prod:  Vercel Dashboard → Environment Variables
```

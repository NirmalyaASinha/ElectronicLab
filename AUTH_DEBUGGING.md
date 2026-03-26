# Authentication Troubleshooting Guide

## Issue: "Invalid email or password" Error

If you're seeing "Invalid email or password" error, it could be due to:

1. **No user exists with that email in the database**
2. **User was created with Python bcrypt (incompatible with bcryptjs)**
3. **Environment variables not set in Vercel**
4. **Email case mismatch**

---

## Step 1: Create a Test Admin User Locally

First, verify authentication works locally by creating a test user:

```bash
cd /home/nirmalya/Desktop/ElecTronic
node --require dotenv/config scripts/admin.js
```

Choose option `1` to create an admin:
```
Enter your choice (0-4): 1
Admin Email: testadmin@example.com
Admin Name: Test Admin
Admin Password: TestPassword123
```

---

## Step 2: Test Login Locally

```bash
npm run dev
```

Open http://localhost:3004/login and try:
- Email: `testadmin@example.com`
- Password: `TestPassword123`

### ✅ If Login Works Locally:
- Your authentication code is correct
- You **MUST** set environment variables in Vercel
- Go to: https://vercel.com → Your Project → Settings → Environment Variables
- Add: `NEXTAUTH_URL`, `DATABASE_URL`, `NEXTAUTH_SECRET`

### ❌ If Login Fails Locally:
- Check your database connection
- Verify `DATABASE_URL` in `.env.local` is correct
- Try Step 3 below

---

## Step 3: Verify Database Connection

```bash
node --require dotenv/config scripts/admin.js
```

Choose option `4` to view all users:
```
Enter your choice (0-4): 4
```

This will show all users in your database. If you see your created user, the database is working.

---

## Step 4: Check Database Directly

If you're still having issues, check your Neon database:

1. Go to https://console.neon.tech
2. Select your project
3. Go to **SQL Editor**
4. Run:
```sql
SELECT id, email, name, role, is_active FROM users LIMIT 10;
```

You should see your test user here.

---

## Step 5: Verify Bcryptjs Compatibility

If the user exists but login still fails, the password hash might be incompatible:

```bash
# Delete the test user from Step 1
# Create a new one with the Node.js script (NOT the Python script)

node --require dotenv/config scripts/admin.js
# Choose 1 → Create Admin
```

Then test login again. The Node.js script uses **bcryptjs** which matches your authentication code.

---

## Code Issues Fixed

The following issues were identified and fixed:

### ✅ Fixed: Drizzle Query Syntax in `/api/admin/create-user`
**Before:**
```typescript
where: (users, { eq }) => eq(users.email, email.toLowerCase()),
```

**After:**
```typescript
where: eq(users.email, email.toLowerCase()),
```

This uses the correct Drizzle ORM syntax for simple queries.

---

## Checklist for Production (Vercel)

- [ ] Email is lowercase in database AND queries
- [ ] Users created with Node.js script (bcryptjs), NOT Python script
- [ ] `NEXTAUTH_SECRET` set in Vercel
- [ ] `NEXTAUTH_URL` set to `https://elabrru.vercel.app` in Vercel
- [ ] `DATABASE_URL` set in Vercel
- [ ] Vercel deployment redeployed after setting variables
- [ ] At least one ADMIN user exists in the database

---

## Debug Logs

Add this to your `.env.local` to enable debug logging:

```
DEBUG=nextauth:* 
```

Then check the server console for detailed NextAuth logs.

---

## Still Not Working?

1. **Clear browser cookies:** Press `Ctrl+Shift+Delete` → Clear cookies for your domain
2. **Check Vercel logs:** Deployments → Latest → Runtime Logs
3. **Verify database:** Neon Console → SQL Editor → SELECT count(*) FROM users;
4. **Test with fresh credentials:** Create a new user with the Node.js script

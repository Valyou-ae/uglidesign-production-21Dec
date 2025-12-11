# Phase 1 Security Fixes - Deployment Instructions

## Overview
These changes fix critical security vulnerabilities without modifying UI or core functionality.

## Changes Made

### 1. `server/index.ts`
- Added Helmet.js for security headers (CSP, XSS protection, etc.)
- Reduced JSON payload limit from 50MB to 15MB (prevents DoS attacks)
- Configured CSP to allow Google Sign-In and Stripe

### 2. `server/routes.ts`
- Added `getSafeErrorMessage()` - sanitizes error responses to prevent leaking sensitive info
- Added credit checks to mockup generation routes (single + batch)
- Added `/api/auth/forgot-password` endpoint with rate limiting
- Added `/api/auth/reset-password` endpoint

---

## Deployment Steps

### Step 1: Install New Dependency
Run this in the Replit Shell:
```bash
npm install helmet --save
```

### Step 2: Replace Files
Replace these files with the new versions:
- `server/index.ts` → Use `server_index.ts`
- `server/routes.ts` → Use `server_routes.ts`

### Step 3: Verify Database Schema
The password reset feature requires these columns in the `users` table (already in your schema.ts):
```typescript
passwordResetToken: text("password_reset_token"),
passwordResetExpires: timestamp("password_reset_expires"),
```

If these columns don't exist in your database, run:
```bash
npm run db:push
```

### Step 4: Restart the App
Click "Stop" then "Run" in Replit, or in Shell:
```bash
npm run dev
```

---

## What Each Fix Does

### Security Headers (Helmet)
Adds these HTTP headers automatically:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security` (HSTS)
- Content Security Policy (CSP)

### Error Sanitization
Before: Errors might expose stack traces, file paths, database details
After: Only safe, generic error messages sent to client

### Credit System Enforcement
Before: Mockup generation had no credit checks (unlimited free usage)
After: 
- Single mockup: 3 credits
- Batch mockup: 3 credits × number of images

### Password Reset
New endpoints:
- `POST /api/auth/forgot-password` - Sends reset link (rate limited: 3/hour)
- `POST /api/auth/reset-password` - Resets password with token

**Note:** Email sending is simulated (logged to console). In production, integrate with SendGrid/Resend/etc.

---

## Testing Checklist

After deployment, verify:

- [ ] App starts without errors
- [ ] Google Sign-In still works
- [ ] Image generation works (check credits are deducted)
- [ ] Mockup generation works (check credits are deducted)
- [ ] Large file uploads (up to 15MB) work
- [ ] Security headers present (check in browser DevTools → Network → Response Headers)

### Quick Security Header Test
In browser console on your app:
```javascript
fetch('/api/user').then(r => console.log(Object.fromEntries(r.headers)))
```
Should show headers like `x-content-type-options`, `x-frame-options`, etc.

---

## Rollback
If issues occur, restore your original `server/index.ts` and `server/routes.ts` files.

---

## Files Included
1. `server_index.ts` → Replace `server/index.ts`
2. `server_routes.ts` → Replace `server/routes.ts`
3. `PHASE1_DEPLOYMENT_INSTRUCTIONS.md` (this file)

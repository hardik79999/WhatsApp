# 🔧 Fix: Blank Screen After Login

## Problem
After successful login, the browser shows a blank/dark screen instead of the WhatsApp UI.

## Root Cause
The app was getting stuck in an authentication loop:
1. User logs in successfully
2. App tries to fetch user data from `/api/v1/users/me`
3. API call fails with 401 (authentication error)
4. App clears localStorage and reloads page
5. Loop repeats or app gets stuck

## Fixes Applied

### Fix 1: Improved Error Handling in App.jsx
**File:** `frontend/src/App.jsx`

**Changes:**
- Added console.log debugging to track authentication flow
- Improved error handling in `fetchInitialData()`
- Only clear auth on 401 errors, not other errors
- Better logging to identify issues

**What it does:**
- Shows exactly where the authentication is failing
- Prevents infinite loops
- Helps debug the issue

### Fix 2: Removed Auto-Reload on 401
**File:** `frontend/src/api.js`

**Changes:**
- Disabled automatic page reload on 401 errors
- Let the App component handle authentication errors
- Added logging for 401 errors

**What it does:**
- Prevents the page from reloading automatically
- Gives the app a chance to handle errors gracefully
- Stops the authentication loop

## How to Test

### Step 1: Hard Refresh Browser
```
Press: Ctrl + Shift + R
```
This clears the browser cache.

### Step 2: Open Browser Console
```
Press: F12
Go to: Console tab
```

### Step 3: Try Logging In
1. Enter phone number: `+919876543210`
2. Click "Send OTP"
3. Check backend terminal for OTP code
4. Enter the OTP
5. Click "Verify & Login"

### Step 4: Watch Console Output
You should see:
```
Initial auth check - token: missing
isAuthenticated changed to: false
[After login]
Token found, setting authenticated to true
isAuthenticated changed to: true
Fetching initial data...
User data: {id: "...", phone: "...", ...}
Chats data: []
```

### Step 5: If You See Errors
Look for these common errors:

**Error 1: "Could not validate credentials"**
```
Solution: The CSRF token is not being sent correctly
Check: localStorage.getItem('csrf_access_token')
```

**Error 2: "Network Error"**
```
Solution: Backend is not running or CORS issue
Check: Is backend running on port 8000?
```

**Error 3: "401 Unauthorized"**
```
Solution: Token expired or invalid
Fix: Clear localStorage and login again
```

## Manual Testing

### Test Backend Directly
```bash
# Test if backend is running
curl http://localhost:8000/

# Should return: {"message":"Welcome to WhatsApp Clone API!"}
```

### Test Authentication Flow
```bash
# 1. Send OTP
curl -X POST http://localhost:8000/api/v1/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919876543210"}'

# 2. Check backend terminal for OTP

# 3. Verify OTP (replace XXXX with actual OTP)
curl -X POST http://localhost:8000/api/v1/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919876543210", "otp": "XXXX"}' \
  -c cookies.txt -v

# 4. Test /users/me (replace TOKEN with csrf_access_token from step 3)
curl http://localhost:8000/api/v1/users/me \
  -b cookies.txt \
  -H "X-CSRF-Token: TOKEN"
```

## Expected Behavior After Fix

### Before Login
- Shows login page with phone number input
- No errors in console

### After Entering Phone
- Shows OTP input screen
- Backend prints OTP in terminal
- No errors in console

### After Entering OTP
- Console shows: "Token found, setting authenticated to: true"
- Console shows: "Fetching initial data..."
- Console shows: "User data: {...}"
- Console shows: "Chats data: []"
- **UI shows WhatsApp interface** with:
  - Left sidebar with chat list
  - Right side with "WhatsApp Web" welcome screen
  - Header with user avatar and buttons

### If Still Blank
Check console for specific error messages and share them.

## Additional Debugging

### Check LocalStorage
Open console and run:
```javascript
console.log('CSRF Token:', localStorage.getItem('csrf_access_token'));
console.log('Refresh Token:', localStorage.getItem('csrf_refresh_token'));
```

### Check Cookies
Open DevTools → Application → Cookies → http://localhost:5173
Look for:
- `access_token`
- `refresh_token`

### Check Network Requests
Open DevTools → Network tab
Filter: XHR
Look for:
- `/api/v1/auth/verify-otp` - Should return 200
- `/api/v1/users/me` - Should return 200 (not 401)
- `/api/v1/chats/` - Should return 200

## Common Issues & Solutions

### Issue 1: Token Not Saved
**Symptom:** Console shows "token: missing" after login

**Solution:**
Check Login.jsx - make sure it's saving tokens:
```javascript
localStorage.setItem('csrf_access_token', data.csrf_access_token);
localStorage.setItem('csrf_refresh_token', data.csrf_refresh_token);
```

### Issue 2: Token Not Sent
**Symptom:** 401 error on /users/me

**Solution:**
Check api.js - make sure interceptor is adding token:
```javascript
config.headers['X-CSRF-Token'] = csrfToken;
```

### Issue 3: CORS Error
**Symptom:** "CORS policy" error in console

**Solution:**
Check backend main.py - make sure CORS allows localhost:5173:
```python
allow_origins=["http://localhost:5173"]
```

### Issue 4: Backend Not Running
**Symptom:** "Network Error" or "ERR_CONNECTION_REFUSED"

**Solution:**
```bash
cd backend
source ../.venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Issue 5: Database Not Connected
**Symptom:** Backend errors about database

**Solution:**
```bash
# Check database
python verify_schema.py

# If fails, check PostgreSQL is running
sudo systemctl status postgresql
```

## Quick Reset

If nothing works, try a complete reset:

```bash
# 1. Stop both servers (Ctrl+C in both terminals)

# 2. Clear browser data
# Open browser → F12 → Application → Clear storage → Clear site data

# 3. Clear localStorage
# Console: localStorage.clear()

# 4. Restart backend
cd backend
source ../.venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 5. Restart frontend (new terminal)
cd frontend
npm run dev

# 6. Hard refresh browser
# Ctrl + Shift + R

# 7. Try logging in again
```

## Success Indicators

✅ Console shows authentication flow logs
✅ No 401 errors in Network tab
✅ User data loads successfully
✅ WhatsApp UI appears after login
✅ Can see chat list (even if empty)
✅ Can click "New Chat" button
✅ No blank screen

## Still Not Working?

1. **Share console output** - Copy all console messages
2. **Share Network tab** - Screenshot of failed requests
3. **Share backend logs** - Copy terminal output
4. **Check browser** - Try different browser (Chrome/Firefox)

The debugging logs will show exactly where the problem is!

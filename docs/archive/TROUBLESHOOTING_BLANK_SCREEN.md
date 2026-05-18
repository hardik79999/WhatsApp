# 🔧 Troubleshooting: Blank Screen Issue

## Problem
Browser shows a blank/dark screen when accessing http://localhost:5173

## Quick Fixes (Try in order)

### Fix 1: Hard Refresh Browser
```
Press: Ctrl + Shift + R
Or: Ctrl + F5
```
This clears the browser cache and reloads the page.

### Fix 2: Clear Browser Data
1. Open DevTools (F12)
2. Go to **Application** tab
3. Click **Clear storage**
4. Check all boxes
5. Click **Clear site data**
6. Reload page

### Fix 3: Check Browser Console
1. Press **F12** to open DevTools
2. Go to **Console** tab
3. Look for red error messages
4. Common errors:
   - `Failed to fetch` → Backend not running
   - `CORS error` → CORS misconfiguration
   - `Module not found` → Missing dependency
   - `Unexpected token` → Syntax error in code

### Fix 4: Test Diagnostic Page
Navigate to: **http://localhost:5173/test.html**

This page will test:
- ✅ HTML & CSS loading
- ✅ JavaScript execution
- ✅ Backend API connection
- ✅ WebSocket connection
- ✅ LocalStorage access

### Fix 5: Restart Servers

**Stop both servers:**
```bash
# In terminal 1 (backend): Ctrl+C
# In terminal 2 (frontend): Ctrl+C
```

**Start backend:**
```bash
cd backend
source ../.venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Start frontend (new terminal):**
```bash
cd frontend
npm run dev
```

### Fix 6: Check if Servers are Running
```bash
# Check backend
curl http://localhost:8000/

# Should return: {"message":"Welcome to WhatsApp Clone API!"}

# Check frontend
curl http://localhost:5173/

# Should return HTML content
```

### Fix 7: Reinstall Frontend Dependencies
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Fix 8: Check Browser Compatibility
The app requires a modern browser:
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Edge 90+
- ✅ Safari 14+

### Fix 9: Disable Browser Extensions
Some extensions can block JavaScript:
1. Open browser in **Incognito/Private mode**
2. Try accessing http://localhost:5173
3. If it works, disable extensions one by one to find the culprit

### Fix 10: Check Network Tab
1. Open DevTools (F12)
2. Go to **Network** tab
3. Reload page (Ctrl+R)
4. Look for failed requests (red status codes)
5. Common issues:
   - **404** → File not found
   - **500** → Server error
   - **CORS** → Cross-origin issue

## Common Causes & Solutions

### Cause 1: JavaScript Disabled
**Solution:** Enable JavaScript in browser settings

### Cause 2: Ad Blocker
**Solution:** Disable ad blocker for localhost

### Cause 3: Firewall
**Solution:** Allow ports 5173 and 8000 in firewall

### Cause 4: Wrong URL
**Solution:** Make sure you're accessing:
- Frontend: http://localhost:5173
- NOT: http://127.0.0.1:5173
- NOT: http://0.0.0.0:5173

### Cause 5: Port Already in Use
**Solution:**
```bash
# Check what's using port 5173
lsof -i :5173

# Kill the process
kill -9 <PID>

# Restart frontend
npm run dev
```

### Cause 6: Node Modules Corrupted
**Solution:**
```bash
cd frontend
rm -rf node_modules .vite package-lock.json
npm install
npm run dev
```

## Diagnostic Commands

### Check if servers are running:
```bash
ps aux | grep -E "(uvicorn|vite)" | grep -v grep
```

### Check ports:
```bash
netstat -tuln | grep -E "(5173|8000)"
```

### Check backend logs:
Look at the terminal where uvicorn is running for errors

### Check frontend logs:
Look at the terminal where vite is running for errors

## Still Not Working?

### Option 1: Use Different Browser
Try Chrome, Firefox, or Edge

### Option 2: Use Different Port
Edit `frontend/vite.config.js`:
```javascript
export default defineConfig({
  server: {
    port: 3000  // Change from 5173 to 3000
  }
})
```

Then access: http://localhost:3000

### Option 3: Check System Resources
```bash
# Check memory
free -h

# Check CPU
top

# Check disk space
df -h
```

Low resources can cause the app to hang.

## Debug Mode

### Enable Verbose Logging

**Backend:**
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 --log-level debug
```

**Frontend:**
Check browser console for detailed logs

## Expected Behavior

When working correctly, you should see:

1. **Browser loads** → Shows loading spinner
2. **After 1-2 seconds** → Shows login page with:
   - WhatsApp logo
   - "Enter your phone number" form
   - Green "Send OTP" button
3. **No errors** in browser console

## Screenshots to Share

If still not working, share screenshots of:
1. Browser window showing the blank page
2. Browser DevTools Console tab (F12 → Console)
3. Browser DevTools Network tab (F12 → Network)
4. Backend terminal output
5. Frontend terminal output

## Quick Test Script

Run this to test everything:
```bash
#!/bin/bash
echo "🔍 Testing WhatsApp Clone..."

echo "1. Testing Backend..."
curl -s http://localhost:8000/ && echo "✅ Backend OK" || echo "❌ Backend FAIL"

echo "2. Testing Frontend..."
curl -s http://localhost:5173/ | grep -q "WhatsApp" && echo "✅ Frontend OK" || echo "❌ Frontend FAIL"

echo "3. Testing Database..."
cd /home/hardik/Technotery/FastApi/Project/WhatsApp
source .venv/bin/activate
python verify_schema.py && echo "✅ Database OK" || echo "❌ Database FAIL"

echo "Done!"
```

Save as `test_all.sh`, make executable (`chmod +x test_all.sh`), and run (`./test_all.sh`)

---

## Need More Help?

1. Open the diagnostic page: http://localhost:5173/test.html
2. Run all tests
3. Share the results
4. Check browser console (F12) for errors
5. Share screenshots of any errors

The diagnostic page will help identify exactly what's not working!

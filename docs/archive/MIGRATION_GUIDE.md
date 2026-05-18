# Migration Guide - WhatsApp Clone v2.0

## Quick Start

### 1. Backend Changes
No database migrations needed! The schema already supported all features.

#### Install/Update Dependencies (if needed)
```bash
cd backend
pip install -r requirements.txt
```

#### Restart Backend Server
```bash
# Stop existing server (Ctrl+C)
# Start fresh
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Frontend Changes

#### Install Dependencies (if needed)
```bash
cd frontend
npm install
```

#### Restart Frontend Server
```bash
# Stop existing server (Ctrl+C)
# Start fresh
npm run dev
```

### 3. Verify Everything Works

#### Test Checklist:
1. **Login** - Should work as before
2. **View Chats** - Existing chats should load
3. **Send Message** - Try sending a message
4. **Open Chat** - Messages should auto-scroll
5. **Check Ticks** - Grey/blue ticks should show correctly
6. **Sync Contact** - Try the new sync form in "New Chat"
7. **WebSocket** - Check browser console for "WebSocket connected"

---

## What Changed?

### Frontend Structure
```
OLD:
src/
└── App.jsx (750+ lines)

NEW:
src/
├── App.jsx (300 lines)
└── components/
    ├── Icons.jsx
    ├── Avatar.jsx
    ├── MessageTicks.jsx
    ├── MessageBubble.jsx
    ├── ChatList.jsx
    ├── ChatWindow.jsx
    ├── NewChatPanel.jsx
    └── ContextMenu.jsx
```

### Import Changes
If you have any custom code importing from `App.jsx`, update imports:

**Before:**
```javascript
import { Icon } from './App';
```

**After:**
```javascript
import { Icon } from './components/Icons';
import Avatar from './components/Avatar';
import MessageTicks from './components/MessageTicks';
// etc.
```

---

## New API Endpoints

### 1. Create Group Chat
```bash
POST /api/v1/chats/group
Content-Type: application/json

{
  "group_name": "My Group",
  "group_description": "Optional",
  "group_picture": "https://...",
  "participant_ids": ["uuid1", "uuid2"]
}
```

### 2. Get Chat Details
```bash
GET /api/v1/chats/{chat_id}
```

### 3. Sync Single Contact
```bash
POST /api/v1/contacts/sync-single
Content-Type: application/json

{
  "phone": "+1234567890",
  "name": "John Doe"
}
```

---

## Rollback Instructions

If you need to rollback to the old version:

### Frontend Rollback:
```bash
cd frontend/src
mv App.jsx App_new.jsx
mv App_old.jsx App.jsx
rm -rf components/
```

### Backend Rollback:
```bash
cd backend
git checkout HEAD -- app/
```

Or manually restore from your version control.

---

## Troubleshooting

### Issue: WebSocket not connecting
**Solution**: Check that backend is running on port 8000
```bash
# Check if port 8000 is in use
lsof -i :8000

# If not, start backend
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Issue: Components not found
**Solution**: Make sure all component files are in `frontend/src/components/`
```bash
ls frontend/src/components/
# Should show: Icons.jsx, Avatar.jsx, MessageTicks.jsx, etc.
```

### Issue: Messages not auto-scrolling
**Solution**: 
1. Check browser console for errors
2. Verify `messagesEndRef` is defined in ChatWindow.jsx
3. Clear browser cache and reload

### Issue: Ticks not showing correct colors
**Solution**:
1. Check message status in database
2. Verify MessageTicks component is imported correctly
3. Check that status is being passed from backend

### Issue: Contact sync not working
**Solution**:
1. Verify phone number format (include country code)
2. Check that user with that phone exists in database
3. Check backend logs for errors

---

## Database Verification

### Check if schema is correct:
```sql
-- Connect to your PostgreSQL database
psql -U your_user -d your_database

-- Check chats table
\d chats

-- Should have columns:
-- - is_group (boolean)
-- - group_name (varchar)
-- - group_picture (varchar)
-- - group_description (text)
-- - created_by (uuid)

-- Check chat_participants table
\d chat_participants

-- Should have columns:
-- - chat_id (uuid)
-- - user_id (uuid)
-- - role (varchar)
-- - is_muted (boolean)
```

---

## Performance Notes

### Improvements:
- **Reduced Re-renders**: Component splitting reduces unnecessary re-renders
- **Better Memory Management**: Proper cleanup in useEffect hooks
- **Optimized WebSocket**: Better error handling prevents connection leaks
- **Database Efficiency**: Proper session management prevents connection leaks

### Monitoring:
```bash
# Check backend logs
tail -f backend/logs/app.log

# Check WebSocket connections
# In browser console:
console.log('Active WebSocket:', wsRef.current?.readyState);
// 0 = CONNECTING, 1 = OPEN, 2 = CLOSING, 3 = CLOSED
```

---

## Security Notes

### No Security Changes
All existing security measures remain:
- ✅ HttpOnly cookies for auth
- ✅ CSRF token validation
- ✅ JWT token verification
- ✅ WebSocket authentication
- ✅ SQL injection prevention (SQLAlchemy ORM)

### New Validations Added:
- ✅ Group name required validation
- ✅ Minimum participants validation
- ✅ Phone number format validation (in sync-single)

---

## Support

If you encounter issues:

1. **Check Logs**:
   - Backend: Terminal where uvicorn is running
   - Frontend: Browser console (F12)

2. **Verify Setup**:
   - Backend running on port 8000
   - Frontend running on port 5173
   - Database connection working

3. **Test Endpoints**:
   ```bash
   # Test backend health
   curl http://localhost:8000/
   
   # Should return: {"message": "Welcome to WhatsApp Clone API!"}
   ```

4. **Check Dependencies**:
   ```bash
   # Backend
   cd backend
   pip list | grep -E "fastapi|sqlalchemy|jose"
   
   # Frontend
   cd frontend
   npm list react axios
   ```

---

## Next Steps

After successful migration:

1. ✅ Test all existing features
2. ✅ Test new contact sync feature
3. 🔄 Build UI for group chat creation (optional)
4. 🔄 Implement typing indicators UI (optional)
5. 🔄 Add message reactions (optional)

---

**Migration Completed**: ✅
**Estimated Time**: 5-10 minutes
**Downtime Required**: None (can run alongside old version)

<!-- API_TESTING_PROGRESS_START -->
## Latest Progress - API Testing And Usage System

Updated on: May 18, 2026

A complete FastAPI API testing and usage system has been generated for this project.

What is now available:
- Visual API dashboard: `docs/index.html`
- Main beginner API guide: `API_GUIDE.md`
- API usage examples: `API_USAGE_EXAMPLES.md`
- API flow diagrams: `API_FLOW_DIAGRAM.md`
- Postman collection: `POSTMAN_COLLECTION.json`
- Thunder Client collection: `THUNDER_CLIENT_COLLECTION.json`
- Bruno collection folder: `BRUNO_COLLECTION/`
- Automated API smoke-test runner: `scripts/test_all_apis.py`
- Regeneration utility: `scripts/generate_api_artifacts.py`

Current API inventory:
- 46 HTTP API operations detected
- 1 WebSocket route detected: `/api/v1/ws`
- 11 API modules grouped in the dashboard
- JWT Bearer authentication and cookie/CSRF refresh flow documented
- Upload, media, chat, message, call, status, reaction, user, contact, group, and auth APIs documented

Start here:
1. Start backend: `./start_backend.sh`
2. Serve API dashboard: `python3 -m http.server 4173 --directory docs`
3. Open dashboard: `http://localhost:4173/index.html`
4. Send OTP using `/api/v1/auth/send-otp`
5. Read OTP from backend terminal
6. Verify OTP using `/api/v1/auth/verify-otp`
7. Copy `access_token` into the dashboard or collection variables
8. Test protected APIs with `Authorization: Bearer <access_token>`

Useful test command:
```bash
.venv/bin/python scripts/test_all_apis.py --base-url http://localhost:8000
```

Notes:
- The generated dashboard is a static React/Tailwind page served from `docs/index.html`.
- Protected HTTP APIs use `Authorization: Bearer <access_token>`.
- Refresh uses the refresh cookie plus `X-CSRF-Token`.
- WebSocket auth currently reads the `access_token` cookie.
- Use `API_GUIDE.md` and `API_USAGE_EXAMPLES.md` when you need exact request and response examples.
<!-- API_TESTING_PROGRESS_END -->


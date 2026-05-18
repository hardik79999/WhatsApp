# Developer Guide - WhatsApp Clone

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (React)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   App.jsx    │  │  Components  │  │   API Client │      │
│  │  (Main App)  │  │  (Modular)   │  │   (Axios)    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/WebSocket
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Backend (FastAPI)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Routes     │  │  WebSocket   │  │   Models     │      │
│  │  (REST API)  │  │   Manager    │  │ (SQLAlchemy) │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ SQL
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database (PostgreSQL)                     │
│  users | chats | chat_participants | messages | contacts    │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Architecture (Frontend)

### Component Hierarchy
```
App.jsx
├── Login.jsx (when not authenticated)
└── Main Layout (when authenticated)
    ├── Left Panel
    │   ├── Avatar (user profile)
    │   ├── Tabs (Chats/Status/Calls)
    │   ├── Search Bar
    │   ├── ChatList
    │   │   └── Multiple ChatItem components
    │   └── NewChatPanel (sliding)
    │       ├── Sync Form
    │       └── Contact List
    └── Right Panel
        └── ChatWindow
            ├── Chat Header
            ├── Messages Area
            │   └── Multiple MessageBubble components
            └── Input Bar
```

### Component Responsibilities

| Component | Purpose | Props |
|-----------|---------|-------|
| `App.jsx` | Main app logic, state management, WebSocket | - |
| `ChatList.jsx` | Display list of chats | chats, currentUser, selectedChat, onChatClick |
| `ChatWindow.jsx` | Display active chat and messages | chat, messages, currentUser, newMessage, setNewMessage, onSendMessage |
| `MessageBubble.jsx` | Render individual message | msg, isMine, isFirst, isLast, showDate, onContextMenu |
| `NewChatPanel.jsx` | New chat creation and contact sync | isOpen, contacts, loadingContacts, onClose, onStartChat, onRefreshContacts |
| `Avatar.jsx` | Display user avatar with fallback | src, name, size |
| `MessageTicks.jsx` | Show message status indicators | status |
| `ContextMenu.jsx` | Right-click menu | x, y, items, onClose |
| `Icons.jsx` | Centralized SVG icons | - |

---

## Backend Architecture

### Route Structure
```
/api/v1/
├── /auth
│   ├── POST /login
│   ├── POST /verify-otp
│   └── POST /refresh
├── /users
│   └── GET /me
├── /contacts
│   ├── GET /
│   ├── POST /sync
│   └── POST /sync-single
├── /chats
│   ├── GET /
│   ├── POST /
│   ├── POST /group
│   └── GET /{chat_id}
├── /messages
│   ├── GET /{chat_id}
│   └── POST /
└── /ws (WebSocket)
```

### Database Models

#### Users
```python
- id: UUID (PK)
- phone: String (unique)
- username: String
- profile_pic: String
- bio: Text
- is_online: Boolean
- created_at: DateTime
```

#### Chats
```python
- id: UUID (PK)
- is_group: Boolean
- group_name: String (nullable)
- group_picture: String (nullable)
- group_description: Text (nullable)
- created_by: UUID (FK to users)
- last_message_id: UUID (nullable)
- last_message_at: DateTime
- created_at: DateTime
- updated_at: DateTime
```

#### ChatParticipants
```python
- chat_id: UUID (PK, FK to chats)
- user_id: UUID (PK, FK to users)
- role: String (member/admin/super_admin)
- is_muted: Boolean
- joined_at: DateTime
```

#### Messages
```python
- id: UUID (PK)
- chat_id: UUID (FK to chats)
- sender_id: UUID (FK to users)
- content: Text
- media_url: String (nullable)
- message_type: String (text/image/video/document/audio)
- reply_to_message_id: UUID (nullable, FK to messages)
- is_edited: Boolean
- is_deleted: Boolean
- status: String (sent/delivered/read)
- created_at: DateTime
- updated_at: DateTime
```

#### Contacts
```python
- id: UUID (PK)
- user_id: UUID (FK to users)
- contact_id: UUID (FK to users)
- saved_name: String
- created_at: DateTime
```

---

## WebSocket Events

### Client → Server

#### 1. Typing Indicator
```json
{
  "type": "typing",
  "chat_id": "uuid",
  "receiver_id": "uuid",
  "is_typing": true
}
```

#### 2. Mark Messages as Read
```json
{
  "type": "mark_read",
  "chat_id": "uuid",
  "receiver_id": "uuid"
}
```

### Server → Client

#### 1. New Message
```json
{
  "type": "new_message",
  "id": "uuid",
  "chat_id": "uuid",
  "sender_id": "uuid",
  "content": "Hello!",
  "message_type": "text",
  "created_at": "2026-05-13T10:30:00Z"
}
```

#### 2. Messages Read (Blue Ticks)
```json
{
  "type": "messages_read",
  "chat_id": "uuid",
  "reader_id": "uuid"
}
```

#### 3. Online Status
```json
{
  "type": "online_status",
  "user_id": "uuid",
  "status": "online"
}
```

---

## State Management (Frontend)

### Main App State
```javascript
const [isAuthenticated, setIsAuthenticated] = useState(false);
const [currentUser, setCurrentUser] = useState(null);
const [chats, setChats] = useState([]);
const [selectedChat, setSelectedChat] = useState(null);
const [messages, setMessages] = useState([]);
const [contacts, setContacts] = useState([]);
const [newMessage, setNewMessage] = useState('');
const [searchQuery, setSearchQuery] = useState('');
const [activeTab, setActiveTab] = useState('chats');
const [isNewChatOpen, setIsNewChatOpen] = useState(false);
const [contextMenu, setContextMenu] = useState(null);
```

### Refs (for WebSocket and current values)
```javascript
const wsRef = useRef(null);              // WebSocket connection
const selectedChatRef = useRef(null);    // Current chat (for WebSocket callbacks)
const currentUserRef = useRef(null);     // Current user (for WebSocket callbacks)
```

---

## API Client Configuration

### Base Configuration (api.js)
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
  withCredentials: true,  // Important for cookies
});

// Request interceptor for CSRF token
api.interceptors.request.use((config) => {
  const csrfToken = localStorage.getItem('csrf_access_token');
  if (csrfToken) {
    config.headers['X-CSRF-Token'] = csrfToken;
  }
  return config;
});

export default api;
```

---

## Common Development Tasks

### 1. Adding a New Component

```javascript
// 1. Create file: frontend/src/components/MyComponent.jsx
import React from 'react';

function MyComponent({ prop1, prop2 }) {
  return (
    <div>
      {/* Your JSX */}
    </div>
  );
}

export default MyComponent;

// 2. Import in parent component
import MyComponent from './components/MyComponent';

// 3. Use it
<MyComponent prop1={value1} prop2={value2} />
```

### 2. Adding a New API Endpoint

```python
# 1. Add route in backend/app/api/routes/your_route.py
@router.get("/new-endpoint")
def new_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Your logic
    return {"data": "response"}

# 2. Use in frontend
const response = await api.get('/your-route/new-endpoint');
```

### 3. Adding a New WebSocket Event

```python
# Backend: backend/app/api/routes/websocket.py
elif data.get("type") == "new_event":
    # Handle event
    await manager.send_personal_message({
        "type": "new_event_response",
        "data": "..."
    }, receiver_id)
```

```javascript
// Frontend: App.jsx
socket.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.type === "new_event_response") {
    // Handle response
  }
};
```

### 4. Adding a New Database Model

```python
# 1. Create model: backend/app/models/new_model.py
from sqlalchemy import Column, String
from app.core.database import Base

class NewModel(Base):
    __tablename__ = "new_table"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)

# 2. Create schema: backend/app/schemas/new_schema.py
from pydantic import BaseModel

class NewModelCreate(BaseModel):
    name: str

class NewModelResponse(BaseModel):
    id: UUID
    name: str
    
    class Config:
        from_attributes = True

# 3. Create migration
alembic revision --autogenerate -m "add new_table"
alembic upgrade head
```

---

## Debugging Tips

### Frontend Debugging

#### 1. Check WebSocket Connection
```javascript
// In browser console
console.log('WebSocket state:', wsRef.current?.readyState);
// 0 = CONNECTING, 1 = OPEN, 2 = CLOSING, 3 = CLOSED
```

#### 2. Check Current State
```javascript
// Add temporary logging in App.jsx
useEffect(() => {
  console.log('Messages updated:', messages);
}, [messages]);
```

#### 3. Check API Calls
```javascript
// In browser Network tab (F12)
// Filter by XHR to see API calls
// Check request/response headers and body
```

### Backend Debugging

#### 1. Add Logging
```python
import logging
logger = logging.getLogger(__name__)

logger.info(f"User {user_id} connected")
logger.error(f"Error: {e}")
```

#### 2. Check Database Queries
```python
# Enable SQLAlchemy logging
import logging
logging.basicConfig()
logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)
```

#### 3. Test Endpoints with curl
```bash
# Test GET endpoint
curl http://localhost:8000/api/v1/users/me \
  -H "Cookie: access_token=your_token"

# Test POST endpoint
curl -X POST http://localhost:8000/api/v1/chats/ \
  -H "Content-Type: application/json" \
  -H "Cookie: access_token=your_token" \
  -d '{"contact_id": "uuid"}'
```

---

## Performance Optimization

### Frontend

#### 1. Memoization
```javascript
import { useMemo, useCallback } from 'react';

// Memoize expensive computations
const filteredChats = useMemo(() => {
  return chats.filter(/* ... */);
}, [chats, searchQuery]);

// Memoize callbacks
const handleClick = useCallback(() => {
  // ...
}, [dependency]);
```

#### 2. Lazy Loading
```javascript
import { lazy, Suspense } from 'react';

const HeavyComponent = lazy(() => import('./HeavyComponent'));

<Suspense fallback={<div>Loading...</div>}>
  <HeavyComponent />
</Suspense>
```

### Backend

#### 1. Database Indexing
```python
# Add indexes to frequently queried columns
class Message(Base):
    chat_id = Column(UUID, ForeignKey("chats.id"), index=True)
    created_at = Column(DateTime, index=True)
```

#### 2. Query Optimization
```python
# Use eager loading to avoid N+1 queries
from sqlalchemy.orm import joinedload

chats = db.query(Chat).options(
    joinedload(Chat.participants)
).all()
```

---

## Testing

### Frontend Testing (Example with Jest)
```javascript
import { render, screen } from '@testing-library/react';
import MessageBubble from './MessageBubble';

test('renders message content', () => {
  const msg = {
    id: '1',
    content: 'Hello',
    created_at: new Date().toISOString(),
    status: 'sent'
  };
  
  render(<MessageBubble msg={msg} isMine={true} />);
  expect(screen.getByText('Hello')).toBeInTheDocument();
});
```

### Backend Testing (Example with pytest)
```python
def test_create_chat(client, auth_headers):
    response = client.post(
        "/api/v1/chats/",
        json={"contact_id": "uuid"},
        headers=auth_headers
    )
    assert response.status_code == 200
    assert response.json()["is_group"] == False
```

---

## Deployment Checklist

### Frontend
- [ ] Build production bundle: `npm run build`
- [ ] Update API base URL for production
- [ ] Update WebSocket URL for production
- [ ] Enable HTTPS
- [ ] Configure CORS properly

### Backend
- [ ] Set environment variables
- [ ] Use production database
- [ ] Enable HTTPS
- [ ] Configure proper CORS origins
- [ ] Set up logging
- [ ] Use production WSGI server (gunicorn/uvicorn)
- [ ] Set up database backups

### Database
- [ ] Run migrations: `alembic upgrade head`
- [ ] Set up regular backups
- [ ] Configure connection pooling
- [ ] Set up monitoring

---

## Useful Commands

### Development
```bash
# Backend
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Frontend
cd frontend
npm run dev

# Database migrations
alembic revision --autogenerate -m "description"
alembic upgrade head
alembic downgrade -1
```

### Production
```bash
# Backend
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker

# Frontend
npm run build
# Serve dist/ folder with nginx or similar
```

---

## Resources

- **FastAPI Docs**: https://fastapi.tiangolo.com/
- **React Docs**: https://react.dev/
- **SQLAlchemy Docs**: https://docs.sqlalchemy.org/
- **WebSocket API**: https://developer.mozilla.org/en-US/docs/Web/API/WebSocket

---

**Happy Coding! 🚀**

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


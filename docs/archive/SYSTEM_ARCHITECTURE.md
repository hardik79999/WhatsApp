# System Architecture - WhatsApp Clone

## Complete System Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                                 │
│                      (React + Vite + Tailwind)                        │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                        App.jsx                               │   │
│  │  (Main State Management & WebSocket Connection)             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                        │
│         ┌────────────────────┼────────────────────┐                 │
│         │                    │                    │                  │
│    ┌────▼────┐         ┌────▼────┐         ┌────▼────┐            │
│    │ Chat    │         │ Group   │         │ Media   │             │
│    │ List    │         │ Panels  │         │ Modals  │             │
│    └─────────┘         └─────────┘         └─────────┘             │
│         │                    │                    │                  │
│    ┌────▼────────────────────▼────────────────────▼────┐           │
│    │              ChatWindow.jsx                        │           │
│    │  ┌──────────┐  ┌──────────┐  ┌──────────┐       │           │
│    │  │ Message  │  │  Media   │  │  Typing  │       │           │
│    │  │ Bubble   │  │  Bubble  │  │Indicator │       │           │
│    │  └──────────┘  └──────────┘  └──────────┘       │           │
│    └───────────────────────────────────────────────────┘           │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
              HTTP/REST            WebSocket
                    │                   │
┌───────────────────▼───────────────────▼───────────────────────────────┐
│                        APPLICATION LAYER                               │
│                      (FastAPI + Python 3.14)                           │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │                      API Routes                               │    │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐    │    │
│  │  │  Auth  │ │ Users  │ │ Chats  │ │Messages│ │ Media  │    │    │
│  │  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘    │    │
│  │  ┌────────┐ ┌────────┐ ┌────────────────────────────────┐  │    │
│  │  │Contacts│ │Reactions│ │    WebSocket Manager          │  │    │
│  │  └────────┘ └────────┘ │  - Connection Management       │  │    │
│  │                         │  - Event Broadcasting          │  │    │
│  │                         │  - Typing Events               │  │    │
│  │                         │  - Reaction Events             │  │    │
│  │                         └────────────────────────────────┘  │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │                    Business Logic                             │    │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐            │    │
│  │  │   Models   │  │Repositories│  │  Schemas   │             │    │
│  │  │  (ORM)     │  │  (Data     │  │(Validation)│             │    │
│  │  │            │  │   Access)  │  │            │             │    │
│  │  └────────────┘  └────────────┘  └────────────┘             │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │                    Core Services                              │    │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐            │    │
│  │  │  Security  │  │  Database  │  │   Config   │             │    │
│  │  │   (JWT)    │  │ (Session)  │  │ (Settings) │             │    │
│  │  └────────────┘  └────────────┘  └────────────┘             │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                         │
└─────────────────────────────────────┬───────────────────────────────────┘
                                      │
                                 SQLAlchemy
                                      │
┌─────────────────────────────────────▼───────────────────────────────────┐
│                          DATA LAYER                                      │
│                      (PostgreSQL Database)                               │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                        Core Tables                                │  │
│  │  ┌────────┐  ┌────────┐  ┌────────────────┐  ┌────────────┐   │  │
│  │  │ users  │  │ chats  │  │chat_participants│  │  contacts  │   │  │
│  │  └────────┘  └────────┘  └────────────────┘  └────────────┘   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                     Message Tables                                │  │
│  │  ┌──────────┐  ┌──────────────┐  ┌──────────────────┐          │  │
│  │  │ messages │  │message_status│  │message_reactions │ ✨NEW    │  │
│  │  │ +status  │  │              │  │                  │          │  │
│  │  │   ✨NEW  │  │              │  │                  │          │  │
│  │  └──────────┘  └──────────────┘  └──────────────────┘          │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                     Feature Tables                                │  │
│  │  ┌─────────┐  ┌─────────────┐  ┌───────┐  ┌─────────────────┐ │  │
│  │  │statuses │  │status_views │  │ calls │  │call_participants│ │  │
│  │  └─────────┘  └─────────────┘  └───────┘  └─────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────────┐
│                          FILE STORAGE                                      │
│                      (Local File System)                                   │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  backend/media/                                                            │
│    ├── images/      (JPEG, PNG, GIF, WebP)                                │
│    ├── videos/      (MP4, WebM, OGG)                                      │
│    ├── audios/      (MP3, OGG, WAV, WebM)                                 │
│    └── documents/   (PDF, DOC, DOCX, TXT)                                 │
│                                                                             │
│  Served via: FastAPI StaticFiles at /media/*                              │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagrams

### 1. Send Text Message Flow

```
User Types Message
       │
       ▼
┌──────────────┐
│  Frontend    │
│  App.jsx     │
└──────┬───────┘
       │ POST /messages/
       │ { chat_id, content, message_type: "text" }
       ▼
┌──────────────┐
│   Backend    │
│ messages.py  │
└──────┬───────┘
       │ 1. Validate user is chat participant
       │ 2. Create Message object
       │ 3. Save to database (with status="sent")
       │ 4. Update chat.updated_at
       ▼
┌──────────────┐
│  Database    │
│   messages   │
└──────┬───────┘
       │ Message saved
       ▼
┌──────────────┐
│   Backend    │
│ WebSocket    │
└──────┬───────┘
       │ Broadcast "new_message" event
       │ to all chat participants
       ▼
┌──────────────┐
│  Frontend    │
│  All Users   │
└──────────────┘
       │ Message appears in chat
       ▼
    [Done]
```

### 2. Media Upload Flow

```
User Selects File
       │
       ▼
┌──────────────┐
│  Frontend    │
│MediaUpload   │
│   Modal      │
└──────┬───────┘
       │ 1. Validate file type
       │ 2. Check file size < 50MB
       │ 3. Create FormData
       ▼
       │ POST /media/upload
       │ FormData { file }
       ▼
┌──────────────┐
│   Backend    │
│  media.py    │
└──────┬───────┘
       │ 1. Read file contents
       │ 2. Validate type & size
       │ 3. Generate unique filename
       │ 4. Save to media/{type}/
       ▼
┌──────────────┐
│ File System  │
│ media/images/│
└──────┬───────┘
       │ File saved
       │ Return { media_url, file_size }
       ▼
┌──────────────┐
│  Frontend    │
│  App.jsx     │
└──────┬───────┘
       │ POST /messages/
       │ { chat_id, content, message_type, media_url }
       ▼
┌──────────────┐
│   Backend    │
│ messages.py  │
└──────┬───────┘
       │ Save message with media_url
       │ Broadcast to participants
       ▼
    [Done]
```

### 3. Reaction Flow

```
User Clicks React
       │
       ▼
┌──────────────┐
│  Frontend    │
│ Reaction     │
│  Picker      │
└──────┬───────┘
       │ User selects emoji
       │
       │ POST /reactions/
       │ { message_id, reaction: "❤️" }
       ▼
┌──────────────┐
│   Backend    │
│reactions.py  │
└──────┬───────┘
       │ 1. Check if user already reacted
       │ 2. Update or create reaction
       ▼
┌──────────────┐
│  Database    │
│message_      │
│reactions     │
└──────┬───────┘
       │ Reaction saved
       ▼
┌──────────────┐
│   Backend    │
│ WebSocket    │
└──────┬───────┘
       │ Broadcast "message_reaction" event
       │ { message_id, user_id, reaction }
       ▼
┌──────────────┐
│  Frontend    │
│  All Users   │
└──────────────┘
       │ Reaction appears below message
       ▼
    [Done]
```

### 4. Typing Indicator Flow

```
User Types in Input
       │
       ▼
┌──────────────┐
│  Frontend    │
│  App.jsx     │
└──────┬───────┘
       │ handleTyping()
       │ Clear previous timeout
       │
       │ WebSocket.send()
       │ { type: "typing", chat_id, is_typing: true }
       ▼
┌──────────────┐
│   Backend    │
│ websocket.py │
└──────┬───────┘
       │ Broadcast to chat participants
       │ (except sender)
       ▼
┌──────────────┐
│  Frontend    │
│  Other Users │
└──────────────┘
       │ Update typingUsers state
       │ Show "typing..." in header
       │ Show TypingIndicator component
       ▼
       │ [3 seconds pass]
       ▼
┌──────────────┐
│  Frontend    │
│  Timeout     │
└──────┬───────┘
       │ WebSocket.send()
       │ { type: "typing", chat_id, is_typing: false }
       ▼
┌──────────────┐
│   Backend    │
│ websocket.py │
└──────┬───────┘
       │ Broadcast stop typing
       ▼
┌──────────────┐
│  Frontend    │
│  Other Users │
└──────────────┘
       │ Remove from typingUsers
       │ Hide typing indicator
       ▼
    [Done]
```

### 5. Group Chat Creation Flow

```
User Clicks "New Group"
       │
       ▼
┌──────────────┐
│  Frontend    │
│CreateGroup   │
│   Panel      │
└──────┬───────┘
       │ Step 1: Select participants
       │ Step 2: Set name & picture
       │
       │ POST /chats/group
       │ { participant_ids[], group_name, group_description }
       ▼
┌──────────────┐
│   Backend    │
│  chats.py    │
└──────┬───────┘
       │ 1. Create Chat (is_group=True)
       │ 2. Add creator as admin
       │ 3. Add all participants
       ▼
┌──────────────┐
│  Database    │
│ chats +      │
│chat_         │
│participants  │
└──────┬───────┘
       │ Group created
       │ Return group data
       ▼
┌──────────────┐
│  Frontend    │
│  App.jsx     │
└──────────────┘
       │ Refresh chat list
       │ Open new group chat
       ▼
    [Done]
```

## Component Hierarchy

```
App.jsx
├── Login.jsx (if not authenticated)
└── Main Layout
    ├── Left Panel (width: 420px)
    │   ├── Header
    │   │   ├── Avatar (current user)
    │   │   └── Action Buttons
    │   │       ├── New Chat
    │   │       ├── New Group ✨
    │   │       └── Menu
    │   ├── Tabs (Chats | Status | Calls)
    │   ├── Search Bar
    │   └── ChatList.jsx
    │       └── ChatItem (for each chat)
    │           ├── Avatar
    │           ├── Chat Name
    │           ├── Last Message
    │           └── Timestamp
    │
    ├── Right Panel (flex: 1)
    │   └── ChatWindow.jsx
    │       ├── Header
    │       │   ├── Avatar
    │       │   ├── Chat Name
    │       │   ├── Status/Typing ✨
    │       │   └── Action Buttons
    │       ├── Messages Area
    │       │   ├── Date Labels
    │       │   ├── MessageBubble.jsx (text)
    │       │   │   ├── Content
    │       │   │   ├── Timestamp
    │       │   │   ├── Ticks (if mine)
    │       │   │   └── Reactions ✨
    │       │   ├── MediaMessageBubble.jsx ✨ (media)
    │       │   │   ├── Media Preview
    │       │   │   ├── Caption
    │       │   │   └── Reactions ✨
    │       │   └── TypingIndicator.jsx ✨
    │       └── Input Bar
    │           ├── Emoji Button
    │           ├── Attach Button ✨
    │           ├── Text Input
    │           └── Send/Mic Button
    │
    └── Modals & Panels (overlays)
        ├── NewChatPanel.jsx
        │   ├── Contact List
        │   └── Sync Button
        ├── CreateGroupPanel.jsx ✨
        │   ├── Step 1: Select Participants
        │   └── Step 2: Group Details
        ├── GroupInfoPanel.jsx ✨
        │   ├── Group Picture
        │   ├── Group Name
        │   ├── Participants List
        │   └── Actions (Add/Remove/Leave)
        ├── MediaUploadModal.jsx ✨
        │   ├── File Type Selector
        │   ├── Drag & Drop Area
        │   └── Preview
        ├── ReactionPicker.jsx ✨
        │   └── Emoji Grid (8 emojis)
        ├── ForwardMessageModal.jsx ✨
        │   ├── Chat List
        │   └── Forward Button
        └── ContextMenu.jsx
            └── Menu Items
                ├── Reply
                ├── React ✨
                ├── Copy
                ├── Forward ✨
                ├── Star
                └── Delete
```

## State Management

### App.jsx State

```javascript
// Authentication
isAuthenticated: boolean
currentUser: User | null

// Chats
chats: Chat[]
selectedChat: Chat | null
messages: Message[]

// UI State
loading: boolean
isNewChatOpen: boolean
isCreateGroupOpen: boolean ✨
isGroupInfoOpen: boolean ✨
isMediaUploadOpen: boolean ✨
isForwardModalOpen: boolean ✨

// Contacts
contacts: Contact[]
loadingContacts: boolean

// Messages
newMessage: string
messageToForward: Message | null ✨

// UI Elements
searchQuery: string
activeTab: 'chats' | 'status' | 'calls'
contextMenu: { x, y, msgId, content } | null
reactionPicker: { x, y, messageId } | null ✨

// Real-time
typingUsers: { [chatId]: userId[] } ✨

// Refs
wsRef: WebSocket
selectedChatRef: Chat
currentUserRef: User
typingTimeoutRef: Timeout ✨
```

## WebSocket Events

### Client → Server

```javascript
// Typing indicator
{
  type: "typing",
  chat_id: UUID,
  is_typing: boolean
}

// Mark messages as read
{
  type: "mark_read",
  chat_id: UUID,
  receiver_id: UUID
}
```

### Server → Client

```javascript
// New message
{
  type: "new_message",
  id: UUID,
  chat_id: UUID,
  sender_id: UUID,
  content: string,
  message_type: string,
  created_at: ISO8601
}

// Messages read
{
  type: "messages_read",
  chat_id: UUID,
  reader_id: UUID
}

// Online status
{
  type: "online_status",
  user_id: UUID,
  status: "online" | "offline"
}

// Typing indicator ✨
{
  type: "typing",
  chat_id: UUID,
  user_id: UUID,
  is_typing: boolean
}

// Message reaction ✨
{
  type: "message_reaction",
  message_id: UUID,
  user_id: UUID,
  username: string,
  reaction: string,
  chat_id: UUID
}

// Reaction removed ✨
{
  type: "message_reaction_removed",
  message_id: UUID,
  user_id: UUID,
  chat_id: UUID
}
```

## Database Schema

### Core Tables

```sql
users
├── id (UUID, PK)
├── phone (VARCHAR, UNIQUE)
├── username (VARCHAR)
├── bio (VARCHAR)
├── profile_pic (VARCHAR)
├── is_online (BOOLEAN)
├── last_seen (TIMESTAMP)
├── is_deleted (BOOLEAN)
├── deleted_at (TIMESTAMP)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

chats
├── id (UUID, PK)
├── is_group (BOOLEAN)
├── group_name (VARCHAR)
├── group_picture (VARCHAR)
├── group_description (TEXT)
├── created_by (UUID, FK → users.id)
├── last_message_id (UUID)
├── last_message_at (TIMESTAMP)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

chat_participants
├── chat_id (UUID, PK, FK → chats.id)
├── user_id (UUID, PK, FK → users.id)
├── role (VARCHAR) // 'admin' | 'member'
├── is_muted (BOOLEAN)
└── joined_at (TIMESTAMP)

messages
├── id (UUID, PK)
├── chat_id (UUID, FK → chats.id)
├── sender_id (UUID, FK → users.id)
├── content (TEXT)
├── media_url (VARCHAR)
├── thumbnail_url (VARCHAR)
├── file_size (INTEGER)
├── duration (INTEGER)
├── message_type (VARCHAR) // 'text' | 'image' | 'video' | 'audio' | 'document'
├── reply_to_message_id (UUID, FK → messages.id)
├── is_edited (BOOLEAN)
├── edited_at (TIMESTAMP)
├── is_deleted (BOOLEAN)
├── deleted_at (TIMESTAMP)
├── status (VARCHAR) ✨ // 'sent' | 'delivered' | 'read'
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

message_status
├── message_id (UUID, PK, FK → messages.id)
├── user_id (UUID, PK, FK → users.id)
├── status (VARCHAR) // 'sent' | 'delivered' | 'read'
└── updated_at (TIMESTAMP)

message_reactions ✨ NEW
├── id (UUID, PK)
├── message_id (UUID, FK → messages.id)
├── user_id (UUID, FK → users.id)
├── reaction (VARCHAR) // Emoji
├── created_at (TIMESTAMP)
└── UNIQUE(message_id, user_id)

contacts
├── id (UUID, PK)
├── user_id (UUID, FK → users.id)
├── contact_id (UUID, FK → users.id)
├── saved_name (VARCHAR)
├── created_at (TIMESTAMP)
├── updated_at (TIMESTAMP)
└── UNIQUE(user_id, contact_id)
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/send-otp` - Send OTP to phone
- `POST /api/v1/auth/verify-otp` - Verify OTP and login
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout user

### Users
- `GET /api/v1/users/me` - Get current user
- `PUT /api/v1/users/me` - Update current user
- `GET /api/v1/users/{user_id}` - Get user by ID

### Contacts
- `GET /api/v1/contacts/` - Get all contacts
- `POST /api/v1/contacts/sync` - Sync contact by phone

### Chats
- `GET /api/v1/chats/` - Get all chats
- `POST /api/v1/chats/` - Create 1-on-1 chat
- `POST /api/v1/chats/group` ✨ - Create group chat
- `PUT /api/v1/chats/group/{chat_id}` ✨ - Update group
- `POST /api/v1/chats/group/{chat_id}/participants` ✨ - Add participant
- `DELETE /api/v1/chats/group/{chat_id}/participants/{user_id}` ✨ - Remove participant

### Messages
- `GET /api/v1/messages/{chat_id}` - Get chat messages
- `POST /api/v1/messages/` - Send message

### Media ✨
- `POST /api/v1/media/upload` - Upload media file
- `DELETE /api/v1/media/{folder}/{filename}` - Delete media file
- `GET /media/{folder}/{filename}` - Serve media file (static)

### Reactions ✨
- `POST /api/v1/reactions/` - Add/update reaction
- `DELETE /api/v1/reactions/{message_id}` - Remove reaction
- `GET /api/v1/reactions/{message_id}` - Get message reactions

### WebSocket
- `WS /api/v1/ws` - WebSocket connection

## Security Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Security Layers                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. Authentication Layer                                 │
│     ├── JWT Access Token (15 min expiry)                │
│     ├── JWT Refresh Token (7 days expiry)               │
│     ├── HttpOnly Cookies                                │
│     └── CSRF Token (X-CSRF-Token header)                │
│                                                          │
│  2. Authorization Layer                                  │
│     ├── Chat Participant Verification                   │
│     ├── Message Sender Verification                     │
│     ├── Group Admin Verification                        │
│     └── File Upload Authentication                      │
│                                                          │
│  3. Input Validation Layer                              │
│     ├── Pydantic Schemas                                │
│     ├── File Type Whitelist                             │
│     ├── File Size Limits                                │
│     └── SQL Injection Prevention (ORM)                  │
│                                                          │
│  4. Data Protection Layer                               │
│     ├── Password Hashing (bcrypt)                       │
│     ├── Secure Token Generation                         │
│     ├── Foreign Key Constraints                         │
│     └── Cascade Deletes                                 │
│                                                          │
│  5. Network Security Layer                              │
│     ├── CORS Configuration                              │
│     ├── WebSocket Authentication                        │
│     ├── HTTPS (Production)                              │
│     └── Rate Limiting (TODO)                            │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Performance Optimizations

### Frontend
- Debounced typing indicator (3s)
- Functional setState for concurrent updates
- Conditional rendering (modals)
- Refs for WebSocket and current values
- CSS transitions for smooth animations

### Backend
- Database connection pooling
- Efficient WebSocket broadcasting
- File streaming (not loading in memory)
- Indexed database columns
- Proper session cleanup

### Database
- Foreign key indexes
- Composite primary keys
- Unique constraints
- Timestamp indexes
- Cascade deletes

---

**Legend:**
- ✨ = New feature added in Phase 1-3
- FK = Foreign Key
- PK = Primary Key

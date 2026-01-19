# 📊 Friends & Chat System - Architecture Overview

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        React Frontend                            │
├─────────────────────────────────────────────────────────────────┤
│
│  ┌─────────────────┐        ┌──────────────────┐
│  │ Dashboard Page  │        │ Navigation Links │
│  │  (5 Cards)      │        │  - Friends       │
│  │                 │        │  - Chat          │
│  └────────┬────────┘        └────────┬─────────┘
│           │                          │
│           └──────────────┬───────────┘
│                          ▼
│     ┌────────────────────────────────────────┐
│     │     Friends Component (729 lines)      │
│     ├────────────────────────────────────────┤
│     │ - Search Users (2+ chars)              │
│     │ - Send/Receive Requests                │
│     │ - Accept/Reject/Remove Friends         │
│     │ - Navigate to Chat                     │
│     └────────────────┬───────────────────────┘
│                      │
│                      ▼
│     ┌────────────────────────────────────────┐
│     │     Chat Component (720 lines)         │
│     ├────────────────────────────────────────┤
│     │ - Friends Sidebar                      │
│     │ - Message Window                       │
│     │ - Message History                      │
│     │ - Real-time Updates (WebSocket)        │
│     └────────────────┬───────────────────────┘
│                      │
│     ┌────────────────▼───────────────────┐
│     │  ChatWebSocket Utility (165 lines) │
│     ├────────────────────────────────────┤
│     │ - JWT Authentication               │
│     │ - Connection Management            │
│     │ - Message Handlers                 │
│     │ - Auto-Reconnect (3s)              │
│     └────────────────┬────────────────────┘
│                      │
│                      │ HTTP & WebSocket
│                      │
└──────────────────────┼────────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│                  Django REST Backend                             │
├──────────────────────────────────────────────────────────────────┤
│
│  ┌──────────────────────────────────────┐
│  │     REST API Endpoints (9)           │
│  ├──────────────────────────────────────┤
│  │ /friends/                            │
│  │  ├─ search/ (GET)                    │
│  │  ├─ request/{id}/ (POST)             │
│  │  ├─ request/{id}/accept/ (POST)      │
│  │  ├─ request/{id}/reject/ (POST)      │
│  │  ├─ requests/ (GET)                  │
│  │  ├─ list/ (GET)                      │
│  │  ├─ remove/{id}/ (POST)              │
│  │  └─ chat/{id}/ (GET)                 │
│  │ /chat/                               │
│  │  └─ history/{id}/ (GET)              │
│  └────────────┬─────────────────────────┘
│               │
│               ▼
│  ┌──────────────────────────────────────┐
│  │  WebSocket Consumer (/ws/chat/{id}/) │
│  ├──────────────────────────────────────┤
│  │ - JWT Token Validation               │
│  │ - Friend Relationship Check          │
│  │ - Message Persistence                │
│  │ - Real-time Broadcasting             │
│  │ - Auto-disconnect if not friends     │
│  └────────────┬─────────────────────────┘
│               │
│               ▼
│  ┌──────────────────────────────────────┐
│  │   Database Models (3)                │
│  ├──────────────────────────────────────┤
│  │ - FriendRequest                      │
│  │   (sender, receiver, status)         │
│  │ - ChatRoom                           │
│  │   (user1, user2 ordered)             │
│  │ - Message                            │
│  │   (sender, recipient, text, time)    │
│  └────────────┬─────────────────────────┘
│               │
│               ▼
│          [PostgreSQL/SQLite]
│
└──────────────────────────────────────────────────────────────────┘

            ┌────────────────────┐
            │  Redis (Channel)   │
            │  (WebSocket Events)│
            └────────────────────┘
```

## Data Flow Diagram

### Friend Request Flow
```
User A                          Backend                         User B
   │                               │                               │
   ├─ Search for User B ─────────→ │                               │
   │                               ├─ Query Database              │
   │                               └─ Return Results ────→ Display │
   │                               │                               │
   ├─ Send Friend Request ────────→ │                               │
   │                               ├─ Validate Request            │
   │                               ├─ Create FriendRequest        │
   │                               │  (status=PENDING)            │
   │                               └─ Save to DB                  │
   │                               │                               │
   │                         (User B Receives Email/Notification)  │
   │                               │                               │
   │                               │ ← Accept Request             │
   │                               ├─ Update FriendRequest        │
   │                               │  (status=ACCEPTED)           │
   │                               ├─ Create ChatRoom             │
   │                               └─ Save to DB                  │
   │                               │                               │
   │ ← Friends ────────────────────┤                     Friends ──→│
```

### Real-Time Chat Flow
```
User A                  WebSocket                   Backend              User B
  │                         │                         │                    │
  ├─ Connect to /ws/chat/B ─┼────────────────────────→ │                    │
  │  (JWT Token in URL)     │                         ├─ Extract JWT       │
  │                         │                         ├─ Get User from JWT │
  │                         │                         ├─ Check Friendship  │
  │                         │                         ├─ Create Group      │
  │                         │                         ├─ Accept Connection │
  │                         │←─ Connection OK ────────┤                    │
  │                         │                         │                    │
  ├─ Send Message ─────────→ │                         │                    │
  │  {"message":"Hi"}       │                         ├─ Parse Message     │
  │                         │                         ├─ Validate Friend   │
  │                         │                         ├─ Save to Database  │
  │                         │                         ├─ Broadcast to Group
  │                         │                         │                    │
  │                         │    Message Received ────┼────────────────→ │
  │                         │                         │                 Display
  │                         │                         │                    │
  │                         │   ← Send Message ───────┼────────────────────┤
  │                         │                         ├─ Parse Message    │
  │  Message Received ──────┼────────────────────────┤ ├─ Save to DB      │
  │  Display                │                        │ ├─ Broadcast       │
  │                         │                        │                    │
  ├─ Disconnect ───────────→ │                        │                    │
  │                         │                        ├─ Leave Group       │
  │                         │←─ Disconnect OK ───────┤                    │
  │                         │                        │                    │
```

## Database Schema Relationships

```
┌─────────────────┐
│  User (Django)  │
│  - id (PK)      │
│  - username     │
│  - email        │
│  - password_hash│
└────────┬────────┘
         │
         ├───────────────────────┬────────────────────────┐
         │                       │                        │
         ▼                       ▼                        ▼
    
┌──────────────────────────────┐
│    FriendRequest             │
├──────────────────────────────┤
│ - id (PK)                    │
│ - sender_id (FK→User)        │ ← Sender
│ - receiver_id (FK→User)      │ ← Receiver
│ - status (Choice)            │
│   • PENDING                  │
│   • ACCEPTED                 │
│   • REJECTED                 │
│ - created_at                 │
│ - updated_at                 │
│ - unique(sender, receiver)   │
└──────────────────────────────┘
         │
         │ accept()
         ▼
┌──────────────────────────────┐
│    ChatRoom                  │
├──────────────────────────────┤
│ - id (PK)                    │
│ - user1_id (FK→User) ────┐   │ ← Lower ID
│ - user2_id (FK→User)    │   │ ← Higher ID
│ - created_at             │   │
│ - unique(user1, user2)   │   │
└──────────────────────────┼───┘
                           │
                           ▼
        ┌──────────────────────────────────┐
        │        Message                   │
        ├──────────────────────────────────┤
        │ - id (PK)                        │
        │ - sender_id (FK→User)            │
        │ - recipient_id (FK→User)         │
        │ - text (TextField)               │
        │ - created_at (DateTime)          │
        │ - is_read (Boolean)              │
        │ - index(sender,recipient,created)│
        └──────────────────────────────────┘
```

## API Response Examples

### Search Users Response
```json
GET /api/friends/search/?q=john

[
  {
    "id": 5,
    "username": "john_doe",
    "email": "john@example.com"
  }
]
```

### Friend Request Response
```json
POST /api/friends/request/5/

{
  "id": 1,
  "sender": {
    "id": 1,
    "username": "alice"
  },
  "receiver": {
    "id": 5,
    "username": "john_doe"
  },
  "status": "PENDING",
  "created_at": "2026-01-17T10:30:00Z"
}
```

### Friends List Response
```json
GET /api/friends/list/

[
  {
    "id": 5,
    "username": "john_doe",
    "email": "john@example.com",
    "total_points": 1500
  },
  {
    "id": 8,
    "username": "jane_smith",
    "email": "jane@example.com",
    "total_points": 2000
  }
]
```

### Chat History Response
```json
GET /api/chat/history/5/

[
  {
    "id": 1,
    "sender": {
      "id": 1,
      "username": "alice"
    },
    "recipient": {
      "id": 5,
      "username": "john_doe"
    },
    "text": "Hi John!",
    "created_at": "2026-01-17T10:30:00Z",
    "is_read": true
  }
]
```

### WebSocket Message Format
```json
{
  "type": "message",
  "message": "Hello friend!",
  "sender_id": 5,
  "sender_username": "john_doe",
  "timestamp": "2026-01-17T10:30:15Z"
}
```

## Component Interaction Map

```
App.js
├── /login → Login
├── /register → Register
├── /dashboard → Dashboard
│   └── Quick Actions
│       ├── → /friends
│       └── → /chat
├── /friends → Friends Component
│   ├── Search Tab
│   │   └── Call: GET /api/friends/search/
│   ├── Pending Requests Tab
│   │   ├── Call: GET /api/friends/requests/
│   │   ├── Accept: POST /api/friends/request/{id}/accept/
│   │   └── Reject: POST /api/friends/request/{id}/reject/
│   └── Friends Tab
│       ├── Call: GET /api/friends/list/
│       ├── Remove: POST /api/friends/remove/{id}/
│       └── Navigate → /chat?friend={id}
├── /chat → Chat Component
│   ├── Sidebar (Friends List)
│   │   └── Click to Select
│   ├── Message Window
│   │   ├── Load History: GET /api/chat/history/{id}/
│   │   ├── WebSocket Connect: ws://host/ws/chat/{id}/?token=...
│   │   └── Send Message: ws.send({"message": "text"})
│   └── ChatWebSocket Utility
│       ├── connect() → Establish WS
│       ├── sendMessage() → Send via WS
│       ├── onMessage() → Receive via WS
│       └── onConnectionEvent() → Connection status
└── /profile
```

## Authentication Flow

```
User Credentials
       │
       ▼
┌─────────────────────┐
│  POST /auth/token/  │
├─────────────────────┤
│ Username & Password │
└────────┬────────────┘
         │
         ▼
   [JWT Tokens]
   - access_token
   - refresh_token
         │
         ├─→ Stored in localStorage
         │
         ├─→ Axios adds to Headers
         │   Authorization: Bearer {token}
         │
         └─→ WebSocket Query Parameter
             ws://host/ws/?token={token}
                   │
                   ▼
         ┌─────────────────────┐
         │ ChatConsumer        │
         ├─────────────────────┤
         │ get_user_from_token │
         └─────────────────────┘
```

## Error Handling Flow

```
Client Action
     │
     ├─→ API Call (HTTP)
     │   │
     │   ├─ Success (200-201)
     │   │  └─ Update State → Display
     │   │
     │   ├─ Client Error (4xx)
     │   │  └─ Show Error Banner
     │   │
     │   └─ Server Error (5xx)
     │      └─ Retry + Show Error
     │
     └─→ WebSocket Message
         │
         ├─ Send Success
         │  └─ Add to Messages
         │
         ├─ Send Failure
         │  └─ Show Error + Keep Text
         │
         ├─ Connection Lost
         │  └─ Auto-Reconnect (3s)
         │     └─ Status: Connecting...
         │
         └─ Auth Failure
            └─ Redirect to Login
```

## State Management Architecture

```
Dashboard
├── Friends Component
│   ├── searchQuery (string)
│   ├── searchResults (array)
│   ├── pendingRequests (array)
│   ├── friends (array)
│   ├── activeTab (string)
│   ├── isSearching (boolean)
│   ├── isLoading (boolean)
│   ├── error (string)
│   └── successMessage (string)
│
└── Chat Component
    ├── friends (array)
    ├── selectedFriend (object)
    ├── messages (array)
    ├── messageText (string)
    ├── isLoading (boolean)
    ├── isConnected (boolean)
    ├── error (string)
    └── isSending (boolean)

    + ChatWebSocket State
      ├── ws (WebSocket)
      ├── isConnected (boolean)
      ├── messageHandlers (array)
      └── eventHandlers (array)
```

## Responsive Design Breakpoints

```
Mobile (< 600px)
├── Chat Sidebar
│   └─ Horizontal Scroll (Compact)
├── Message Window
│   └─ Full Width
└── Buttons
    └─ Touch-Optimized (44px min)

Tablet (600px - 1024px)
├── Chat Sidebar
│   └─ Reduced Width
├── Message Window
│   └─ Flexible Width
└── Messages
    └─ Wider Display Area

Desktop (> 1024px)
├── Chat Sidebar
│   └─ 300px Fixed Width
├── Message Window
│   └─ Remaining Space
└── Full Feature Display
    └─ All Elements Visible
```

This architecture provides a complete, scalable foundation for a professional friend management and real-time chat system!

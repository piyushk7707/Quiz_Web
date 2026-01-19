# Friends & Chat System - Complete Implementation Guide

## Overview

This document provides a comprehensive guide to the Friends and Real-Time Chat system implemented for the Django + React Quiz Platform.

## Backend Components

### 1. Database Models

#### FriendRequest Model (`backend/apps/friends/models.py`)
- **sender**: Foreign key to User
- **receiver**: Foreign key to User  
- **status**: Choice field (PENDING, ACCEPTED, REJECTED)
- **created_at**: Timestamp of request creation
- **updated_at**: Timestamp of last update
- **unique_together**: (sender, receiver) to prevent duplicate requests
- **Methods**:
  - `accept()`: Accept friend request and create ChatRoom
  - `reject()`: Reject friend request

#### ChatRoom Model (`backend/apps/friends/models.py`)
- **user1**: Foreign key to User (lower ID)
- **user2**: Foreign key to User (higher ID)
- **unique_together**: (user1, user2) to ensure single chat room per pair
- **Static Methods**:
  - `get_or_create_room(user1, user2)`: Gets or creates room with consistent ordering

#### Message Model (`backend/apps/chat/models.py`)
- **sender**: Foreign key to User (related_name: 'sent_messages')
- **recipient**: Foreign key to User (related_name: 'received_messages')
- **text**: Text field for message content
- **created_at**: Timestamp of message creation (auto_now_add=True)
- **is_read**: Boolean field to track read status
- **Meta**: Indexed on (sender, recipient, created_at) for query optimization

### 2. Serializers

#### Friends Serializers (`backend/apps/friends/serializers.py`)

**UserSearchSerializer**
- Used for search results
- Fields: id, username, email

**FriendRequestSerializer**
- Full friend request details
- Fields: id, sender (nested), receiver (nested), status, created_at, updated_at

**FriendSerializer**
- Friend list items
- Fields: id, username, email, total_points, friend_request_id

**ChatRoomSerializer**
- Chat room details
- Fields: id, user1 (nested), user2 (nested)

#### Chat Serializers (`backend/apps/chat/serializers.py`)

**MessageSerializer**
- Message details
- Fields: id, sender (nested), recipient (nested), text, created_at, is_read

### 3. API Endpoints

#### Friends Endpoints

**Search Users**
```
GET /api/friends/search/?q={query}
```
- Minimum 2 characters
- Returns up to 20 users excluding current user
- Requires: IsAuthenticated

**Send Friend Request**
```
POST /api/friends/request/{user_id}/
```
- Sends friend request to another user
- Prevents self-requests
- Prevents duplicate requests
- Requires: IsAuthenticated

**Accept Friend Request**
```
POST /api/friends/request/{request_id}/accept/
```
- Accepts pending friend request
- Creates ChatRoom automatically
- Requires: IsAuthenticated

**Reject Friend Request**
```
POST /api/friends/request/{request_id}/reject/
```
- Rejects pending friend request
- Requires: IsAuthenticated

**List Pending Requests**
```
GET /api/friends/requests/
```
- Returns incoming pending friend requests
- Requires: IsAuthenticated

**List Friends**
```
GET /api/friends/list/
```
- Returns all accepted friends
- Requires: IsAuthenticated

**Remove Friend**
```
POST /api/friends/remove/{friend_id}/
```
- Removes friend (deletes ChatRoom)
- Requires: IsAuthenticated

**Get Chat Room**
```
GET /api/friends/chat/{friend_id}/
```
- Gets or creates chat room with friend
- Verifies friendship before returning
- Requires: IsAuthenticated

#### Chat Endpoints

**Chat History**
```
GET /api/chat/history/{friend_id}/
```
- Returns message history between users
- Requires: IsAuthenticated

### 4. WebSocket Consumer

**ChatConsumer** (`backend/apps/chat/consumers.py`)

**Connection Flow:**
1. Client connects to `ws://host/ws/chat/{friend_id}/?token={jwt_token}`
2. Consumer extracts and validates JWT from query parameter
3. Verifies users are accepted friends
4. Creates room name using consistent ordering
5. Accepts WebSocket connection

**Methods:**
- `connect()`: Authenticate, validate friendship, join group
- `disconnect()`: Leave group
- `receive(text_data)`: Receive message, validate, persist, broadcast
- `chat_message()`: Send formatted message to WebSocket
- `get_user_from_token()`: Extract user from JWT token
- `check_friendship()`: Verify users are accepted friends
- `save_message()`: Persist message to database

**Message Format:**
```json
{
  "message": "text content"
}
```

**Response Format:**
```json
{
  "type": "message",
  "message": "text content",
  "sender_id": 123,
  "sender_username": "john",
  "timestamp": "2026-01-17T10:30:00Z"
}
```

## Frontend Components

### 1. Friends Component

**File:** `frontend/src/friends/Friends.jsx`

**Features:**
- User search (minimum 2 characters)
- Send friend requests
- Accept/reject friend requests
- View all friends
- Remove friends
- Responsive mobile layout (600px breakpoint)

**State:**
- `searchQuery`: Current search input
- `searchResults`: Search results array
- `pendingRequests`: Incoming friend requests
- `friends`: Accepted friends list
- `activeTab`: Current tab (friends or requests)
- `isSearching`: Search loading state
- `isLoading`: Initial load state
- `error`: Error message
- `successMessage`: Success message

**Key Functions:**
- `handleSearch()`: Search users by query
- `handleSendRequest(userId)`: Send friend request
- `handleAcceptRequest(requestId)`: Accept friend request
- `handleRejectRequest(requestId)`: Reject friend request
- `handleRemoveFriend(friendId)`: Remove friend
- `handleChatClick(friend)`: Navigate to chat with friend

### 2. Chat Component

**File:** `frontend/src/chat/Chat.js`

**Features:**
- Friends list sidebar (left panel)
- Message window (center panel)
- Real-time messaging via WebSocket
- Message history loading
- Connection status indicator
- Auto-scroll to latest message
- Responsive mobile layout (sidebar becomes horizontal scroll)
- WhatsApp-like UI

**State:**
- `friends`: List of friends to chat with
- `selectedFriend`: Currently selected friend
- `messages`: Array of messages
- `messageText`: Current message input
- `isLoading`: Initial friends list load state
- `isConnected`: WebSocket connection status
- `error`: Error message
- `isSending`: Message send state

**Key Functions:**
- `fetchFriends()`: Get list of friends from API
- `selectFriend(friend)`: Select a friend and load history
- `setupWebSocket()`: Establish WebSocket connection
- `handleSendMessage(e)`: Send message via WebSocket
- `scrollToBottom()`: Auto-scroll to latest message

**WebSocket Integration:**
- Creates ChatWebSocket instance with userId, friendId, and JWT token
- Registers message handler to update messages state
- Registers connection event handler to update UI status
- Auto-reconnects on disconnect (3-second delay)

### 3. ChatWebSocket Utility

**File:** `frontend/src/utils/ChatWebSocket.js`

**Class:** ChatWebSocket

**Constructor:**
```javascript
new ChatWebSocket(userId, friendId, token)
```

**Methods:**
- `connect()`: Establish WebSocket connection with JWT authentication
- `disconnect()`: Close WebSocket connection
- `sendMessage(text)`: Send message if connected
- `isConnected()`: Check if WebSocket is connected
- `onMessage(handler)`: Register callback for incoming messages
- `onConnectionEvent(handler)`: Register callback for connection events

**Features:**
- JWT token authentication via query parameter
- Auto-reconnect on disconnect (3-second delay)
- Connection event handlers (connected, disconnected, error)
- Message routing based on type
- Error handling and logging

## Authentication & Security

### JWT Authentication
- All REST API endpoints require `IsAuthenticated` permission
- WebSocket uses JWT token extracted from query parameter
- Token format: `?token={jwt_token}`
- Token validated on connection establishment

### Friend Verification
- All chat operations verify users are accepted friends
- WebSocket consumer checks friendship before accepting connection
- API endpoints validate friendship before returning data

### Self-Request Prevention
- FriendRequest model prevents sending request to self
- Backend validation in SendFriendRequestView

## API Integration

### Axios Client Setup

**File:** `frontend/src/api/client.js`

Features:
- JWT token automatically added to all requests
- Token refreshed from localStorage
- Error handling with status code checking

Example:
```javascript
const api = axios.create({
  baseURL: 'http://localhost:8000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

## Database Migrations

After implementing these changes, run:
```bash
python manage.py makemigrations
python manage.py migrate
```

## WebSocket Configuration

The system uses Django Channels with Redis for WebSocket support.

**ASGI Configuration** (`backend/config/asgi.py`):
```python
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from django.core.asgi import get_asgi_application

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter([
            path("ws/chat/<friend_id>/", ChatConsumer.as_asgi()),
        ])
    ),
})
```

## URL Configuration

**Main URLs** (`backend/config/urls.py`):
```python
urlpatterns = [
    path('api/friends/', include('apps.friends.urls')),
    path('api/chat/', include('apps.chat.urls')),
]
```

**Friends URLs** (`backend/apps/friends/urls.py`):
```
/search/ - GET (search users)
/request/{user_id}/ - POST (send request)
/request/{request_id}/accept/ - POST
/request/{request_id}/reject/ - POST
/requests/ - GET (pending requests)
/list/ - GET (friends list)
/remove/{friend_id}/ - POST
/chat/{friend_id}/ - GET (chat room)
```

**Chat URLs** (`backend/apps/chat/urls.py`):
```
/history/{friend_id}/ - GET (message history)
```

## Frontend Routes

**App.js Routes:**
```javascript
<Route path="/friends" element={<ProtectedRoute><Friends /></ProtectedRoute>} />
<Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
```

## Features Implemented

### Friends System
✅ Search users with autocomplete
✅ Send friend requests
✅ Accept/reject requests
✅ View friends list
✅ Remove friends
✅ Prevent duplicate requests
✅ Prevent self-requests
✅ Real-time friend status

### Chat System
✅ One-to-one chat only
✅ Real-time messaging via WebSocket
✅ Message persistence in database
✅ Chat history retrieval
✅ Friend-only chat restriction
✅ JWT authentication
✅ Auto-reconnect on disconnect
✅ Connection status indicator
✅ Message timestamps
✅ WhatsApp-like UI
✅ Responsive mobile design

## Error Handling

**Backend:**
- FriendRequest validation (unique constraint, status checks)
- ChatRoom bidirectional query consistency
- WebSocket friend verification
- JWT token extraction and validation
- Message persistence error handling

**Frontend:**
- API error messages displayed to user
- WebSocket connection failures handled gracefully
- User feedback on search, request, and message operations
- Error banners with dismissible options
- Loading states during async operations

## Performance Optimizations

1. **Database Indexing**: Message queries indexed on (sender, recipient, created_at)
2. **Consistent Room Naming**: ChatRoom ordering ensures efficient queries
3. **Lazy Loading**: Messages loaded on demand
4. **Connection Reuse**: WebSocket maintained across navigation
5. **Query Optimization**: Efficient Q() queries for bidirectional lookups

## Testing Recommendations

1. **Send friend requests between test users**
2. **Accept/reject requests**
3. **Start chat with friend**
4. **Send messages in real-time**
5. **Verify message persistence**
6. **Test WebSocket reconnection**
7. **Check friend-only access control**
8. **Test search with various queries**
9. **Verify mobile responsiveness**
10. **Test JWT authentication failures**

## Deployment Checklist

- [ ] Run migrations: `python manage.py migrate`
- [ ] Configure Redis for Channels
- [ ] Configure WebSocket URL (WSS for HTTPS)
- [ ] Update CORS settings for WebSocket
- [ ] Set DEBUG=False in production
- [ ] Configure static files
- [ ] Test all endpoints with valid JWT tokens
- [ ] Verify WebSocket connections work
- [ ] Test friend request workflow
- [ ] Test message sending and receiving

## Future Enhancements

1. Group chats (multiple users)
2. Voice/video calling
3. File sharing
4. Message reactions/emojis
5. Typing indicators
6. Read receipts
7. Message search
8. Chat notifications
9. Message translation
10. User blocking feature

## Support & Debugging

**Common Issues:**

1. **WebSocket connection fails**: Check JWT token in query parameter, verify friend relationship
2. **Messages not persisting**: Check database migration, verify Message model
3. **Search not working**: Minimum 2 characters required, check API endpoint
4. **Friend requests duplicated**: Check unique_together constraint on database

For more help, review the code comments in the respective files.

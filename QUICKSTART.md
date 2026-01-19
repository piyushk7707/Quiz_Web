# Quick Start Guide - Friends & Chat System

## 🚀 Getting Started in 5 Minutes

### Step 1: Database Migrations
```bash
cd backend
python manage.py makemigrations
python manage.py migrate
```

### Step 2: Verify Redis is Running
```bash
redis-cli ping
# Should return: PONG
```

### Step 3: Start Backend (Development)
```bash
cd backend
python manage.py runserver
```

**OR use Daphne for WebSocket support:**
```bash
daphne -b 0.0.0.0 -p 8000 config.asgi:application
```

### Step 4: Start Frontend (in new terminal)
```bash
cd frontend
npm start
```

### Step 5: Test the System
1. Create two test accounts at http://localhost:3000/register
2. Login with first account
3. Go to Dashboard → Click "👥 Friends"
4. Search for the second user
5. Click "Add Friend" to send request
6. Logout and login with second account
7. Go to Friends → "Pending Requests" tab
8. Click "Accept" to accept the request
9. Go to Dashboard → Click "💬 Chat"
10. Select the friend from sidebar
11. Send a message and see it appear in real-time!

## 📁 Project Structure

```
backend/
├── apps/
│   ├── friends/              # Friend management
│   │   ├── models.py         # FriendRequest, ChatRoom
│   │   ├── serializers.py    # Friend serializers
│   │   ├── views.py          # 8 API views
│   │   └── urls.py           # 9 endpoints
│   ├── chat/                 # Real-time chat
│   │   ├── models.py         # Message model
│   │   ├── consumers.py      # WebSocket consumer
│   │   ├── serializers.py    # Message serializers
│   │   ├── views.py          # Chat history view
│   │   └── urls.py           # Chat endpoints
│   └── accounts/, quiz/, rewards/  # Other apps

frontend/
├── src/
│   ├── friends/
│   │   └── Friends.jsx       # Friends management page (850 lines)
│   ├── chat/
│   │   └── Chat.js           # Chat component (720 lines)
│   ├── utils/
│   │   └── ChatWebSocket.js  # WebSocket utility (150 lines)
│   └── App.js                # Routes configured
```

## 🔑 Key Technologies

| Technology | Purpose |
|------------|---------|
| Django 4.2 | Backend API |
| Django REST Framework | REST endpoints |
| Django Channels | WebSocket support |
| React 18 | Frontend UI |
| Axios | HTTP requests |
| React Router | Navigation |
| Redis | Channel layer |
| JWT (SimpleJWT) | Authentication |

## 🧪 Testing Scenarios

### Scenario 1: Send Friend Request
1. Login as User A
2. Go to Friends
3. Search "user_b"
4. Click "Add Friend"
5. Status changes to "Request Sent"

### Scenario 2: Accept Friend Request
1. Login as User B
2. Go to Friends → "Pending Requests" tab
3. See User A's request
4. Click "Accept"
5. Request moves to Friends list

### Scenario 3: Send Message
1. User A and B are friends
2. Both go to Chat page
3. User A selects User B from sidebar
4. User A types message and sends
5. Message appears immediately in both UIs
6. Message saved to database

### Scenario 4: WebSocket Reconnect
1. While chatting, disconnect internet
2. Attempt to send message
3. Status shows "🔴 Connecting..."
4. After 3 seconds, auto-reconnects
5. Status shows "🟢 Connected"
6. Message sends successfully

### Scenario 5: Multiple Chats
1. User A is friends with User B and User C
2. Open two Chat tabs
3. Select User B in first tab
4. Select User C in second tab
5. Send messages independently
6. Each chat maintains separate conversation

## 🛠️ Configuration Files

### Backend Configuration
- `backend/config/settings.py` - Django settings
- `backend/config/asgi.py` - WebSocket routing
- `backend/config/urls.py` - URL routing
- `backend/requirements.txt` - Python dependencies

### Frontend Configuration
- `frontend/package.json` - Node dependencies
- `frontend/src/api/client.js` - Axios setup
- `frontend/src/context/AuthContext.js` - Auth state

## 📝 API Quick Reference

### Friends Endpoints
```bash
# Search users
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:8000/api/friends/search/?q=john"

# Send friend request
curl -X POST -H "Authorization: Bearer TOKEN" \
  "http://localhost:8000/api/friends/request/5/"

# Accept request
curl -X POST -H "Authorization: Bearer TOKEN" \
  "http://localhost:8000/api/friends/request/1/accept/"

# List friends
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:8000/api/friends/list/"

# Get chat room
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:8000/api/friends/chat/5/"
```

### WebSocket Example
```javascript
// JavaScript
const ws = new WebSocket(
  `ws://localhost:8000/ws/chat/5/?token=${token}`
);

ws.send(JSON.stringify({ message: "Hello!" }));

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(data.message);
};
```

## 🐛 Troubleshooting

### Problem: WebSocket connection fails
**Solution**: 
- Check JWT token is valid
- Verify friend relationship exists
- Check Redis is running
- Check CORS settings

### Problem: Messages not appearing
**Solution**:
- Check browser console for errors
- Verify WebSocket connection status
- Check Django logs for backend errors
- Confirm friend relationship

### Problem: Search returns no results
**Solution**:
- Minimum 2 characters required
- Search is case-insensitive
- Excludes current user
- Check if users exist in database

### Problem: Friend request fails
**Solution**:
- Cannot send request to self
- Cannot send duplicate requests
- User must exist
- Check IsAuthenticated permission

## 📊 Database Schema

### FriendRequest
```
- id (PK)
- sender_id (FK to User)
- receiver_id (FK to User)
- status (PENDING, ACCEPTED, REJECTED)
- created_at (DateTime)
- updated_at (DateTime)
- unique_together: (sender_id, receiver_id)
```

### ChatRoom
```
- id (PK)
- user1_id (FK to User) - lower ID
- user2_id (FK to User) - higher ID
- created_at (DateTime)
- unique_together: (user1_id, user2_id)
```

### Message
```
- id (PK)
- sender_id (FK to User)
- recipient_id (FK to User)
- text (TextField)
- created_at (DateTime)
- is_read (Boolean)
- index: (sender_id, recipient_id, created_at)
```

## 🔐 Environment Variables

Create `.env` file in backend root:
```
SECRET_KEY=your-secret-key-here
DEBUG=True  # False in production
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=sqlite:///db.sqlite3
REDIS_URL=redis://localhost:6379
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

## 📱 Mobile Testing

### Desktop (1920x1080)
- Full sidebar on left
- Messages take center area
- All UI visible

### Tablet (768x1024)
- Sidebar reduced width
- Messages in center
- Touch-friendly buttons

### Mobile (375x667)
- Sidebar scrolls horizontally at top
- Messages take full width
- Compact UI elements
- Optimized spacing

## ⚡ Performance Tips

1. **Optimize Images**: Compress profile pictures
2. **Cache Messages**: Implement message caching
3. **Index Queries**: Database indexes on sender/recipient/created_at
4. **WebSocket Pool**: Use connection pooling
5. **Lazy Load**: Load messages on scroll
6. **Debounce Search**: Add search debouncing

## 📚 Additional Resources

- [Django Documentation](https://docs.djangoproject.com/)
- [Django Channels Guide](https://channels.readthedocs.io/)
- [React Hooks Guide](https://react.dev/reference/react)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [JWT Authentication](https://django-rest-framework-simplejwt.readthedocs.io/)

## ✅ Deployment Checklist

- [ ] Run migrations: `python manage.py migrate`
- [ ] Collect static files: `python manage.py collectstatic`
- [ ] Set DEBUG=False
- [ ] Configure allowed hosts
- [ ] Setup Redis in production
- [ ] Use WSS for secure WebSocket
- [ ] Setup HTTPS
- [ ] Configure CORS properly
- [ ] Setup environment variables
- [ ] Test all endpoints
- [ ] Monitor error logs
- [ ] Setup backup strategy
- [ ] Configure rate limiting

## 🎉 You're All Set!

The Friends & Chat system is ready to use! 

**Next Steps:**
1. Test all features locally
2. Review the detailed guide: `FRIENDS_CHAT_GUIDE.md`
3. Check implementation details: `IMPLEMENTATION_COMPLETE.md`
4. Deploy to production when ready
5. Monitor performance and user feedback

**Questions or Issues?**
- Check browser console for errors
- Review Django server logs
- See troubleshooting section above
- Review detailed documentation files

Happy chatting! 💬

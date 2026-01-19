# Quiz Platform

A comprehensive quiz web application built with Django REST Framework and React, featuring JWT authentication, real-time chat, friend management, and a rewards system.

## Features

- **User Authentication**: JWT-based authentication with login and registration
- **Quiz Management**: Create, take, and submit quizzes with multiple question types
- **Rewards System**: Earn points and badges for completing quizzes
- **Friend System**: Add friends, send friend requests, and view friend lists
- **Real-time Chat**: WebSocket-based chat functionality between users
- **Leaderboard**: Global leaderboard system tracking user points
- **Dark Mode**: Toggle between light and dark themes
- **User Profiles**: Customizable user profiles with profile pictures

## Quick Start

### Prerequisites
- Python 3.8+
- Node.js 14+
- pip and npm

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Apply database migrations:
```bash
python manage.py migrate
```

4. (Optional) Seed sample data:
```bash
python seed_questions.py
python seed_rewards.py
```

5. Start the Django development server:
```bash
python manage.py runserver
```

Backend runs on: `http://localhost:8000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install npm dependencies:
```bash
npm install
```

3. Start the React development server:
```bash
npm start
```

Frontend runs on: `http://localhost:3000`

### Running Both Servers

From the project root, you can run both servers in separate terminals:

**Terminal 1 - Backend:**
```bash
cd backend
python manage.py runserver
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

## Project Structure

```
.
├── backend/
│   ├── config/          # Django settings & ASGI config
│   ├── apps/
│   │   ├── accounts/    # User auth & profiles
│   │   ├── chat/        # Real-time messaging
│   │   ├── friends/     # Friend management
│   │   ├── quiz/        # Quiz logic
│   │   └── rewards/     # Points & badges
│   ├── manage.py
│   ├── requirements.txt
│   └── db.sqlite3
├── frontend/
│   ├── src/
│   │   ├── api/         # API client config
│   │   ├── auth/        # Auth components
│   │   ├── chat/        # Chat UI
│   │   ├── components/  # Reusable components
│   │   ├── context/     # React context
│   │   ├── dashboard/   # Main dashboard
│   │   ├── friends/     # Friend UI
│   │   ├── profile/     # Profile UI
│   │   ├── quiz/        # Quiz UI
│   │   ├── rewards/     # Rewards UI
│   │   ├── routes/      # Route protection
│   │   ├── App.js
│   │   └── index.js
│   ├── package.json
│   └── public/
├── .gitignore
└── README.md
```

## Technologies Used

### Backend
- **Django 4.2.7** - Web framework
- **Django REST Framework** - API development
- **Daphne** - ASGI server for WebSockets
- **Channels** - WebSocket support for real-time chat
- **SQLite** - Database (development)
- **JWT** - Authentication tokens

### Frontend
- **React 18** - UI library
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Context API** - State management
- **CSS3** - Styling with dark mode support

## Configuration

### Backend Environment Variables
Create a `backend/.env` file:
```
DEBUG=True
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=localhost,127.0.0.1
```

### Frontend Configuration
The frontend API client is configured in `src/api/client.js` to point to `http://localhost:8000/api/`

## API Overview

### Authentication Endpoints
- `POST /api/auth/register/` - User registration
- `POST /api/auth/login/` - User login
- `POST /api/auth/logout/` - User logout
- `GET /api/auth/profile/` - Get current user profile

### Quiz Endpoints
- `GET /api/quiz/quizzes/` - List all quizzes
- `POST /api/quiz/quizzes/{id}/start_quiz/` - Start a quiz
- `POST /api/quiz/quizzes/{id}/submit_quiz/` - Submit answers

### Friends Endpoints
- `POST /api/friends/request/{user_id}/` - Send friend request
- `GET /api/friends/requests/` - Get pending requests
- `POST /api/friends/accept/{friendship_id}/` - Accept request
- `GET /api/friends/list/` - Get friends list

### Rewards Endpoints
- `GET /api/rewards/leaderboard/` - Global leaderboard
- `GET /api/rewards/user/{id}/` - User rewards
- `GET /api/rewards/badges/` - Available badges

### Chat Endpoints
- `GET /api/chat/history/{user_id}/` - Chat history
- Real-time WebSocket support at `/ws/chat/{user_id}/`

## Development Notes

- The project uses JWT tokens for authentication
- WebSockets are used for real-time chat functionality
- Profile pictures are stored in `backend/media/profile_pics/`
- Database uses SQLite for development
- React Context API is used for global state management

## Troubleshooting

**Port Already in Use:**

Windows:
```bash
# Find and kill process on port 8000
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Find and kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

**Module Not Found Errors:**
```bash
# Reinstall dependencies
cd backend && pip install -r requirements.txt
cd frontend && npm install
```

**Database Issues:**
```bash
cd backend
python manage.py migrate
```

## Contributing

Contributions are welcome! Please feel free to submit pull requests.

## License

MIT License - See LICENSE file for details

## Support

For issues, questions, or feature requests, please create an issue in the repository.

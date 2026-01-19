# User Profile API Documentation

## Overview

The User Profile API provides endpoints for managing user profile information including personal details, biography, profile photo, and quiz statistics.

## Models

### UserProfile Model

```python
class UserProfile(models.Model):
    user = OneToOneField(User)           # Link to User model
    bio = TextField()                    # User biography
    profile_picture = ImageField()       # Profile photo
    total_points = IntegerField()        # Total points earned
    tests_attempted = IntegerField()     # Number of quizzes taken
    correct_answers = IntegerField()     # Total correct answers
    created_at = DateTimeField()         # Profile creation date
    updated_at = DateTimeField()         # Last update date
```

### Related User Model Fields

```python
class User(AbstractBaseUser):
    email = EmailField()          # Primary identifier
    first_name = CharField()      # User first name
    last_name = CharField()       # User last name
    is_active = BooleanField()    # Account active status
```

## API Endpoints

### 1. GET /accounts/profile/

**Authentication:** Required (JWT Bearer token)

Retrieve current authenticated user's complete profile with statistics.

**Request:**
```
GET /accounts/profile/
Authorization: Bearer <access_token>
```

**Response: 200 OK**
```json
{
    "id": 1,
    "username": "user@example.com",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "full_name": "John Doe",
    "bio": "I love quizzes!",
    "profile_picture": "https://example.com/media/profile_pics/user1.jpg",
    "total_points": 450,
    "tests_attempted": 12,
    "correct_answers": 85,
    "accuracy_percentage": 78.5
}
```

**Response Fields:**
- `id`: Profile ID
- `username`: User email (unique identifier)
- `email`: User email address
- `first_name`: User first name
- `last_name`: User last name
- `full_name`: Full name (first + last)
- `bio`: User biography (optional)
- `profile_picture`: URL to profile photo (optional)
- `total_points`: Total points from all quizzes
- `tests_attempted`: Number of quizzes taken
- `correct_answers`: Total correct answers
- `accuracy_percentage`: Calculated accuracy (correct_answers / total_questions * 100)

**Error Responses:**

**401 Unauthorized**
```json
{
    "detail": "Authentication credentials were not provided."
}
```

**403 Forbidden**
```json
{
    "detail": "You do not have permission to perform this action."
}
```

---

### 2. PUT /accounts/profile/

**Authentication:** Required (JWT Bearer token)

Update current user's profile information. Accepts multipart/form-data for file uploads.

**Request:**
```
PUT /accounts/profile/
Authorization: Bearer <access_token>
Content-Type: multipart/form-data

Fields:
- email (optional): New email address
- first_name (optional): First name
- last_name (optional): Last name
- bio (optional): Biography
- profile_picture (optional): Image file
```

**Example Request (curl):**
```bash
curl -X PUT http://localhost:8000/accounts/profile/ \
  -H "Authorization: Bearer <access_token>" \
  -F "first_name=Jane" \
  -F "last_name=Smith" \
  -F "bio=I love quizzes!" \
  -F "profile_picture=@/path/to/photo.jpg"
```

**Response: 200 OK**
```json
{
    "message": "Profile updated successfully",
    "profile": {
        "id": 1,
        "username": "user@example.com",
        "email": "user@example.com",
        "first_name": "Jane",
        "last_name": "Smith",
        "full_name": "Jane Smith",
        "bio": "I love quizzes!",
        "profile_picture": "https://example.com/media/profile_pics/user1_new.jpg",
        "total_points": 450,
        "tests_attempted": 12,
        "correct_answers": 85,
        "accuracy_percentage": 78.5
    }
}
```

**Partial Update:** You can update individual fields - only include the fields you want to change.

**Error Responses:**

**400 Bad Request (Invalid Email)**
```json
{
    "email": [
        "Email is already in use"
    ]
}
```

**400 Bad Request (Invalid Image)**
```json
{
    "profile_picture": [
        "The submitted data was not a file. Check the encoding type on the form."
    ]
}
```

**401 Unauthorized**
```json
{
    "detail": "Authentication credentials were not provided."
}
```

---

### 3. PATCH /accounts/profile/

**Authentication:** Required (JWT Bearer token)

Partial update (same as PUT but semantically for partial operations).

**Request:**
```
PATCH /accounts/profile/
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

---

## Integration with Quiz System

### Auto-update Profile Statistics

After quiz completion, update user profile statistics:

```python
# In QuizResult.save()
def save(self, *args, **kwargs):
    # ... existing logic ...
    super().save(*args, **kwargs)
    
    if self.is_completed:
        # Update user profile statistics
        profile = self.user.profile
        profile.tests_attempted += 1
        profile.total_points += self.earned_points
        profile.correct_answers += self.correct_answers
        profile.save()
```

### Frontend Integration

```javascript
// React - Fetch user profile
const fetchProfile = async () => {
    const response = await api.get('/accounts/profile/');
    return response.data;
};

// Update profile
const updateProfile = async (profileData) => {
    const formData = new FormData();
    formData.append('first_name', profileData.firstName);
    formData.append('last_name', profileData.lastName);
    formData.append('bio', profileData.bio);
    
    if (profileData.profilePicture) {
        formData.append('profile_picture', profileData.profilePicture);
    }
    
    const response = await api.put('/accounts/profile/', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};
```

## Database Schema

### accounts_userprofile

```sql
CREATE TABLE accounts_userprofile (
    id BIGINT PRIMARY KEY,
    user_id BIGINT UNIQUE NOT NULL,
    bio TEXT,
    profile_picture VARCHAR(100),
    total_points INT DEFAULT 0,
    tests_attempted INT DEFAULT 0,
    correct_answers INT DEFAULT 0,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES accounts_user(id)
);
```

## Authentication

All endpoints (except signup/login) require JWT authentication.

**Header Format:**
```
Authorization: Bearer <access_token>
```

**Obtaining Token:**
```bash
# Register
POST /accounts/signup/
{
    "email": "user@example.com",
    "password": "securepass123",
    "first_name": "John",
    "last_name": "Doe"
}

# Login
POST /accounts/login/
{
    "email": "user@example.com",
    "password": "securepass123"
}

# Response includes:
{
    "access": "<access_token>",
    "refresh": "<refresh_token>"
}
```

## File Upload

Profile pictures are stored in `media/profile_pics/` directory.

**Supported formats:**
- JPEG/JPG
- PNG
- GIF
- WebP

**Size limits:**
- Maximum: 5MB (configurable in settings)

**URL Format:**
```
https://example.com/media/profile_pics/<filename>
```

## Error Handling

All errors return appropriate HTTP status codes:

| Status | Meaning |
|--------|---------|
| 200 | Successful GET/PUT/PATCH |
| 201 | Successful POST (creation) |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 500 | Server Error |

## Rate Limiting

No rate limiting currently implemented. Consider adding for production:

```python
# settings.py
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour'
    }
}
```

## Security Considerations

1. **Email Uniqueness**: Email is validated as unique before update
2. **File Upload**: Only image files allowed for profile_picture
3. **Authentication**: JWT tokens expire after 24 hours (configurable)
4. **HTTPS**: Always use HTTPS in production
5. **CORS**: Configure CORS headers properly

## Setup Instructions

### 1. Apply Migrations

```bash
python manage.py migrate accounts
```

### 2. Test Endpoints

```bash
# Register
curl -X POST http://localhost:8000/accounts/signup/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpass123",
    "first_name": "Test",
    "last_name": "User"
  }'

# Get Profile
curl -X GET http://localhost:8000/accounts/profile/ \
  -H "Authorization: Bearer <access_token>"

# Update Profile
curl -X PUT http://localhost:8000/accounts/profile/ \
  -H "Authorization: Bearer <access_token>" \
  -F "bio=Updated bio" \
  -F "profile_picture=@photo.jpg"
```

## Notes

- User profile is automatically created when a user registers
- All statistics fields can be updated by the quiz system
- Profile photo is optional
- Email updates must be unique across the system
- Accuracy percentage is calculated as: (correct_answers / total_questions) * 100

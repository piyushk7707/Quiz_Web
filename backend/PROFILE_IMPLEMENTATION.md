# User Profile API Implementation Summary

## Files Created/Updated

### 1. **models.py** - Updated UserProfile Model

**Changes:**
- Added `tests_attempted` field (IntegerField) - tracks number of quizzes taken
- Added `correct_answers` field (IntegerField) - tracks total correct answers
- Added `accuracy_percentage` property - calculates accuracy dynamically
- Enhanced field help_text and documentation
- Added `_get_total_questions()` helper method to fetch from QuizResult

**Key Features:**
- Automatic accuracy calculation: (correct_answers / total_questions) * 100
- Integration with quiz system via import
- Timezone-aware timestamps

### 2. **serializers.py** - New Comprehensive Serializers

**ProfileDetailSerializer** (for GET requests)
- Displays complete user profile with statistics
- Read-only fields: id, username, email, accuracy_percentage
- Nested user data (first_name, last_name, full_name)
- Includes quiz statistics: total_points, tests_attempted, correct_answers

**ProfileUpdateSerializer** (for PUT requests)
- Allows updating email, name, bio, and profile photo
- Handles multipart/form-data for file uploads
- Validates email uniqueness (excluding current user)
- Nested update logic for related User model

**Validation:**
- Email uniqueness check
- Partial update support
- File type validation for images

### 3. **views.py** - Enhanced UserProfileView

**UserProfileView Class**
- `GET /accounts/profile/` - Retrieve profile with stats
- `PUT /accounts/profile/` - Update profile (multipart support)
- `PATCH /accounts/profile/` - Partial update alias
- Auto-creates profile if missing
- JWT authentication required
- Comprehensive error handling

**Response Format:**
```json
{
    "id": 1,
    "username": "user@email.com",
    "email": "user@email.com",
    "first_name": "John",
    "last_name": "Doe",
    "full_name": "John Doe",
    "bio": "User bio",
    "profile_picture": "url/to/image.jpg",
    "total_points": 450,
    "tests_attempted": 12,
    "correct_answers": 85,
    "accuracy_percentage": 78.5
}
```

### 4. **urls.py** - Already Configured

No changes needed - endpoint already exists:
```python
path('profile/', UserProfileView.as_view(), name='user-profile')
```

Handles:
- GET /accounts/profile/
- PUT /accounts/profile/
- PATCH /accounts/profile/

### 5. **migrations/0002_userprofile_extended_fields.py** - Database Migration

Creates migration for:
- `tests_attempted` field
- `correct_answers` field
- Updated field help_text

---

## API Endpoints

### GET /accounts/profile/
**Authentication:** Required (JWT)
- Returns user's complete profile with quiz statistics
- Auto-creates profile if doesn't exist
- Includes calculated accuracy percentage

### PUT /accounts/profile/
**Authentication:** Required (JWT)
- Updates user profile fields
- Accepts multipart/form-data for file uploads
- Validates email uniqueness
- Returns updated profile

### PATCH /accounts/profile/
**Authentication:** Required (JWT)
- Alias for PUT (partial update)
- Same functionality as PUT

---

## Setup Instructions

### 1. Apply Migration
```bash
cd backend
python manage.py migrate accounts
```

### 2. Test Endpoints

**Get Profile:**
```bash
curl -X GET http://localhost:8000/accounts/profile/ \
  -H "Authorization: Bearer <token>"
```

**Update Profile:**
```bash
curl -X PUT http://localhost:8000/accounts/profile/ \
  -H "Authorization: Bearer <token>" \
  -F "bio=My new bio" \
  -F "profile_picture=@photo.jpg"
```

---

## Features

✅ **Complete User Profile Management**
- View comprehensive profile with statistics
- Update personal information
- Upload profile photo (multipart/form-data)

✅ **Quiz Statistics Integration**
- Total points earned
- Number of tests attempted
- Correct answers count
- Calculated accuracy percentage

✅ **Security**
- JWT authentication required
- Email uniqueness validation
- File upload validation

✅ **Production Ready**
- Error handling
- Partial updates support
- Auto-profile creation
- PostgreSQL compatible
- Comprehensive documentation

✅ **Frontend Compatible**
- Returns expected data format
- Multipart/form-data support
- Partial update support (PATCH/PUT)
- Proper HTTP status codes

---

## Database Schema

```sql
accounts_userprofile:
├── id (BigInt PK)
├── user_id (BigInt FK, OneToOne)
├── bio (TextField, nullable)
├── profile_picture (ImageField, nullable)
├── total_points (Int, default=0)
├── tests_attempted (Int, default=0)
├── correct_answers (Int, default=0)
├── created_at (DateTime)
└── updated_at (DateTime)
```

---

## Integration with Quiz System

To auto-update profile statistics after quiz completion:

```python
# In apps/quiz/models.py - QuizResult.save()
def save(self, *args, **kwargs):
    # ... existing logic ...
    super().save(*args, **kwargs)
    
    if self.is_completed:
        profile = self.user.profile
        profile.tests_attempted += 1
        profile.total_points += self.earned_points
        profile.correct_answers += self.correct_answers
        profile.save()
```

---

## Files Modified

1. `backend/apps/accounts/models.py` - UserProfile model enhanced
2. `backend/apps/accounts/serializers.py` - New serializers added
3. `backend/apps/accounts/views.py` - UserProfileView enhanced
4. `backend/apps/accounts/urls.py` - No changes (already configured)
5. `backend/apps/accounts/migrations/0002_userprofile_extended_fields.py` - New migration

---

## Testing Checklist

- [ ] Run migration: `python manage.py migrate accounts`
- [ ] Create user via `/accounts/signup/`
- [ ] Get JWT token via `/accounts/login/`
- [ ] Test GET `/accounts/profile/` - returns profile
- [ ] Test PUT `/accounts/profile/` with text fields
- [ ] Test PUT `/accounts/profile/` with image file
- [ ] Test PATCH `/accounts/profile/` - partial update
- [ ] Verify accuracy_percentage calculation
- [ ] Test email uniqueness validation
- [ ] Test without authentication - should return 401

---

## Documentation

Full API documentation available in: `backend/PROFILE_API.md`

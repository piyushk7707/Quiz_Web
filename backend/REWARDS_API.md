# Rewards API Implementation

## Overview

The Rewards API provides a point-based achievement system for the quiz platform. Users automatically unlock reward tiers as they accumulate points from quiz completion.

## Models

### Reward Model
```python
class Reward(models.Model):
    name = CharField(choices=['bronze', 'silver', 'gold', 'platinum', 'diamond'])
    min_points = PositiveIntegerField()  # Minimum points to unlock
    description = TextField()
    created_at = DateTimeField(auto_now_add=True)
    updated_at = DateTimeField(auto_now=True)
```

**Reward Tiers:**
- **Bronze** (0+ points): Starting tier
- **Silver** (100+ points): Making progress
- **Gold** (250+ points): Quiz master level
- **Platinum** (500+ points): Elite performance
- **Diamond** (1000+ points): Champion status

### UserReward Model
```python
class UserReward(models.Model):
    user = ForeignKey(User)  # User who earned the reward
    reward = ForeignKey(Reward)  # The reward earned
    earned_at = DateTimeField(auto_now_add=True)  # When earned
    
    class Meta:
        unique_together = ('user', 'reward')
```

Tracks when users unlock each reward tier (one per tier per user).

## API Endpoints

### 1. GET /rewards/
**Authentication:** Required (JWT)

List all available reward tiers.

**Response:**
```json
[
    {
        "id": 1,
        "name": "bronze",
        "name_display": "Bronze",
        "min_points": 0,
        "description": "Welcome to the quiz platform..."
    },
    {
        "id": 2,
        "name": "silver",
        "name_display": "Silver",
        "min_points": 100,
        "description": "Silver tier achieved..."
    }
]
```

### 2. GET /rewards/{id}/
**Authentication:** Required (JWT)

Retrieve a specific reward tier.

**Response:**
```json
{
    "id": 1,
    "name": "bronze",
    "name_display": "Bronze",
    "min_points": 0,
    "description": "Welcome to the quiz platform..."
}
```

### 3. GET /rewards/user-rewards/
**Authentication:** Required (JWT)

Retrieve user's reward progress, current tier, and earned/locked rewards.

**Response:**
```json
{
    "total_points": 450,
    "current_tier": "Silver",
    "next_tier": "Gold",
    "progress_percent": 80,
    "earned_rewards": [
        {
            "id": 1,
            "reward_name": "Bronze",
            "reward_details": {
                "id": 1,
                "name": "bronze",
                "name_display": "Bronze",
                "min_points": 0,
                "description": "..."
            },
            "earned_at": "2026-01-15T10:30:00Z"
        }
    ],
    "locked_rewards": [
        {
            "id": 3,
            "name": "gold",
            "name_display": "Gold",
            "min_points": 250,
            "description": "..."
        }
    ]
}
```

**Response Fields:**
- `total_points`: Total points earned across all quizzes
- `current_tier`: User's current reward tier (or null if none)
- `next_tier`: Next reward to unlock (or null if all unlocked)
- `progress_percent`: Progress toward next tier (0-100)
- `earned_rewards`: List of unlocked rewards with dates
- `locked_rewards`: List of rewards not yet earned

### 4. POST /rewards/check-and-award/
**Authentication:** Required (JWT)

Check if user qualifies for new rewards and award them.

Called automatically after quiz completion or manually to sync rewards.

**Response:**
```json
{
    "newly_awarded": [
        {
            "id": 2,
            "name": "silver",
            "name_display": "Silver",
            "min_points": 100,
            "description": "..."
        }
    ],
    "all_earned": [
        {
            "id": 1,
            "reward_name": "Bronze",
            "reward_details": {...},
            "earned_at": "2026-01-15T10:30:00Z"
        },
        {
            "id": 2,
            "reward_name": "Silver",
            "reward_details": {...},
            "earned_at": "2026-01-18T15:45:00Z"
        }
    ],
    "total_points": 250
}
```

## Setup Instructions

### 1. Apply Migrations
```bash
python manage.py migrate rewards
```

### 2. Seed Reward Tiers
```bash
# Option 1: Run the seed script
python seed_rewards.py

# Option 2: Use Django shell
python manage.py shell
>>> exec(open('seed_rewards.py').read())
```

### 3. Initialize User Rewards (Optional)
```bash
python manage.py shell
>>> from apps.rewards.views import RewardViewSet
>>> from apps.accounts.models import User
>>> for user in User.objects.all():
...     RewardViewSet.check_and_award(user)
```

## Integration with Quiz

### Automatic Reward Award
Add to `QuizResult.save()` in `apps/quiz/models.py`:

```python
def save(self, *args, **kwargs):
    # ... existing save logic ...
    super().save(*args, **kwargs)
    
    # Award rewards after quiz completion
    if self.is_completed:
        from apps.rewards.models import Reward, UserReward
        from django.db.models import Sum
        
        total_points = QuizResult.objects.filter(
            user=self.user,
            is_completed=True
        ).aggregate(Sum('earned_points'))['earned_points__sum'] or 0
        
        # Automatically award eligible rewards
        eligible = Reward.objects.filter(min_points__lte=total_points)
        for reward in eligible:
            UserReward.objects.get_or_create(user=self.user, reward=reward)
```

Or call the endpoint after quiz completion:

```javascript
// React frontend
async function completeQuiz(testId) {
    const result = await api.post(`/quiz/results/`, {...});
    
    // Check and award rewards
    await api.post('/rewards/check-and-award/');
    
    return result;
}
```

## Database Schema

### rewards_reward
```sql
CREATE TABLE rewards_reward (
    id BIGINT PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    min_points INT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    INDEX (name),
    INDEX (min_points)
);
```

### rewards_user_reward
```sql
CREATE TABLE rewards_user_reward (
    id BIGINT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    reward_id BIGINT NOT NULL,
    earned_at TIMESTAMP NOT NULL,
    UNIQUE (user_id, reward_id),
    INDEX (user_id, earned_at DESC),
    FOREIGN KEY (user_id) REFERENCES accounts_user(id),
    FOREIGN KEY (reward_id) REFERENCES rewards_reward(id)
);
```

## Admin Interface

Access reward management at `/admin/rewards/`:

- **Rewards**: Create, edit, delete reward tiers
- **User Rewards**: View when each user earned each reward

## Performance Considerations

- `UserReward` queries are indexed on `(user, -earned_at)` for fast retrieval
- Reward tiers are cached (small dataset, 5 entries max)
- Total points calculation uses database aggregation
- N+1 queries avoided with `select_related()` in views

## Error Handling

All endpoints return proper HTTP status codes:
- `200 OK`: Successful request
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

## Future Enhancements

- Reward badges with images
- Leaderboard integration
- Streak tracking
- Milestone notifications
- Social sharing of achievements

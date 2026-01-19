from django.db import models
from django.conf import settings
from django.db.models import Sum

# ============================================================================
# REWARD MODEL - Point-based achievement tiers
# ============================================================================
class Reward(models.Model):
    """
    Reward tiers based on accumulated points.
    Users automatically unlock rewards as they cross point thresholds.
    """
    TIER_CHOICES = [
        ('bronze', 'Bronze'),
        ('silver', 'Silver'),
        ('gold', 'Gold'),
        ('platinum', 'Platinum'),
        ('diamond', 'Diamond'),
    ]
    
    name = models.CharField(
        max_length=50,
        choices=TIER_CHOICES,
        unique=True,
        db_index=True
    )
    min_points = models.PositiveIntegerField(
        db_index=True,
        help_text='Minimum points required to unlock this reward'
    )
    description = models.TextField(
        help_text='Description of the reward tier'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'rewards_reward'
        ordering = ['min_points']
    
    def __str__(self):
        return f"{self.get_name_display()} ({self.min_points}+ points)"


# ============================================================================
# USER REWARD MODEL - Track when users unlock rewards
# ============================================================================
class UserReward(models.Model):
    """
    Tracks when a user unlocks a specific reward tier.
    Multiple rewards per user (one for each tier unlocked).
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='earned_rewards'
    )
    reward = models.ForeignKey(
        Reward,
        on_delete=models.CASCADE,
        related_name='users'
    )
    earned_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'rewards_user_reward'
        unique_together = ('user', 'reward')
        ordering = ['-earned_at']
        indexes = [
            models.Index(fields=['user', '-earned_at']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.reward.get_name_display()}"


# ============================================================================
# BADGE MODEL - Legacy badges (kept for compatibility)
# ============================================================================
class Badge(models.Model):
    """Legacy badge model - kept for backward compatibility"""
    name = models.CharField(max_length=100)
    description = models.TextField()
    icon = models.ImageField(upload_to='badges/')
    criteria = models.CharField(max_length=255)

    def __str__(self):
        return self.name


class UserBadge(models.Model):
    """Legacy user badge model - kept for backward compatibility"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='badges')
    badge = models.ForeignKey(Badge, on_delete=models.CASCADE)
    earned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'badge')

    def __str__(self):
        return f'{self.user.username} - {self.badge.name}'


class LeaderboardEntry(models.Model):
    """Legacy leaderboard model - kept for backward compatibility"""
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    total_points = models.IntegerField(default=0)
    rank = models.IntegerField()
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'{self.user.username} - Rank {self.rank}'

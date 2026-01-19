from rest_framework import serializers
from django.db.models import Sum
from .models import Reward, UserReward, Badge, UserBadge, LeaderboardEntry


class RewardSerializer(serializers.ModelSerializer):
    """Serializer for Reward model"""
    name_display = serializers.CharField(source='get_name_display', read_only=True)
    
    class Meta:
        model = Reward
        fields = ['id', 'name', 'name_display', 'min_points', 'description']


class UserRewardSerializer(serializers.ModelSerializer):
    """Serializer for UserReward model with reward details"""
    reward_name = serializers.CharField(source='reward.get_name_display', read_only=True)
    reward_details = RewardSerializer(source='reward', read_only=True)
    
    class Meta:
        model = UserReward
        fields = ['id', 'reward_name', 'reward_details', 'earned_at']


class UserRewardsResponseSerializer(serializers.Serializer):
    """
    Custom serializer for /rewards/user-rewards/ endpoint response.
    Provides comprehensive rewards data for the frontend.
    
    Response format:
    {
        "total_points": 450,
        "current_tier": "Silver",
        "next_tier": "Gold",
        "progress_percent": 80,
        "earned_rewards": [
            {
                "id": 1,
                "reward_name": "Bronze",
                "reward_details": {...},
                "earned_at": "2026-01-15T10:30:00Z"
            }
        ],
        "locked_rewards": [
            {
                "id": 3,
                "name": "gold",
                "name_display": "Gold",
                "min_points": 500,
                "description": "..."
            }
        ]
    }
    """
    total_points = serializers.IntegerField()
    current_tier = serializers.CharField(allow_null=True)
    next_tier = serializers.CharField(allow_null=True)
    progress_percent = serializers.IntegerField()
    earned_rewards = UserRewardSerializer(many=True, read_only=True)
    locked_rewards = serializers.SerializerMethodField()
    
    def get_locked_rewards(self, obj):
        """Return rewards not yet earned"""
        locked = obj.get('locked_rewards', [])
        return RewardSerializer(locked, many=True).data


# ============================================================================
# LEGACY SERIALIZERS - Kept for backward compatibility
# ============================================================================
class BadgeSerializer(serializers.ModelSerializer):
    """Legacy badge serializer"""
    class Meta:
        model = Badge
        fields = ('id', 'name', 'description', 'icon')


class UserBadgeSerializer(serializers.ModelSerializer):
    """Legacy user badge serializer"""
    badge = BadgeSerializer()

    class Meta:
        model = UserBadge
        fields = ('id', 'badge', 'earned_at')


class LeaderboardSerializer(serializers.ModelSerializer):
    """Legacy leaderboard serializer"""
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = LeaderboardEntry
        fields = ('id', 'username', 'total_points', 'rank', 'updated_at')

    class Meta:
        model = UserBadge
        fields = ('id', 'badge', 'earned_at')

class LeaderboardSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = LeaderboardEntry
        fields = ('rank', 'username', 'total_points')

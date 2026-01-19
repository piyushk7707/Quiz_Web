from django.contrib import admin
from .models import (
    Reward, UserReward, Badge, UserBadge, LeaderboardEntry
)


@admin.register(Reward)
class RewardAdmin(admin.ModelAdmin):
    """Admin for Reward model"""
    list_display = ('name', 'min_points', 'description_short')
    search_fields = ('name', 'description')
    list_filter = ('created_at', 'updated_at')
    readonly_fields = ('created_at', 'updated_at')
    
    def description_short(self, obj):
        return obj.description[:50] + '...' if len(obj.description) > 50 else obj.description
    description_short.short_description = 'Description'


@admin.register(UserReward)
class UserRewardAdmin(admin.ModelAdmin):
    """Admin for UserReward model"""
    list_display = ('user', 'reward_name', 'earned_at')
    search_fields = ('user__username', 'reward__name')
    list_filter = ('reward__name', 'earned_at')
    readonly_fields = ('earned_at',)
    
    def reward_name(self, obj):
        return obj.reward.get_name_display()
    reward_name.short_description = 'Reward'


# ============================================================================
# LEGACY ADMIN - Kept for backward compatibility
# ============================================================================
@admin.register(Badge)
class BadgeAdmin(admin.ModelAdmin):
    list_display = ('name', 'criteria')
    search_fields = ('name',)


@admin.register(UserBadge)
class UserBadgeAdmin(admin.ModelAdmin):
    list_display = ('user', 'badge', 'earned_at')
    search_fields = ('user__username', 'badge__name')


@admin.register(LeaderboardEntry)
class LeaderboardAdmin(admin.ModelAdmin):
    list_display = ('user', 'rank', 'total_points')
    search_fields = ('user__username',)
    list_filter = ('rank',)

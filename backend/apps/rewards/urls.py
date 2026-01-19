from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RewardViewSet, LeaderboardView, UserBadgesView

# DRF Router for RewardViewSet
router = DefaultRouter()
router.register(r'', RewardViewSet, basename='reward')

urlpatterns = [
    # Rewards ViewSet endpoints
    path('', include(router.urls)),
    
    # Legacy endpoints (kept for backward compatibility)
    path('leaderboard/', LeaderboardView.as_view(), name='leaderboard'),
    path('user/<int:user_id>/badges/', UserBadgesView.as_view(), name='user-badges'),
]

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from django.db.models import Sum
from .models import Reward, UserReward, LeaderboardEntry, UserBadge
from .serializers import (
    RewardSerializer,
    UserRewardSerializer,
    UserRewardsResponseSerializer,
    LeaderboardSerializer,
    UserBadgeSerializer
)


class RewardViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Reward management.
    Provides endpoints for retrieving user rewards and checking progress.
    
    Endpoints:
    - GET /rewards/ - List all rewards
    - GET /rewards/{id}/ - Retrieve specific reward
    - GET /rewards/user-rewards/ - Get user's reward progress
    - POST /rewards/check-and-award/ - Award unlocked rewards
    """
    queryset = Reward.objects.all().order_by('min_points')
    serializer_class = RewardSerializer
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'user_rewards':
            return UserRewardsResponseSerializer
        return RewardSerializer
    
    @action(detail=False, methods=['get'], url_path='user-rewards')
    def user_rewards(self, request):
        """
        GET /rewards/user-rewards/
        
        Returns comprehensive user rewards data including:
        - Total points earned across all quizzes
        - Current reward tier
        - Next reward tier to unlock
        - Progress toward next tier (%)
        - List of earned rewards with dates
        - List of locked rewards with requirements
        """
        user = request.user
        
        # Calculate total points earned
        total_points = self._get_user_total_points(user)
        
        # Get all rewards ordered by min_points
        all_rewards = Reward.objects.all().order_by('min_points')
        
        # Determine current and next tier
        current_tier_obj = None
        next_tier_obj = None
        
        for reward in all_rewards:
            if total_points >= reward.min_points:
                current_tier_obj = reward
            elif next_tier_obj is None:
                next_tier_obj = reward
                break
        
        # Get earned rewards
        earned_rewards = user.earned_rewards.all().select_related('reward').order_by('-earned_at')
        
        # Get locked rewards (not yet earned)
        earned_reward_ids = set(earned_rewards.values_list('reward_id', flat=True))
        locked_rewards = all_rewards.exclude(id__in=earned_reward_ids)
        
        # Calculate progress to next tier
        progress_percent = 0
        if next_tier_obj:
            if current_tier_obj:
                current_threshold = current_tier_obj.min_points
                next_threshold = next_tier_obj.min_points
                progress = total_points - current_threshold
                progress_range = next_threshold - current_threshold
                progress_percent = int((progress / progress_range) * 100) if progress_range > 0 else 0
            else:
                # No current tier, progress toward first tier
                progress_percent = int((total_points / next_tier_obj.min_points) * 100)
        else:
            # All tiers unlocked
            progress_percent = 100
        
        # Build response
        response_data = {
            'total_points': total_points,
            'current_tier': current_tier_obj.get_name_display() if current_tier_obj else None,
            'next_tier': next_tier_obj.get_name_display() if next_tier_obj else None,
            'progress_percent': progress_percent,
            'earned_rewards': earned_rewards,
            'locked_rewards': locked_rewards,
        }
        
        serializer = UserRewardsResponseSerializer(response_data)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @staticmethod
    def _get_user_total_points(user):
        """
        Calculate total points earned by user across all completed quizzes.
        Queries the quiz app's QuizResult model.
        """
        try:
            from apps.quiz.models import QuizResult
            total = QuizResult.objects.filter(
                user=user,
                is_completed=True
            ).aggregate(Sum('earned_points'))['earned_points__sum'] or 0
            return total
        except (ImportError, Exception):
            return 0
    
    @action(detail=False, methods=['post'], url_path='check-and-award')
    def check_and_award(self, request):
        """
        POST /rewards/check-and-award/
        
        Check if user has unlocked any new rewards and award them.
        Called after quiz completion or manually to sync rewards.
        
        Returns:
        - newly_awarded: List of newly unlocked rewards
        - all_earned: List of all earned rewards
        - total_points: User's total points
        """
        user = request.user
        
        # Get total points
        total_points = self._get_user_total_points(user)
        
        # Get all eligible rewards
        eligible_rewards = Reward.objects.filter(min_points__lte=total_points)
        
        # Find newly awarded rewards
        newly_awarded = []
        for reward in eligible_rewards:
            user_reward, created = UserReward.objects.get_or_create(
                user=user,
                reward=reward
            )
            if created:
                newly_awarded.append(reward)
        
        # Get all earned rewards
        earned_rewards = user.earned_rewards.all().select_related('reward').order_by('-earned_at')
        
        response_data = {
            'newly_awarded': RewardSerializer(newly_awarded, many=True).data,
            'all_earned': UserRewardSerializer(earned_rewards, many=True).data,
            'total_points': total_points,
        }
        
        return Response(response_data, status=status.HTTP_200_OK)


# ============================================================================
# LEGACY VIEWS - Kept for backward compatibility
# ============================================================================
class LeaderboardView(APIView):
    """Legacy leaderboard view"""
    def get(self, request):
        leaderboard = LeaderboardEntry.objects.all().order_by('rank')[:100]
        serializer = LeaderboardSerializer(leaderboard, many=True)
        return Response(serializer.data)


class UserBadgesView(APIView):
    """Legacy user badges view"""
    def get(self, request, user_id):
        badges = UserBadge.objects.filter(user_id=user_id)
        serializer = UserBadgeSerializer(badges, many=True)
        return Response(serializer.data)

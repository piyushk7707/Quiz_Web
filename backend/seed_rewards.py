"""
Django ORM Script to Seed Rewards Database

Creates reward tiers: Bronze, Silver, Gold, Platinum, Diamond

Usage:
    python manage.py shell
    >>> exec(open('seed_rewards.py').read())

Or run directly:
    python seed_rewards.py
"""

import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.rewards.models import Reward


# ============================================================================
# REWARD TIER DATA
# ============================================================================
REWARDS_DATA = [
    {
        'name': 'bronze',
        'min_points': 0,
        'description': 'Welcome to the quiz platform! You\'ve started your journey. Keep taking quizzes to unlock higher tiers.',
    },
    {
        'name': 'silver',
        'min_points': 100,
        'description': 'Silver tier achieved! You\'ve earned 100+ points. You\'re making great progress.',
    },
    {
        'name': 'gold',
        'min_points': 250,
        'description': 'Gold tier unlocked! You\'ve reached 250+ points. You\'re becoming a quiz master.',
    },
    {
        'name': 'platinum',
        'min_points': 500,
        'description': 'Platinum tier reached! With 500+ points, you\'re among the elite. Exceptional performance!',
    },
    {
        'name': 'diamond',
        'min_points': 1000,
        'description': 'Diamond tier! The highest honor. You\'ve achieved 1000+ points. You are a true quiz champion!',
    },
]


# ============================================================================
# SEEDING FUNCTION
# ============================================================================
def seed_rewards():
    """Create reward tiers in the database"""
    print("Starting reward tier seeding...\n")
    
    created_count = 0
    updated_count = 0
    
    for reward_data in REWARDS_DATA:
        reward, created = Reward.objects.update_or_create(
            name=reward_data['name'],
            defaults={
                'min_points': reward_data['min_points'],
                'description': reward_data['description'],
            }
        )
        
        if created:
            created_count += 1
            print(f"[CREATE] {reward.get_name_display()} tier - {reward.min_points}+ points")
        else:
            updated_count += 1
            print(f"[UPDATE] {reward.get_name_display()} tier - {reward.min_points}+ points")
    
    print(f"\n[SUCCESS] Reward seeding complete!")
    print(f"   - Created: {created_count}")
    print(f"   - Updated: {updated_count}")
    print(f"   - Total: {Reward.objects.count()} reward tiers")


# ============================================================================
# MAIN EXECUTION
# ============================================================================
if __name__ == '__main__':
    if Reward.objects.exists():
        print("Reward tiers already exist.")
        response = input("Do you want to reseed? (yes/no): ")
        if response.lower() == 'yes':
            Reward.objects.all().delete()
            print("Deleted existing rewards.\n")
            seed_rewards()
        else:
            print("Skipped seeding.")
    else:
        seed_rewards()

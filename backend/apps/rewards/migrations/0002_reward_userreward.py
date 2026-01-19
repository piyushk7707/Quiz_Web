# Generated migration for Reward and UserReward models

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('rewards', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Reward',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(choices=[('bronze', 'Bronze'), ('silver', 'Silver'), ('gold', 'Gold'), ('platinum', 'Platinum'), ('diamond', 'Diamond')], db_index=True, max_length=50, unique=True)),
                ('min_points', models.PositiveIntegerField(db_index=True, help_text='Minimum points required to unlock this reward')),
                ('description', models.TextField(help_text='Description of the reward tier')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'rewards_reward',
                'ordering': ['min_points'],
            },
        ),
        migrations.CreateModel(
            name='UserReward',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('earned_at', models.DateTimeField(auto_now_add=True)),
                ('reward', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='users', to='rewards.reward')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='earned_rewards', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'rewards_user_reward',
                'ordering': ['-earned_at'],
            },
        ),
        migrations.AddConstraint(
            model_name='userreward',
            constraint=models.UniqueConstraint(fields=('user', 'reward'), name='unique_user_reward'),
        ),
        migrations.AddIndex(
            model_name='userreward',
            index=models.Index(fields=['user', '-earned_at'], name='rewards_use_user_id_earned_idx'),
        ),
    ]

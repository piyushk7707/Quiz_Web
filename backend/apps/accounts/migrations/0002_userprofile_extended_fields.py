# Generated migration for UserProfile model updates

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='tests_attempted',
            field=models.IntegerField(default=0, help_text='Number of quizzes taken'),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='correct_answers',
            field=models.IntegerField(default=0, help_text='Total number of correct answers'),
        ),
        migrations.AlterField(
            model_name='userprofile',
            name='bio',
            field=models.TextField(blank=True, null=True, help_text='User biography'),
        ),
        migrations.AlterField(
            model_name='userprofile',
            name='profile_picture',
            field=models.ImageField(blank=True, null=True, upload_to='profile_pics/', help_text='User profile photo'),
        ),
        migrations.AlterField(
            model_name='userprofile',
            name='total_points',
            field=models.IntegerField(default=0, help_text='Total points earned across all quizzes'),
        ),
    ]

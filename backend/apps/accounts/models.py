from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.utils import timezone


class UserManager(BaseUserManager):
    """Custom user manager for email-based authentication"""
    
    def create_user(self, email, password=None, **extra_fields):
        """Create and save a regular user"""
        if not email:
            raise ValueError('Email field is required')
        
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user


class User(AbstractBaseUser):
    """Custom User model with email as the primary login field"""
    email = models.EmailField(unique=True, max_length=255)
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    objects = UserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []
    
    class Meta:
        db_table = 'accounts_user'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.email
    
    def get_full_name(self):
        """Return user's full name"""
        return f'{self.first_name} {self.last_name}'.strip()
    
    def get_short_name(self):
        """Return user's first name"""
        return self.first_name


class UserProfile(models.Model):
    """Extended user profile information with quiz statistics"""
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='profile'
    )
    bio = models.TextField(
        blank=True,
        null=True,
        help_text='User biography'
    )
    profile_picture = models.ImageField(
        upload_to='profile_pics/',
        blank=True,
        null=True,
        help_text='User profile photo'
    )
    total_points = models.IntegerField(
        default=0,
        help_text='Total points earned across all quizzes'
    )
    tests_attempted = models.IntegerField(
        default=0,
        help_text='Number of quizzes taken'
    )
    correct_answers = models.IntegerField(
        default=0,
        help_text='Total number of correct answers'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'{self.user.email} Profile'
    
    class Meta:
        db_table = 'accounts_userprofile'
        ordering = ['-created_at']
    
    @property
    def accuracy_percentage(self):
        """Calculate accuracy percentage from quiz statistics"""
        if self.correct_answers == 0:
            return 0
        total_questions = self._get_total_questions()
        if total_questions == 0:
            return 0
        return round((self.correct_answers / total_questions) * 100, 2)
    
    def _get_total_questions(self):
        """Get total number of questions attempted"""
        try:
            from apps.quiz.models import QuizResult
            total = QuizResult.objects.filter(
                user=self.user,
                is_completed=True
            ).aggregate(
                models.Sum('total_questions')
            )['total_questions__sum'] or 0
            return total
        except (ImportError, Exception):
            return 0

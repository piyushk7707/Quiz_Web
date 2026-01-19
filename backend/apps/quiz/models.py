from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from apps.accounts.models import User

# ============================================================================
# QUESTION MODEL - Core question entity with difficulty levels
# ============================================================================
class Question(models.Model):
    """Question model for quiz engine"""
    
    DIFFICULTY_CHOICES = [
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard'),
    ]
    
    text = models.TextField(
        help_text='Question text/prompt'
    )
    difficulty = models.CharField(
        max_length=10,
        choices=DIFFICULTY_CHOICES,
        default='medium',
        db_index=True
    )
    explanation = models.TextField(
        blank=True,
        null=True,
        help_text='Optional explanation of the correct answer'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'quiz_question'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['difficulty']),
        ]
    
    def __str__(self):
        return f"[{self.get_difficulty_display()}] {self.text[:50]}"


# ============================================================================
# QUESTION OPTION MODEL - 4 options per question (exactly one correct)
# ============================================================================
class QuestionOption(models.Model):
    """Options/answers for a question - exactly 4 per question"""
    
    question = models.ForeignKey(
        Question,
        on_delete=models.CASCADE,
        related_name='options'
    )
    text = models.TextField(help_text='Option text')
    is_correct = models.BooleanField(
        default=False,
        help_text='Mark the correct answer'
    )
    order = models.PositiveIntegerField(
        default=0,
        help_text='Display order (0-3)'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'quiz_question_option'
        ordering = ['question', 'order']
        unique_together = ('question', 'order')
        indexes = [
            models.Index(fields=['question']),
        ]
    
    def __str__(self):
        return f"Q{self.question.id} - Option {self.order}"
    
    def clean(self):
        """Validate that order is 0-3"""
        if self.order < 0 or self.order > 3:
            raise ValueError('Option order must be between 0 and 3')


# ============================================================================
# TEST ATTEMPT MODEL - Track user test sessions with scoring
# ============================================================================
class TestAttempt(models.Model):
    """User's test session - tracks all attempts with difficulty-based scoring"""
    
    # Scoring constants
    DIFFICULTY_POINTS = {
        'easy': 2,
        'medium': 4,
        'hard': 6,
    }
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='test_attempts'
    )
    difficulty = models.CharField(
        max_length=10,
        choices=Question.DIFFICULTY_CHOICES
    )
    total_questions = models.PositiveIntegerField(default=15)
    answered_questions = models.PositiveIntegerField(
        default=0,
        help_text='Number of questions answered'
    )
    unanswered_questions = models.PositiveIntegerField(
        default=0,
        help_text='Number of questions left unanswered'
    )
    correct_answers = models.PositiveIntegerField(
        default=0,
        help_text='Number of correct answers'
    )
    incorrect_answers = models.PositiveIntegerField(
        default=0,
        help_text='Number of incorrect answers'
    )
    
    # Scoring fields
    total_score = models.PositiveIntegerField(
        default=0,
        help_text='Total points earned (sum of correct answers)'
    )
    max_score = models.PositiveIntegerField(
        default=0,
        help_text='Maximum possible score for this test'
    )
    percentage = models.FloatField(
        default=0.0,
        help_text='Percentage score (0-100)'
    )
    earned_points = models.PositiveIntegerField(
        default=0,
        help_text='Reward points earned from this test'
    )
    
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    is_completed = models.BooleanField(default=False)
    time_taken_seconds = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text='Time taken to complete the test in seconds'
    )
    
    class Meta:
        db_table = 'quiz_test_attempt'
        ordering = ['-started_at']
        indexes = [
            models.Index(fields=['user', '-started_at']),
            models.Index(fields=['difficulty']),
            models.Index(fields=['is_completed']),
        ]
    
    def __str__(self):
        status = 'Completed' if self.is_completed else 'In Progress'
        return f"{self.user.email} - {self.difficulty} ({status})"
    
    def get_points_per_question(self):
        """Get points awarded for correct answer based on difficulty"""
        return self.DIFFICULTY_POINTS.get(self.difficulty, 0)
    
    def calculate_scores(self):
        """
        Calculate all scoring metrics:
        - total_score: Sum of correct answers * difficulty points
        - max_score: total_questions * difficulty points
        - percentage: (total_score / max_score) * 100
        - earned_points: Reward points based on percentage
        """
        points_per_question = self.get_points_per_question()
        
        # Calculate max possible score
        self.max_score = self.total_questions * points_per_question
        
        # Calculate actual score
        self.total_score = self.correct_answers * points_per_question
        
        # Calculate percentage
        if self.max_score > 0:
            self.percentage = (self.total_score / self.max_score) * 100
        else:
            self.percentage = 0.0
        
        # Calculate earned reward points (bonus points based on percentage)
        # No negative marking - minimum is 0 points
        if self.percentage >= 90:
            self.earned_points = self.max_score  # 100% bonus
        elif self.percentage >= 80:
            self.earned_points = int(self.max_score * 0.8)
        elif self.percentage >= 70:
            self.earned_points = int(self.max_score * 0.6)
        elif self.percentage >= 60:
            self.earned_points = int(self.max_score * 0.4)
        elif self.percentage >= 50:
            self.earned_points = int(self.max_score * 0.2)
        else:
            self.earned_points = 0  # No negative marking
        
        return self
    
    def get_duration(self):
        """Get test duration in seconds"""
        if self.is_completed and self.time_taken_seconds:
            return self.time_taken_seconds
        return None
    
    def get_score_summary(self):
        """Return comprehensive score summary"""
        return {
            'total_questions': self.total_questions,
            'answered_questions': self.answered_questions,
            'unanswered_questions': self.unanswered_questions,
            'correct_answers': self.correct_answers,
            'incorrect_answers': self.incorrect_answers,
            'total_score': self.total_score,
            'max_score': self.max_score,
            'percentage': round(self.percentage, 2),
            'earned_points': self.earned_points,
            'difficulty': self.difficulty,
            'points_per_question': self.get_points_per_question(),
        }


# ============================================================================
# TEST RESPONSE MODEL - Track individual question responses with unanswered state
# ============================================================================
class TestResponse(models.Model):
    """User's answer to a specific question in a test attempt"""
    
    attempt = models.ForeignKey(
        TestAttempt,
        on_delete=models.CASCADE,
        related_name='responses'
    )
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    selected_option = models.ForeignKey(
        QuestionOption,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text='The option user selected (null if unanswered)'
    )
    is_correct = models.BooleanField(default=False)
    is_unanswered = models.BooleanField(
        default=True,
        help_text='True if question was not answered'
    )
    answered_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'quiz_test_response'
        ordering = ['answered_at']
        unique_together = ('attempt', 'question')
        indexes = [
            models.Index(fields=['attempt', 'question']),
            models.Index(fields=['is_unanswered']),
        ]
    
    def __str__(self):
        status = 'Answered' if not self.is_unanswered else 'Unanswered'
        return f"Attempt {self.attempt.id} - Question {self.question.id} ({status})"
    
    def save(self, *args, **kwargs):
        """Auto-determine if answer is correct and if answered"""
        if self.selected_option:
            self.is_correct = self.selected_option.is_correct
            self.is_unanswered = False
        else:
            self.is_correct = False
            self.is_unanswered = True
        super().save(*args, **kwargs)

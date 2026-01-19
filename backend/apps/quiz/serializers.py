from rest_framework import serializers
from .models import Question, QuestionOption, TestAttempt, TestResponse


# ============================================================================
# QUESTION SERIALIZERS
# ============================================================================
class QuestionOptionSerializer(serializers.ModelSerializer):
    """Serializer for question options"""
    
    class Meta:
        model = QuestionOption
        fields = ('id', 'text', 'order')
        # Note: is_correct is NEVER returned in API responses
        # Only known after test submission


class QuestionDetailSerializer(serializers.ModelSerializer):
    """Serializer for question with options (for test)"""
    options = QuestionOptionSerializer(many=True, read_only=True)
    
    class Meta:
        model = Question
        fields = ('id', 'text', 'difficulty', 'options')
        read_only_fields = ('id', 'text', 'difficulty')


class QuestionAdminSerializer(serializers.ModelSerializer):
    """Serializer for question administration with correct answers visible"""
    options = QuestionOptionSerializer(many=True, read_only=True)
    
    class Meta:
        model = Question
        fields = ('id', 'text', 'difficulty', 'explanation', 'options', 'created_at')


# ============================================================================
# TEST RESPONSE SERIALIZERS
# ============================================================================
class SubmitAnswerSerializer(serializers.Serializer):
    """Serializer to submit answer to a question"""
    question_id = serializers.IntegerField()
    option_id = serializers.IntegerField()
    
    def validate(self, data):
        """Validate question and option exist"""
        try:
            question = Question.objects.get(id=data['question_id'])
        except Question.DoesNotExist:
            raise serializers.ValidationError('Question not found')
        
        try:
            option = QuestionOption.objects.get(
                id=data['option_id'],
                question_id=data['question_id']
            )
        except QuestionOption.DoesNotExist:
            raise serializers.ValidationError('Invalid option for this question')
        
        data['question'] = question
        data['option'] = option
        return data


class TestResponseSerializer(serializers.ModelSerializer):
    """Serializer for test responses after completion"""
    question_text = serializers.CharField(source='question.text', read_only=True)
    question_difficulty = serializers.CharField(source='question.difficulty', read_only=True)
    selected_text = serializers.CharField(source='selected_option.text', read_only=True, allow_null=True)
    correct_answer_id = serializers.SerializerMethodField()
    correct_answer_text = serializers.SerializerMethodField()
    
    class Meta:
        model = TestResponse
        fields = (
            'id',
            'question_text',
            'question_difficulty',
            'selected_text',
            'is_correct',
            'is_unanswered',
            'correct_answer_id',
            'correct_answer_text',
        )
    
    def get_correct_answer_id(self, obj):
        """Get ID of correct answer"""
        correct = obj.question.options.filter(is_correct=True).first()
        return correct.id if correct else None
    
    def get_correct_answer_text(self, obj):
        """Get text of correct answer"""
        correct = obj.question.options.filter(is_correct=True).first()
        return correct.text if correct else None


# ============================================================================
# TEST ATTEMPT SERIALIZERS
# ============================================================================
class StartTestSerializer(serializers.Serializer):
    """Serializer to start a new test"""
    difficulty = serializers.ChoiceField(
        choices=['easy', 'medium', 'hard'],
        help_text='Choose test difficulty level'
    )
    
    def validate_difficulty(self, value):
        """Validate difficulty choice"""
        if value not in ['easy', 'medium', 'hard']:
            raise serializers.ValidationError(f'Invalid difficulty: {value}')
        return value


class TestAttemptSerializer(serializers.ModelSerializer):
    """Serializer for test attempt details with scoring"""
    user_email = serializers.CharField(source='user.email', read_only=True)
    difficulty_display = serializers.CharField(source='get_difficulty_display', read_only=True)
    points_per_question = serializers.SerializerMethodField()
    
    class Meta:
        model = TestAttempt
        fields = (
            'id',
            'user_email',
            'difficulty',
            'difficulty_display',
            'total_questions',
            'answered_questions',
            'unanswered_questions',
            'correct_answers',
            'incorrect_answers',
            'total_score',
            'max_score',
            'percentage',
            'earned_points',
            'points_per_question',
            'started_at',
            'completed_at',
            'is_completed',
            'time_taken_seconds',
        )
        read_only_fields = (
            'id',
            'user_email',
            'started_at',
            'completed_at',
            'is_completed',
            'time_taken_seconds',
            'answered_questions',
            'unanswered_questions',
            'correct_answers',
            'incorrect_answers',
            'total_score',
            'max_score',
            'percentage',
            'earned_points',
        )
    
    def get_points_per_question(self, obj):
        """Get points per question based on difficulty"""
        return obj.get_points_per_question()


class TestSessionSerializer(serializers.ModelSerializer):
    """Serializer for active test session (returns questions)"""
    questions = serializers.SerializerMethodField()
    
    class Meta:
        model = TestAttempt
        fields = (
            'id',
            'difficulty',
            'total_questions',
            'started_at',
            'is_completed',
            'questions',
        )
        read_only_fields = fields
    
    def get_questions(self, obj):
        """Return list of questions for the test"""
        # Get all responses for this attempt
        responses = TestResponse.objects.filter(attempt=obj).values_list('question_id', flat=True)
        questions = Question.objects.filter(id__in=responses).order_by('id')
        return QuestionDetailSerializer(questions, many=True).data


class TestResultSerializer(serializers.ModelSerializer):
    """Serializer for completed test results with full score summary"""
    user_email = serializers.CharField(source='user.email', read_only=True)
    difficulty_display = serializers.CharField(source='get_difficulty_display', read_only=True)
    responses = TestResponseSerializer(many=True, read_only=True)
    points_per_question = serializers.SerializerMethodField()
    score_summary = serializers.SerializerMethodField()
    
    class Meta:
        model = TestAttempt
        fields = (
            'id',
            'user_email',
            'difficulty',
            'difficulty_display',
            'total_questions',
            'answered_questions',
            'unanswered_questions',
            'correct_answers',
            'incorrect_answers',
            'total_score',
            'max_score',
            'percentage',
            'earned_points',
            'points_per_question',
            'started_at',
            'completed_at',
            'time_taken_seconds',
            'score_summary',
            'responses',
        )
        read_only_fields = fields
    
    def get_points_per_question(self, obj):
        """Get points per question based on difficulty"""
        return obj.get_points_per_question()
    
    def get_score_summary(self, obj):
        """Return comprehensive score summary"""
        return {
            'total_questions': obj.total_questions,
            'answered_questions': obj.answered_questions,
            'unanswered_questions': obj.unanswered_questions,
            'correct_answers': obj.correct_answers,
            'incorrect_answers': obj.incorrect_answers,
            'total_score': obj.total_score,
            'max_score': obj.max_score,
            'percentage': round(obj.percentage, 2),
            'earned_points': obj.earned_points,
            'difficulty': obj.difficulty,
            'points_per_question': obj.get_points_per_question(),
            'performance_rating': self._get_performance_rating(obj.percentage),
        }
    
    def _get_performance_rating(self, percentage):
        """Get performance rating based on percentage"""
        if percentage >= 90:
            return 'Excellent'
        elif percentage >= 80:
            return 'Very Good'
        elif percentage >= 70:
            return 'Good'
        elif percentage >= 60:
            return 'Satisfactory'
        elif percentage >= 50:
            return 'Pass'
        else:
            return 'Needs Improvement'

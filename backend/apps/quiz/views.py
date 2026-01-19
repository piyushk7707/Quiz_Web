from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from django.utils import timezone
from django.db.models import Q
import random
from .models import Question, QuestionOption, TestAttempt, TestResponse
from .serializers import (
    StartTestSerializer,
    TestSessionSerializer,
    TestAttemptSerializer,
    TestResultSerializer,
    SubmitAnswerSerializer,
)


# ============================================================================
# TEST MANAGEMENT VIEWS
# ============================================================================
class StartTestView(APIView):
    """Start a new test with specified difficulty"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """
        Start a new test
        
        Request body:
        {
            "difficulty": "easy|medium|hard"
        }
        
        Returns: Active test with 15 random questions
        """
        serializer = StartTestSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        difficulty = serializer.validated_data['difficulty']
        
        # Check if user has an active test
        active_test = TestAttempt.objects.filter(
            user=request.user,
            is_completed=False
        ).first()
        
        if active_test:
            return Response(
                {'error': 'You already have an active test. Complete or abandon it first.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get 15 random questions of selected difficulty
        questions = list(
            Question.objects.filter(difficulty=difficulty)
            .values_list('id', flat=True)
        )
        
        if len(questions) < 15:
            return Response(
                {'error': f'Not enough questions available for {difficulty} difficulty. '
                          f'Available: {len(questions)}, Required: 15'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Randomly select 15 questions
        selected_questions = random.sample(questions, 15)
        
        # Create test attempt
        test_attempt = TestAttempt.objects.create(
            user=request.user,
            difficulty=difficulty,
            total_questions=15
        )
        
        # Create test responses for each question (no answer yet)
        for question_id in selected_questions:
            TestResponse.objects.create(
                attempt=test_attempt,
                question_id=question_id
            )
        
        # Return test session with questions
        test_session = TestSessionSerializer(test_attempt).data
        return Response(test_session, status=status.HTTP_201_CREATED)


class ActiveTestView(APIView):
    """Get user's active test if one exists"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """
        Get active (incomplete) test for user
        Returns 404 if no active test
        """
        active_test = TestAttempt.objects.filter(
            user=request.user,
            is_completed=False
        ).first()
        
        if not active_test:
            return Response(
                {'error': 'No active test'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Return active test info
        return Response({
            'id': active_test.id,
            'difficulty': active_test.difficulty,
            'total_questions': active_test.total_questions,
            'answered_questions': active_test.answered_questions,
            'started_at': active_test.started_at,
            'current_question': active_test.answered_questions + 1,
        }, status=status.HTTP_200_OK)


class GetTestView(APIView):
    """Retrieve active test session"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, test_id=None):
        """
        Get test session
        - If test_id provided: Get specific test
        - Otherwise: Get user's active test
        """
        if test_id:
            try:
                test = TestAttempt.objects.get(id=test_id, user=request.user)
            except TestAttempt.DoesNotExist:
                return Response(
                    {'error': 'Test not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            # Get active test (not completed)
            test = TestAttempt.objects.filter(
                user=request.user,
                is_completed=False
            ).first()
            
            if not test:
                return Response(
                    {'error': 'No active test found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        serializer = TestSessionSerializer(test)
        return Response(serializer.data, status=status.HTTP_200_OK)


class SubmitAnswerView(APIView):
    """Submit answer to a test question"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, test_id):
        """
        Submit answer to a question
        
        Request body:
        {
            "question_id": 1,
            "option_id": 4
        }
        """
        serializer = SubmitAnswerSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # Get test attempt
        try:
            test = TestAttempt.objects.get(id=test_id, user=request.user)
        except TestAttempt.DoesNotExist:
            return Response(
                {'error': 'Test not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if test.is_completed:
            return Response(
                {'error': 'Test is already completed'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        question = serializer.validated_data['question']
        option = serializer.validated_data['option']
        
        # Get or create test response
        test_response, created = TestResponse.objects.get_or_create(
            attempt=test,
            question=question,
            defaults={'selected_option': option}
        )
        
        if not created:
            # Update existing response
            test_response.selected_option = option
            test_response.save()
        
        # Check if answer is correct
        is_correct = option.is_correct
        
        return Response({
            'message': 'Answer submitted',
            'is_correct': is_correct,
            'question_id': question.id,
        }, status=status.HTTP_200_OK)


class CompleteTestView(APIView):
    """Complete and score the test with difficulty-based points"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, test_id):
        """
        Complete test and calculate difficulty-based score
        
        Scoring:
        - Easy: 2 points per correct answer
        - Medium: 4 points per correct answer
        - Hard: 6 points per correct answer
        - No negative marking (0 points minimum)
        - Earned reward points based on percentage achieved
        
        Optional request body:
        {
            "time_taken_seconds": 1200
        }
        """
        try:
            test = TestAttempt.objects.get(id=test_id, user=request.user)
        except TestAttempt.DoesNotExist:
            return Response(
                {'error': 'Test not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if test.is_completed:
            return Response(
                {'error': 'Test is already completed'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get all responses for this test
        responses = TestResponse.objects.filter(attempt=test)
        
        # Calculate statistics
        correct_count = responses.filter(is_correct=True).count()
        answered_count = responses.filter(is_unanswered=False).count()
        unanswered_count = responses.filter(is_unanswered=True).count()
        incorrect_count = answered_count - correct_count
        
        # Update test attempt with counts
        test.correct_answers = correct_count
        test.answered_questions = answered_count
        test.unanswered_questions = unanswered_count
        test.incorrect_answers = incorrect_count
        
        # Calculate scores based on difficulty
        test.calculate_scores()
        
        # Set completion details
        test.completed_at = timezone.now()
        test.is_completed = True
        
        # Optional: set time taken if provided
        time_taken = request.data.get('time_taken_seconds')
        if time_taken:
            test.time_taken_seconds = int(time_taken)
        
        test.save()
        
        # Return comprehensive results
        serializer = TestResultSerializer(test)
        return Response(serializer.data, status=status.HTTP_200_OK)


class TestResultsView(APIView):
    """Get test results"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, test_id):
        """Get completed test results with answers"""
        try:
            test = TestAttempt.objects.get(id=test_id, user=request.user)
        except TestAttempt.DoesNotExist:
            return Response(
                {'error': 'Test not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if not test.is_completed:
            return Response(
                {'error': 'Test is not yet completed'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = TestResultSerializer(test)
        return Response(serializer.data, status=status.HTTP_200_OK)


class UserTestHistoryView(APIView):
    """Get all completed tests for user"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get user's test history"""
        tests = TestAttempt.objects.filter(
            user=request.user,
            is_completed=True
        ).order_by('-completed_at')
        
        serializer = TestAttemptSerializer(tests, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class TestScoreSummaryView(APIView):
    """Get score summary for a completed test"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, test_id):
        """Get score summary for completed test"""
        try:
            test = TestAttempt.objects.get(id=test_id, user=request.user)
        except TestAttempt.DoesNotExist:
            return Response(
                {'error': 'Test not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if not test.is_completed:
            return Response(
                {'error': 'Test is not yet completed'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get score summary
        summary = {
            'test_id': test.id,
            'user_email': test.user.email,
            'difficulty': test.difficulty,
            'difficulty_display': test.get_difficulty_display(),
            'started_at': test.started_at,
            'completed_at': test.completed_at,
            'time_taken_seconds': test.time_taken_seconds,
            'scoring': {
                'total_questions': test.total_questions,
                'answered_questions': test.answered_questions,
                'unanswered_questions': test.unanswered_questions,
                'correct_answers': test.correct_answers,
                'incorrect_answers': test.incorrect_answers,
                'total_score': test.total_score,
                'max_score': test.max_score,
                'percentage': round(test.percentage, 2),
                'points_per_question': test.get_points_per_question(),
            },
            'rewards': {
                'earned_points': test.earned_points,
                'performance_rating': self._get_performance_rating(test.percentage),
            }
        }
        
        return Response(summary, status=status.HTTP_200_OK)
    
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
    """Abandon active test"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, test_id):
        """Abandon active test"""
        try:
            test = TestAttempt.objects.get(id=test_id, user=request.user)
        except TestAttempt.DoesNotExist:
            return Response(
                {'error': 'Test not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if test.is_completed:
            return Response(
                {'error': 'Cannot abandon a completed test'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Delete test and responses
        test_id_for_response = test.id
        test.delete()
        
        return Response({
            'message': 'Test abandoned',
            'test_id': test_id_for_response
        }, status=status.HTTP_200_OK)


# ============================================================================
# QUESTION LISTING VIEW
# ============================================================================
class QuestionListView(APIView):
    """List questions with optional difficulty filter for checking availability"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """
        Get question count by difficulty
        Query parameters:
        - difficulty: 'easy', 'medium', or 'hard' (optional)
        
        Returns: {'count': <int>, 'results': [...]}
        """
        difficulty = request.query_params.get('difficulty')
        
        queryset = Question.objects.all()
        
        if difficulty:
            queryset = queryset.filter(difficulty=difficulty)
        
        count = queryset.count()
        
        return Response({
            'count': count,
            'results': []
        }, status=status.HTTP_200_OK)

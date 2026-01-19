from django.urls import path
from .views import (
    StartTestView,
    GetTestView,
    SubmitAnswerView,
    CompleteTestView,
    TestResultsView,
    TestScoreSummaryView,
    UserTestHistoryView,
    ActiveTestView,
    QuestionListView,
)

app_name = 'quiz'

urlpatterns = [
    # Questions
    path('questions/', QuestionListView.as_view(), name='question-list'),
    
    # Test Management
    path('start/', StartTestView.as_view(), name='start-test'),
    path('active-test/', ActiveTestView.as_view(), name='active-test'),
    path('test/<int:test_id>/', GetTestView.as_view(), name='get-test'),
    path('test/', GetTestView.as_view(), name='get-active-test'),
    
    # Answer Submission
    path('test/<int:test_id>/answer/', SubmitAnswerView.as_view(), name='submit-answer'),
    
    # Test Completion & Results
    path('test/<int:test_id>/complete/', CompleteTestView.as_view(), name='complete-test'),
    path('test/<int:test_id>/results/', TestResultsView.as_view(), name='test-results'),
    path('test/<int:test_id>/summary/', TestScoreSummaryView.as_view(), name='test-summary'),
    
    # History
    path('history/', UserTestHistoryView.as_view(), name='test-history'),
]

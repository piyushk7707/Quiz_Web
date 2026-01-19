from django.contrib import admin
from .models import Question, QuestionOption, TestAttempt, TestResponse

@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ('text', 'difficulty', 'created_at')
    search_fields = ('text',)
    list_filter = ('difficulty', 'created_at')

@admin.register(QuestionOption)
class QuestionOptionAdmin(admin.ModelAdmin):
    list_display = ('text', 'question', 'is_correct')
    list_filter = ('is_correct',)

@admin.register(TestAttempt)
class TestAttemptAdmin(admin.ModelAdmin):
    list_display = ('user', 'difficulty', 'total_questions', 'is_completed')
    search_fields = ('user__username',)
    list_filter = ('is_completed', 'difficulty', 'started_at')

@admin.register(TestResponse)
class TestResponseAdmin(admin.ModelAdmin):
    list_display = ('question', 'selected_option', 'is_correct')
    search_fields = ('question__text',)


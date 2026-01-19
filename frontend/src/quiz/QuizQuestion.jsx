import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import QuizTimer from './QuizTimer';

/**
 * QuizQuestion Component
 * 
 * Main quiz interface - shows one question at a time
 * - Displays question number, text, and 4 options
 * - Per-question countdown timer (30 seconds)
 * - Auto-submits unanswered questions on timer expiry
 * - Locks question after answer selection
 * - Auto-advances to next question
 * - Submits test on final question completion
 * - Handles page refresh by resuming from saved state
 * - Prevents race conditions between option click and timer expiry
 */
const QuizQuestion = () => {
  const { testId } = useParams();
  const navigate = useNavigate();

  // State management
  const [testData, setTestData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [timerKey, setTimerKey] = useState(0); // Force timer reset
  const [hasSubmittedForQuestion, setHasSubmittedForQuestion] = useState(false); // Prevent double submissions

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;

  // SESSION STORAGE HELPERS - for refresh handling
  const SESSION_KEY = `quiz_${testId}_state`;

  const saveQuizState = useCallback((questionIndex) => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({
      testId,
      questionIndex,
      timestamp: Date.now(),
    }));
  }, [testId, SESSION_KEY]);

  const getSavedState = useCallback(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      // Silent error - state restoration failed, will start fresh
      return null;
    }
  }, [SESSION_KEY]);

  const clearQuizState = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
  }, [SESSION_KEY]);

  // Fetch test data and questions on mount
  useEffect(() => {
    const fetchTestData = async () => {
      try {
        setIsLoading(true);
        const response = await api.get(`/quiz/test/${testId}/`);
        
        // Validate test exists and has questions
        if (!response.data || !response.data.questions || response.data.questions.length === 0) {
          setError('No active test found. Please start a new quiz.');
          clearQuizState();
          setTimeout(() => navigate('/quiz'), 2000);
          return;
        }

        setTestData(response.data);
        setQuestions(response.data.questions || []);
        setError(null);

        // REFRESH HANDLING: Restore question index from sessionStorage
        const savedState = getSavedState();
        if (savedState && savedState.testId === testId) {
          const savedIndex = Math.min(savedState.questionIndex, response.data.questions.length - 1);
          setCurrentQuestionIndex(savedIndex);
          // Timer will reset via key change
          setTimerKey((prev) => prev + 1);
        }
      } catch (err) {
        const errorMessage = err.response?.data?.error || 'Failed to load test. Please try again.';
        setError(errorMessage);
        clearQuizState();
      } finally {
        setIsLoading(false);
      }
    };

    fetchTestData();
  }, [testId, navigate, getSavedState, clearQuizState]);

  // REFRESH HANDLING: Save quiz state when question changes
  useEffect(() => {
    saveQuizState(currentQuestionIndex);
  }, [currentQuestionIndex, saveQuizState]);

  // Handle answer selection - lock question and submit
  // RACE CONDITION PREVENTION: Use hasSubmittedForQuestion flag
  const handleSelectOption = useCallback(
    async (optionId) => {
      // Prevent multiple submissions for same question
      if (isAnswered || isSubmittingAnswer || hasSubmittedForQuestion) return;

      setSelectedOption(optionId);
      setIsAnswered(true);
      setIsSubmittingAnswer(true);
      setHasSubmittedForQuestion(true); // Block further submissions

      try {
        // Submit answer to backend
        await api.post(`/quiz/test/${testId}/answer/`, {
          question_id: currentQuestion.id,
          option_id: optionId,
        });

        // Auto-advance after brief delay to show selection
        setTimeout(() => {
          handleNextQuestion();
        }, 800);
      } catch (err) {
        // Error handling: Reset state to allow user retry without console pollution
        setIsAnswered(false);
        setSelectedOption(null);
        setIsSubmittingAnswer(false);
        setHasSubmittedForQuestion(false); // Allow retry on error
      }
    },
    [testId, currentQuestion, isAnswered, isSubmittingAnswer, hasSubmittedForQuestion]
  );

  // Handle timer expiry - submit as unanswered
  // RACE CONDITION PREVENTION: Check hasSubmittedForQuestion
  const handleTimeUp = useCallback(async () => {
    // If already answered (by click) or submitted for this question, skip
    if (isAnswered || isSubmittingAnswer || hasSubmittedForQuestion) return;

    setIsAnswered(true);
    setIsSubmittingAnswer(true);
    setHasSubmittedForQuestion(true); // Prevent further submissions

    try {
      // Submit as unanswered (no option selected)
      await api.post(`/quiz/test/${testId}/answer/`, {
        question_id: currentQuestion.id,
        option_id: null, // Explicitly unanswered
      });

      // Auto-advance to next question
      setTimeout(() => {
        handleNextQuestion();
      }, 500);
    } catch (err) {
      // Error submitting empty answer - still proceed to next question
      setTimeout(() => {
        handleNextQuestion();
      }, 500);
    }
  }, [testId, currentQuestion, isAnswered, isSubmittingAnswer, hasSubmittedForQuestion]);

  // Move to next question or complete test
  const handleNextQuestion = useCallback(async () => {
    if (isLastQuestion) {
      // Complete the test
      try {
        setIsSubmittingAnswer(true);
        const completionTime = Math.floor((Date.now() - new Date(testData.started_at).getTime()) / 1000);
        
        const response = await api.post(`/quiz/test/${testId}/complete/`, {
          time_taken_seconds: completionTime,
        });

        // Clear saved state on completion
        clearQuizState();

        // Redirect to results page
        navigate(`/quiz/results/${testId}`, {
          state: { resultData: response.data },
        });
      } catch (err) {
        // Quiz completion error - notify user without console pollution
        setError('Failed to complete test. Please try again.');
        setIsSubmittingAnswer(false);
      }
    } else {
      // Move to next question
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setIsSubmittingAnswer(false);
      setHasSubmittedForQuestion(false); // Reset submission flag for new question
      setTimerKey((prev) => prev + 1); // Reset timer by changing key
    }
  }, [isLastQuestion, testId, testData, navigate, clearQuizState]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="quiz-loading-container">
        <div className="spinner"></div>
        <p>Loading quiz...</p>
      </div>
    );
  }

  // Show error state
  if (error || !currentQuestion) {
    return (
      <div className="quiz-error-container">
        <h2>⚠️ Error</h2>
        <p>{error || 'Failed to load question. Please refresh the page.'}</p>
        <div className="error-actions">
          <button onClick={() => navigate('/quiz')} className="btn-primary">← Back to Quiz Start</button>
          <button onClick={() => window.location.reload()} className="btn-secondary">🔄 Reload Page</button>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-question-container">
      {/* Header */}
      <div className="quiz-header-bar">
        <div className="progress-info">
          <span className="question-counter">
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </span>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
            ></div>
          </div>
        </div>
        <div className="timer-section">
          <QuizTimer
            key={timerKey}
            duration={30}
            onTimeUp={handleTimeUp}
            isActive={!isAnswered}
          />
        </div>
      </div>

      {/* Question Content */}
      <div className="quiz-content">
        <div className="question-box">
          <div className="difficulty-badge" data-difficulty={currentQuestion.difficulty}>
            {currentQuestion.difficulty.charAt(0).toUpperCase() + currentQuestion.difficulty.slice(1)}
          </div>
          <h2 className="question-text">{currentQuestion.text}</h2>
        </div>

        {/* Options */}
        <div className="options-grid">
          {currentQuestion.options.map((option, idx) => (
            <button
              key={option.id}
              className={`option-button ${selectedOption === option.id ? 'selected' : ''} ${
                isAnswered ? 'disabled' : 'active'
              }`}
              onClick={() => handleSelectOption(option.id)}
              disabled={isAnswered}
              title={isAnswered ? 'Answer locked' : `Select option ${String.fromCharCode(65 + idx)}`}
            >
              <span className="option-letter">
                {String.fromCharCode(65 + idx)}
              </span>
              <span className="option-text">{option.text}</span>
              {selectedOption === option.id && <span className="option-check">✓</span>}
            </button>
          ))}
        </div>

        {/* Submission Status */}
        {isAnswered && (
          <div className="submission-status">
            <span className="status-icon">✓</span>
            <span className="status-text">
              {selectedOption ? 'Answer submitted' : 'Time expired - marked as unanswered'}
            </span>
          </div>
        )}

        {/* Navigation Info */}
        <div className="navigation-info">
          {isLastQuestion ? (
            <p className="info-text">This is the final question. After submission, you'll see your results.</p>
          ) : (
            <p className="info-text">
              {isAnswered ? 'Moving to next question...' : 'Select an answer or wait for time to expire'}
            </p>
          )}
        </div>
      </div>

      <style jsx>{`
        .quiz-question-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .quiz-header-bar {
          background: white;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
        }

        .progress-info {
          flex: 1;
        }

        .question-counter {
          display: block;
          font-size: 14px;
          color: #666;
          margin-bottom: 8px;
          font-weight: 500;
        }

        .progress-bar {
          height: 6px;
          background: #e0e0e0;
          border-radius: 3px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #667eea, #764ba2);
          transition: width 0.3s ease;
        }

        .timer-section {
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .quiz-content {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          border-radius: 16px;
          padding: 40px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        }

        .question-box {
          margin-bottom: 40px;
        }

        .difficulty-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .difficulty-badge[data-difficulty='easy'] {
          background: #e8f5e9;
          color: #2e7d32;
        }

        .difficulty-badge[data-difficulty='medium'] {
          background: #fff3e0;
          color: #e65100;
        }

        .difficulty-badge[data-difficulty='hard'] {
          background: #ffebee;
          color: #c62828;
        }

        .question-text {
          margin: 0;
          font-size: 24px;
          color: #333;
          line-height: 1.5;
        }

        .options-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
          margin-bottom: 30px;
        }

        .option-button {
          padding: 16px;
          border: 2px solid #e0e0e0;
          border-radius: 12px;
          background: white;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 16px;
          text-align: left;
        }

        .option-button.active:hover {
          border-color: #667eea;
          background: #f5f7ff;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
        }

        .option-button.selected {
          border-color: #667eea;
          background: linear-gradient(135deg, #f5f7ff 0%, #f0f0ff 100%);
          box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
          font-weight: 500;
        }

        .option-button.disabled {
          cursor: not-allowed;
        }

        .option-button.disabled:hover {
          border-color: #e0e0e0;
          background: white;
          box-shadow: none;
        }

        .option-letter {
          display: inline-flex;
          width: 32px;
          height: 32px;
          align-items: center;
          justify-content: center;
          background: #f0f0f0;
          border-radius: 50%;
          font-weight: 600;
          color: #333;
          flex-shrink: 0;
          transition: all 0.3s ease;
        }

        .option-button.selected .option-letter {
          background: #667eea;
          color: white;
          transform: scale(1.1);
        }

        .option-text {
          flex: 1;
          color: #333;
        }

        .option-check {
          color: #4caf50;
          font-weight: bold;
          font-size: 18px;
        }

        .submission-status {
          background: #e8f5e9;
          border-left: 4px solid #4caf50;
          padding: 12px 16px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
          color: #2e7d32;
          font-weight: 500;
        }

        .status-icon {
          font-size: 18px;
        }

        .navigation-info {
          text-align: center;
          padding: 16px;
          background: #f5f5f5;
          border-radius: 8px;
          margin-top: 20px;
        }

        .info-text {
          margin: 0;
          color: #666;
          font-size: 14px;
        }

        .quiz-loading-container,
        .quiz-error-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .spinner {
          border: 4px solid rgba(255, 255, 255, 0.3);
          border-top: 4px solid white;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        .quiz-error-container {
          background: #c62828;
        }

        .quiz-error-container h2 {
          margin-top: 0;
        }

        .error-actions {
          display: flex;
          gap: 12px;
          margin-top: 20px;
          justify-content: center;
        }

        .btn-primary {
          padding: 10px 20px;
          background: white;
          color: #c62828;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
        }

        .btn-primary:hover {
          background: #f5f5f5;
        }

        .btn-secondary {
          padding: 10px 20px;
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: 2px solid white;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        @media (max-width: 600px) {
          .quiz-header-bar {
            flex-direction: column;
            align-items: flex-start;
          }

          .quiz-content {
            padding: 20px;
          }

          .question-text {
            font-size: 18px;
          }

          .option-button {
            padding: 12px;
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
};

export default QuizQuestion;

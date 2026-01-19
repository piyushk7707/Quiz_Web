import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';

/**
 * QuizResult Component
 * 
 * Displays comprehensive test results after quiz completion
 * - Shows correct/incorrect/unanswered counts
 * - Displays accuracy percentage with visual progress bar
 * - Shows performance rating (Excellent/Good/Needs Improvement)
 * - Prevents browser back navigation to quiz
 * - Provides navigation to new test or dashboard
 */
const QuizResult = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const historyRef = useRef(window.history.length);
  const [resultData, setResultData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  // Prevent back navigation to quiz
  useEffect(() => {
    const handlePopState = (event) => {
      // Block back button - replace history entry with dashboard
      window.history.pushState(null, null, window.location.href);
      navigate('/dashboard');
    };

    // Push a new state to prevent back navigation
    window.history.pushState(null, null, window.location.href);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [navigate]);

  // Fetch result data on mount with security checks
  useEffect(() => {
    const fetchResults = async () => {
      try {
        setIsLoading(true);
        const response = await api.get(`/quiz/test/${testId}/results/`);
        setResultData(response.data);
        setError(null);
      } catch (err) {
        // JWT expiry handling: Detect 401 status and gracefully redirect to login
        // This prevents showing cryptic errors when session expires during result viewing
        if (err.response?.status === 401) {
          setSessionExpired(true);
          setError('Your session has expired. Please log in again.');
          // Redirect after 2-second delay to let user read the message
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        const errorMessage =
          err.response?.data?.error || 'Failed to load results. Please try again.';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [testId, navigate]);

  // Get performance rating based on percentage (percentage-based calculation)
  // Frontend calculates this instead of depending on backend rating for reliability
  const getPerformanceRating = (percentage) => {
    if (percentage >= 90) return 'Excellent';
    if (percentage >= 80) return 'Very Good';
    if (percentage >= 70) return 'Good';
    if (percentage >= 60) return 'Satisfactory';
    if (percentage >= 50) return 'Pass';
    return 'Needs Improvement';
  };

  // Get performance color based on rating (for visual consistency)
  // Colors follow standard UX conventions: green for excellent, red for needs improvement
  const getPerformanceColor = (percentage) => {
    if (percentage >= 90) return '#4caf50'; // Green
    if (percentage >= 80) return '#8bc34a'; // Light Green
    if (percentage >= 70) return '#ffc107'; // Amber
    if (percentage >= 60) return '#ff9800'; // Orange
    if (percentage >= 50) return '#ff7043'; // Deep Orange
    return '#f44336'; // Red
  };

  // Get performance emoji based on rating (for visual feedback and encouragement)
  const getPerformanceEmoji = (percentage) => {
    if (percentage >= 90) return '🏆';
    if (percentage >= 80) return '⭐';
    if (percentage >= 70) return '👍';
    if (percentage >= 60) return '🤔';
    if (percentage >= 50) return '📚';
    return '💪';
  };

  // Get personalized performance message based on percentage
  // Messages are motivational and provide actionable feedback for improvement
  const getPerformanceMessage = (percentage) => {
    if (percentage >= 90) {
      return 'Outstanding performance! You have mastered this topic. Keep up the excellent work! 🌟';
    }
    if (percentage >= 80) {
      return 'Very good! You have a strong understanding. Try retaking it to aim for excellence!';
    }
    if (percentage >= 70) {
      return 'Good work! You have a solid grasp of the material. Review weak areas for improvement.';
    }
    if (percentage >= 60) {
      return 'Satisfactory performance. Review the material and try again to improve your score.';
    }
    if (percentage >= 50) {
      return 'You passed! Review the material carefully and retake the quiz for better results.';
    }
    return 'Keep practicing! Review all topics and try again to improve your score. You got this! 💪';
  };

  // Show session expired state
  if (sessionExpired) {
    return (
      <div className="result-error-container">
        <h2>🔐 Session Expired</h2>
        <p>Your session has expired. Please log in again to view results.</p>
        <button onClick={() => navigate('/login')} className="btn btn-primary">
          Go to Login
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="result-loading-container">
        <div className="spinner"></div>
        <p>Loading results...</p>
      </div>
    );
  }

  if (error || !resultData) {
    return (
      <div className="result-error-container">
        <h2>⚠️ Error Loading Results</h2>
        <p>{error || 'Failed to load results.'}</p>
        <div className="error-actions">
          <button onClick={() => navigate('/quiz')} className="btn btn-primary">
            ← Start New Test
          </button>
          <button onClick={() => navigate('/dashboard')} className="btn btn-secondary">
            Go to Dashboard →
          </button>
        </div>
      </div>
    );
  }

  const summary = resultData.score_summary;
  const percentage = Math.round(summary.percentage);
  const performanceRating = getPerformanceRating(percentage);
  const performanceColor = getPerformanceColor(percentage);
  const performanceEmoji = getPerformanceEmoji(percentage);

  return (
    <div className="quiz-result-container">
      {/* Header */}
      <div className="result-header">
        <h1>📊 Quiz Completed!</h1>
        <p className="result-subtitle">Here's how you performed</p>
      </div>

      {/* Performance Card */}
      <div className="result-content">
        <div className="performance-card" style={{ borderTopColor: performanceColor }}>
          <div className="performance-emoji" style={{ color: performanceColor }}>
            {performanceEmoji}
          </div>
          <div className="performance-rating" style={{ color: performanceColor }}>
            {performanceRating}
          </div>
          <p className="performance-subtitle">Your Performance Level</p>
        </div>

        {/* Score Section */}
        <div className="score-section">
          <div className="score-header">📊 Score Breakdown</div>

          <div className="score-grid">
            <div className="score-card">
              <div className="score-label">Total Score</div>
              <div className="score-value">{summary.total_score}</div>
              <div className="score-unit">/ {summary.max_score} points</div>
            </div>

            <div className="score-card">
              <div className="score-label">Accuracy</div>
              <div className="score-value">{percentage}%</div>
              <div className="score-unit">correct</div>
            </div>

            <div className="score-card">
              <div className="score-label">Bonus Points</div>
              <div className="score-value bonus" style={{ color: '#ff9800' }}>
                +{summary.earned_points}
              </div>
              <div className="score-unit">earned</div>
            </div>
          </div>

          {/* Accuracy Progress Bar */}
          <div className="accuracy-section">
            <div className="accuracy-label">Accuracy Progress</div>
            <div className="percentage-bar">
              <div
                className="percentage-fill"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: performanceColor,
                }}
              ></div>
            </div>
            <div className="percentage-text">
              <span>{percentage}% Correct Answers</span>
            </div>
          </div>
        </div>

        {/* Answer Statistics */}
        <div className="statistics-section">
          <div className="statistics-header">📈 Answer Statistics</div>

          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Total Questions</span>
              <span className="stat-value">{summary.total_questions}</span>
            </div>

            <div className="stat-item">
              <span className="stat-label">✓ Correct</span>
              <span className="stat-value correct">{summary.correct_answers}</span>
            </div>

            <div className="stat-item">
              <span className="stat-label">✗ Incorrect</span>
              <span className="stat-value incorrect">{summary.incorrect_answers}</span>
            </div>

            <div className="stat-item">
              <span className="stat-label">⊘ Unanswered</span>
              <span className="stat-value unanswered">{summary.unanswered_questions}</span>
            </div>

            <div className="stat-item">
              <span className="stat-label">Difficulty</span>
              <span className="stat-value difficulty" data-difficulty={summary.difficulty}>
                {summary.difficulty.charAt(0).toUpperCase() + summary.difficulty.slice(1)}
              </span>
            </div>

            <div className="stat-item">
              <span className="stat-label">Points per Q</span>
              <span className="stat-value">+{summary.points_per_question}</span>
            </div>
          </div>
        </div>

        {/* Performance Message */}
        <div className="performance-message" style={{ borderLeftColor: performanceColor }}>
          <p>{getPerformanceMessage(percentage)}</p>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button className="btn btn-primary" onClick={() => navigate('/quiz')}>
            ← Start New Test
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
            Go to Dashboard →
          </button>
        </div>

        {/* Footer Info */}
        <div className="result-footer">
          <p>Test ID: {testId}</p>
          <p>Completed at: {new Date(resultData.completed_at).toLocaleString()}</p>
        </div>
      </div>

      <style jsx>{`
        .quiz-result-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .result-header {
          text-align: center;
          color: white;
          margin-bottom: 40px;
          padding: 20px;
        }

        .result-header h1 {
          margin: 0 0 10px 0;
          font-size: 36px;
        }

        .result-subtitle {
          margin: 0;
          font-size: 18px;
          opacity: 0.9;
        }

        .result-content {
          max-width: 900px;
          margin: 0 auto;
          background: white;
          border-radius: 16px;
          padding: 40px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        }

        .performance-card {
          text-align: center;
          padding: 30px;
          background: #f9f9f9;
          border-radius: 12px;
          border-top: 4px solid;
          margin-bottom: 40px;
        }

        .performance-emoji {
          font-size: 64px;
          margin-bottom: 15px;
        }

        .performance-rating {
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 5px;
        }

        .performance-subtitle {
          margin: 0;
          color: #666;
          font-size: 14px;
        }

        .score-section {
          margin-bottom: 40px;
        }

        .score-header,
        .statistics-header {
          font-size: 18px;
          font-weight: bold;
          color: #333;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 2px solid #667eea;
        }

        .score-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }

        .score-card {
          padding: 20px;
          background: #f5f7ff;
          border-radius: 12px;
          text-align: center;
          border: 2px solid #e0e0e0;
        }

        .score-label {
          font-size: 12px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
          font-weight: 600;
        }

        .score-value {
          font-size: 32px;
          font-weight: bold;
          color: #667eea;
          margin-bottom: 4px;
        }

        .score-unit {
          font-size: 12px;
          color: #999;
        }

        .percentage-bar {
          height: 12px;
          background: #e0e0e0;
          border-radius: 6px;
          overflow: hidden;
          margin-bottom: 10px;
        }

        .percentage-fill {
          height: 100%;
          transition: width 0.6s ease;
          border-radius: 6px;
        }

        .percentage-text {
          text-align: center;
          color: #666;
          font-size: 14px;
        }

        .accuracy-section {
          margin-top: 20px;
          padding: 20px;
          background: #f9f9f9;
          border-radius: 12px;
        }

        .accuracy-label {
          font-size: 14px;
          font-weight: 600;
          color: #333;
          margin-bottom: 12px;
        }

        .performance-message {
          margin: 30px 0;
          padding: 20px;
          background: white;
          border-left: 4px solid #667eea;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          font-size: 16px;
          color: #333;
          line-height: 1.6;
        }

        .performance-message p {
          margin: 0;
          font-weight: 500;
        }

        .statistics-section {
          margin-bottom: 40px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
          gap: 15px;
        }

        .stat-item {
          padding: 16px;
          background: #f5f5f5;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .stat-label {
          font-size: 12px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 600;
        }

        .stat-value {
          font-size: 20px;
          font-weight: bold;
          color: #333;
        }

        .stat-value.correct {
          color: #4caf50;
        }

        .stat-value.incorrect {
          color: #f44336;
        }

        .stat-value.unanswered {
          color: #9e9e9e;
        }

        .stat-value.difficulty {
          font-size: 14px;
          padding: 4px 8px;
          border-radius: 4px;
          text-align: center;
        }

        .stat-value.difficulty[data-difficulty='easy'] {
          background: #e8f5e9;
          color: #2e7d32;
        }

        .stat-value.difficulty[data-difficulty='medium'] {
          background: #fff3e0;
          color: #e65100;
        }

        .stat-value.difficulty[data-difficulty='hard'] {
          background: #ffebee;
          color: #c62828;
        }

        .action-buttons {
          display: flex;
          gap: 15px;
          justify-content: center;
          margin-bottom: 40px;
          flex-wrap: wrap;
        }

        .btn {
          padding: 12px 30px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .btn-primary {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .btn-secondary {
          background: white;
          color: #667eea;
          border: 2px solid #667eea;
        }

        .btn-secondary:hover {
          background: #f5f7ff;
        }

        .result-footer {
          text-align: center;
          color: #999;
          font-size: 12px;
          padding-top: 20px;
          border-top: 1px solid #e0e0e0;
        }

        .result-footer p {
          margin: 5px 0;
        }

        .result-loading-container,
        .result-error-container {
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

        .result-error-container {
          background: #c62828;
        }

        .result-error-container h2 {
          margin-top: 0;
        }

        .result-error-container button {
          padding: 10px 20px;
          background: white;
          color: #c62828;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
          margin-top: 20px;
        }

        @media (max-width: 600px) {
          .result-content {
            padding: 20px;
          }

          .result-header h1 {
            font-size: 28px;
          }

          .score-grid,
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .action-buttons {
            flex-direction: column;
          }

          .btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default QuizResult;

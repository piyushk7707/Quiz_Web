import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { AuthContext } from '../context/AuthContext';

/**
 * QuizStart Component
 * 
 * Initial quiz interface where users select difficulty level
 * - Display difficulty options (Easy, Medium, Hard)
 * - Check for active/incomplete tests and offer resume option
 * - Call backend to start test
 * - Redirect to QuizQuestion page with test ID
 */
const QuizStart = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [selectedDifficulty, setSelectedDifficulty] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [emptyStates, setEmptyStates] = useState({});
  const [activeTest, setActiveTest] = useState(null);
  const [checkingActiveTest, setCheckingActiveTest] = useState(true);
  const [questionCounts, setQuestionCounts] = useState({
    easy: 0,
    medium: 0,
    hard: 0,
  });
  const [checkingQuestions, setCheckingQuestions] = useState(true);

  const MINIMUM_QUESTIONS = 15;

  const difficulties = [
    {
      level: 'easy',
      label: 'Easy',
      description: 'Beginner friendly questions',
      icon: '😊',
      pointsPerQuestion: 2,
    },
    {
      level: 'medium',
      label: 'Medium',
      description: 'Intermediate questions',
      icon: '🤔',
      pointsPerQuestion: 4,
    },
    {
      level: 'hard',
      label: 'Hard',
      description: 'Advanced questions',
      icon: '🧠',
      pointsPerQuestion: 6,
    },
  ];

  // CHECK FOR ACTIVE TEST ON MOUNT
  useEffect(() => {
    const checkActiveTest = async () => {
      try {
        setCheckingActiveTest(true);
        // Try to fetch active test from backend
        const response = await api.get('/quiz/active-test/');
        if (response.data && response.data.id) {
          setActiveTest(response.data);
        }
      } catch (err) {
        // No active test found (404) - this is normal
        setActiveTest(null);
      } finally {
        setCheckingActiveTest(false);
      }
    };

    if (user) {
      checkActiveTest();
    }
  }, [user]);

  // FETCH QUESTION COUNTS FOR EACH DIFFICULTY
  useEffect(() => {
    const fetchQuestionCounts = async () => {
      try {
        setCheckingQuestions(true);
        const counts = {};
        
        // Fetch count for each difficulty
        for (const difficulty of ['easy', 'medium', 'hard']) {
          try {
            const response = await api.get(`/quiz/questions/`, {
              params: { difficulty: difficulty, page_size: 1 },
            });
            counts[difficulty] = response.data?.count || 0;
          } catch (err) {
            // If endpoint doesn't support filtering, try individual fetch
            counts[difficulty] = 0;
          }
        }
        
        setQuestionCounts(counts);
        
        // Set empty states based on minimum questions requirement
        const newEmptyStates = {};
        for (const difficulty of ['easy', 'medium', 'hard']) {
          newEmptyStates[difficulty] = counts[difficulty] < MINIMUM_QUESTIONS;
        }
        setEmptyStates(newEmptyStates);
      } catch (err) {
        // Silently fail if we can't fetch counts - allow attempts anyway
        setCheckingQuestions(false);
      } finally {
        setCheckingQuestions(false);
      }
    };

    if (user) {
      fetchQuestionCounts();
    }
  }, [user]);

  // RESUME ACTIVE TEST
  const handleResumeTest = () => {
    if (activeTest && activeTest.id) {
      navigate(`/quiz/test/${activeTest.id}`);
    }
  };

  const handleStartTest = async (difficulty) => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Prevent starting test if insufficient questions
    if (questionCounts[difficulty] < MINIMUM_QUESTIONS) {
      setError(`Not enough questions available for ${difficulty} difficulty. Please check back soon!`);
      return;
    }

    setIsLoading(true);
    setError(null);
    setSelectedDifficulty(difficulty);

    try {
      const response = await api.post('/quiz/start/', {
        difficulty: difficulty,
      });

      // Check if questions are available
      if (!response.data.questions || response.data.questions.length === 0) {
        setEmptyStates(prev => ({ ...prev, [difficulty]: true }));
        setError(`No questions available for ${difficulty} difficulty right now. Please try another difficulty or come back later.`);
        setSelectedDifficulty(null);
        return;
      }

      const testId = response.data.id;
      // Navigate to quiz page with test ID
      navigate(`/quiz/test/${testId}`, { state: { testData: response.data } });
    } catch (err) {
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Failed to start test. Please try again.';
      setError(errorMessage);
      setSelectedDifficulty(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="quiz-start-container">
      <div className="quiz-start-content">
        <div className="quiz-header">
          <h1>📝 Quiz Challenge</h1>
          <p className="user-greeting">Welcome, {user?.email}!</p>
        </div>

        <div className="quiz-info">
          <h2>Select Difficulty Level</h2>
          <p className="info-text">
            Choose your challenge level. You'll be given 15 random questions.
          </p>
        </div>

        {/* Active Test Resume Banner */}
        {!checkingActiveTest && activeTest && (
          <div className="active-test-banner">
            <div className="banner-content">
              <span className="banner-icon">▶️</span>
              <div className="banner-text">
                <strong>Active Test In Progress</strong>
                <p>{activeTest.difficulty.charAt(0).toUpperCase() + activeTest.difficulty.slice(1)} difficulty • Question {activeTest.current_question || 1} of 15</p>
              </div>
            </div>
            <button className="resume-button" onClick={handleResumeTest}>Resume</button>
          </div>
        )}

        {error && (
          <div className="error-banner">
            <div className="error-content">
              <span className="error-icon">⚠️</span>
              <span>{error}</span>
            </div>
            {!Object.values(emptyStates).some(state => state === true) && (
              <button className="retry-button" onClick={() => { setError(null); setSelectedDifficulty(null); }}>Retry</button>
            )}
          </div>
        )}

        {Object.values(emptyStates).some(state => state === true) && (
          <div className="admin-info-note">
            <span className="info-icon">ℹ️</span>
            <div className="info-content">
              <strong>Content Coming Soon</strong>
              <p>More questions will be added soon to complete the available difficulty levels. Check back later!</p>
            </div>
          </div>
        )}

        <div className="difficulty-grid">
          {difficulties.map((diff) => (
            <div
              key={diff.level}
              className={`difficulty-card ${selectedDifficulty === diff.level ? 'selected' : ''} ${emptyStates[diff.level] ? 'disabled' : ''}`}
              onClick={() => !emptyStates[diff.level] && handleStartTest(diff.level)}
              style={{ cursor: (isLoading || emptyStates[diff.level]) ? 'not-allowed' : 'pointer', opacity: (isLoading || emptyStates[diff.level]) && selectedDifficulty !== diff.level ? 0.5 : 1 }}
              title={emptyStates[diff.level] ? 'Coming soon' : ''}
            >
              {emptyStates[diff.level] && (
                <div className="coming-soon-badge">Coming Soon</div>
              )}
              <div className="difficulty-icon" style={{ opacity: emptyStates[diff.level] ? 0.5 : 1 }}>
                {diff.icon}
              </div>
              <h3>{diff.label}</h3>
              <p>{diff.description}</p>
              {emptyStates[diff.level] ? (
                <div className="empty-state-badge">
                  <span>{questionCounts[diff.level]} / {MINIMUM_QUESTIONS} questions</span>
                </div>
              ) : (
                <div className="difficulty-points">
                  <span className="points-badge">+{diff.pointsPerQuestion} pts per question</span>
                </div>
              )}
              {isLoading && selectedDifficulty === diff.level && (
                <div className="loading-spinner">Loading...</div>
              )}
            </div>
          ))}
        </div>

        <div className="quiz-details">
          <div className="detail-item">
            <span className="detail-label">📊 Total Questions:</span>
            <span className="detail-value">15</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">⏱️ Time per Question:</span>
            <span className="detail-value">30 seconds (auto-advance)</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">⛔ Unanswered Questions:</span>
            <span className="detail-value">Marked automatically on timeout</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .quiz-start-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        }

        .quiz-start-content {
          background: white;
          border-radius: 16px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
          padding: 40px;
          max-width: 900px;
          width: 100%;
        }

        .quiz-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .quiz-header h1 {
          margin: 0 0 10px 0;
          font-size: 36px;
          color: #333;
        }

        .user-greeting {
          margin: 0;
          color: #666;
          font-size: 14px;
        }

        .quiz-info {
          text-align: center;
          margin-bottom: 30px;
        }

        .quiz-info h2 {
          margin: 0 0 10px 0;
          font-size: 24px;
          color: #333;
        }

        .info-text {
          margin: 0;
          color: #666;
          font-size: 14px;
        }

        .active-test-banner {
          background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
          border: 2px solid #4caf50;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .banner-content {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
        }

        .banner-icon {
          font-size: 24px;
        }

        .banner-text {
          text-align: left;
        }

        .banner-text strong {
          display: block;
          color: #2e7d32;
          font-size: 14px;
        }

        .banner-text p {
          margin: 4px 0 0 0;
          color: #558b2f;
          font-size: 12px;
        }

        .resume-button {
          background: #4caf50;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          transition: background 0.2s ease;
        }

        .resume-button:hover {
          background: #45a049;
        }

        .error-banner {
          background-color: #fee;
          border: 1px solid #fcc;
          border-radius: 8px;
          padding: 12px 16px;
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: #c00;
        }

        .error-content {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
        }

        .error-icon {
          font-size: 20px;
        }

        .retry-button {
          background: #667eea;
          color: white;
          border: none;
          padding: 6px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          transition: background 0.2s ease;
        }

        .retry-button:hover {
          background: #764ba2;
        }

        .difficulty-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 40px;
        }

        .difficulty-card {
          padding: 30px;
          border: 2px solid #e0e0e0;
          border-radius: 12px;
          text-align: center;
          transition: all 0.3s ease;
          background: white;
          position: relative;
          overflow: hidden;
        }

        .difficulty-card:hover:not(.disabled) {
          border-color: #667eea;
          box-shadow: 0 4px 16px rgba(102, 126, 234, 0.2);
          transform: translateY(-4px);
        }

        .difficulty-card.selected {
          border-color: #667eea;
          background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
          box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
        }

        .difficulty-card.disabled {
          opacity: 0.6;
          border-color: #ddd;
          background: #f9f9f9;
        }

        .difficulty-icon {
          font-size: 48px;
          margin-bottom: 15px;
        }

        .difficulty-card h3 {
          margin: 0 0 10px 0;
          font-size: 20px;
          color: #333;
        }

        .difficulty-card p {
          margin: 0 0 20px 0;
          color: #666;
          font-size: 14px;
        }

        .difficulty-points {
          margin-top: 15px;
        }

        .points-badge {
          display: inline-block;
          background: #667eea;
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }

        .empty-state-badge {
          display: inline-block;
          background: #f0f0f0;
          color: #999;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }

        .loading-spinner {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(102, 126, 234, 0.9);
          color: white;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 12px;
          z-index: 10;
        }

        .quiz-details {
          background: #f5f5f5;
          border-radius: 12px;
          padding: 24px;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
        }

        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .detail-label {
          color: #666;
          font-size: 14px;
          font-weight: 500;
        }

        .detail-value {
          color: #333;
          font-size: 16px;
          font-weight: 600;
        }

        @media (max-width: 600px) {
          .quiz-start-content {
            padding: 20px;
          }

          .quiz-header h1 {
            font-size: 28px;
          }

          .difficulty-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default QuizStart;

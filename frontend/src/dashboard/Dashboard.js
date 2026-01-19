import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { AuthContext } from '../context/AuthContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [testHistory, setTestHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user profile
        const profileResponse = await api.get('/auth/profile/');
        setProfile(profileResponse.data);

        // Fetch test history
        const historyResponse = await api.get('/quiz/history/');
        setTestHistory(historyResponse.data);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleStartQuiz = () => {
    navigate('/quiz');
  };

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
      }}>
        <div>
          <div style={{
            border: '4px solid #e0e0e0',
            borderTop: '4px solid #667eea',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px',
          }}></div>
          <p style={{ color: '#666' }}>Loading dashboard...</p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>📚 Quiz Dashboard</h1>
          <p className="user-email">Welcome, {user?.email}!</p>
        </div>
        <button className="logout-btn" onClick={logout}>
          Logout
        </button>
      </div>

      <div className="dashboard-content">
        {/* Navigation Cards Section */}
        <div className="section">
          <div className="section-title">Quick Actions</div>
          <div className="quick-actions-grid">
            <div className="action-card" onClick={handleStartQuiz}>
              <div className="action-icon">📝</div>
              <h3>Start Quiz</h3>
              <p>Take a new quiz</p>
            </div>
            <div className="action-card" onClick={() => navigate('/profile')}>
              <div className="action-icon">👤</div>
              <h3>My Profile</h3>
              <p>View & edit profile</p>
            </div>
            <div className="action-card" onClick={() => navigate('/rewards')}>
              <div className="action-icon">🏆</div>
              <h3>Rewards</h3>
              <p>Check your badges</p>
            </div>
            <div className="action-card" onClick={() => navigate('/friends')}>
              <div className="action-icon">👥</div>
              <h3>Friends</h3>
              <p>Manage friends</p>
            </div>
            <div className="action-card" onClick={() => navigate('/chat')}>
              <div className="action-icon">💬</div>
              <h3>Chat</h3>
              <p>Message friends</p>
            </div>
          </div>
        </div>

        {/* Start Quiz Section */}
        <div className="section">
          <div className="section-title">Ready to Test Your Knowledge?</div>
          <div className="start-quiz-card" onClick={handleStartQuiz}>
            <div className="quiz-icon">📝</div>
            <h3>Start New Quiz</h3>
            <p>Choose a difficulty level and challenge yourself with 15 questions</p>
            <button className="btn-primary">Start Quiz →</button>
          </div>
        </div>

        {/* Profile Stats Section */}
        {profile && (
          <div className="section">
            <div className="section-title">Your Profile</div>
            <div className="profile-grid">
              <div className="stat-card">
                <span className="stat-icon">⭐</span>
                <span className="stat-label">Total Points</span>
                <span className="stat-value">{profile.total_points}</span>
              </div>
              <div className="stat-card">
                <span className="stat-icon">✅</span>
                <span className="stat-label">Tests Completed</span>
                <span className="stat-value">{testHistory.length}</span>
              </div>
              <div className="stat-card">
                <span className="stat-icon">🎯</span>
                <span className="stat-label">Avg Score</span>
                <span className="stat-value">
                  {testHistory.length > 0
                    ? (testHistory.reduce((sum, test) => sum + test.percentage, 0) / testHistory.length).toFixed(1)
                    : '--'}
                  %
                </span>
              </div>
              <div className="stat-card">
                <span className="stat-icon">🏆</span>
                <span className="stat-label">Best Difficulty</span>
                <span className="stat-value">
                  {testHistory.length > 0
                    ? testHistory.reduce((prev, current) => {
                      const difficultyOrder = { easy: 1, medium: 2, hard: 3 };
                      return difficultyOrder[current.difficulty] > difficultyOrder[prev.difficulty] ? current : prev;
                    }).difficulty_display || '--'
                    : '--'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Recent Tests Section */}
        {testHistory.length > 0 && (
          <div className="section">
            <div className="section-title">Recent Test History</div>
            <div className="tests-table">
              <div className="table-header">
                <div className="col">Date</div>
                <div className="col">Difficulty</div>
                <div className="col">Score</div>
                <div className="col">Percentage</div>
              </div>
              {testHistory.slice(0, 5).map((test) => (
                <div key={test.id} className="table-row">
                  <div className="col">
                    {new Date(test.started_at).toLocaleDateString()}
                  </div>
                  <div className="col">
                    <span className={`difficulty-badge ${test.difficulty}`}>
                      {test.difficulty_display}
                    </span>
                  </div>
                  <div className="col">
                    {test.total_score}/{test.max_score}
                  </div>
                  <div className="col">
                    <span className="percentage-badge">{test.percentage.toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .dashboard-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .dashboard-header {
          background: rgba(0, 0, 0, 0.1);
          color: white;
          padding: 30px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .header-content h1 {
          margin: 0 0 5px 0;
          font-size: 28px;
        }

        .user-email {
          margin: 0;
          font-size: 14px;
          opacity: 0.9;
        }

        .logout-btn {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.3);
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .logout-btn:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .dashboard-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 20px;
        }

        .section {
          margin-bottom: 40px;
        }

        .section-title {
          font-size: 20px;
          font-weight: 600;
          color: white;
          margin-bottom: 20px;
          padding-left: 10px;
          border-left: 4px solid white;
        }

        .start-quiz-card {
          background: white;
          border-radius: 12px;
          padding: 40px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        }

        .start-quiz-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        }

        .quiz-icon {
          font-size: 64px;
          margin-bottom: 20px;
        }

        .start-quiz-card h3 {
          margin: 0 0 10px 0;
          font-size: 24px;
          color: #333;
        }

        .start-quiz-card p {
          margin: 0 0 20px 0;
          color: #666;
          font-size: 14px;
        }

        .btn-primary {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          border: none;
          padding: 12px 30px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 16px;
          transition: all 0.3s ease;
        }

        .btn-primary:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .profile-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
        }

        .quick-actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 20px;
        }

        .action-card {
          background: white;
          border-radius: 12px;
          padding: 30px 20px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .action-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
        }

        .action-icon {
          font-size: 40px;
          margin-bottom: 15px;
        }

        .action-card h3 {
          margin: 0 0 8px 0;
          font-size: 18px;
          color: #333;
        }

        .action-card p {
          margin: 0;
          font-size: 13px;
          color: #999;
        }

        .stat-card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          text-align: center;
          display: flex;
          flex-direction: column;
          gap: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .stat-icon {
          font-size: 32px;
        }

        .stat-label {
          color: #666;
          font-size: 13px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .stat-value {
          color: #333;
          font-size: 24px;
          font-weight: bold;
        }

        .tests-table {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .table-header {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 1fr;
          gap: 20px;
          background: #f5f5f5;
          padding: 16px;
          font-weight: 600;
          color: #333;
          border-bottom: 2px solid #e0e0e0;
        }

        .table-row {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 1fr;
          gap: 20px;
          padding: 16px;
          border-bottom: 1px solid #e0e0e0;
          align-items: center;
        }

        .table-row:last-child {
          border-bottom: none;
        }

        .col {
          color: #333;
          font-size: 14px;
        }

        .difficulty-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .difficulty-badge.easy {
          background: #e8f5e9;
          color: #2e7d32;
        }

        .difficulty-badge.medium {
          background: #fff3e0;
          color: #e65100;
        }

        .difficulty-badge.hard {
          background: #ffebee;
          color: #c62828;
        }

        .percentage-badge {
          display: inline-block;
          background: #667eea;
          color: white;
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
        }

        @media (max-width: 600px) {
          .dashboard-header {
            flex-direction: column;
            gap: 15px;
            align-items: flex-start;
          }

          .start-quiz-card {
            padding: 20px;
          }

          .tests-table {
            overflow-x: auto;
          }

          .table-header,
          .table-row {
            min-width: 500px;
          }
        }
      `}</style>
    </div>
  );
}

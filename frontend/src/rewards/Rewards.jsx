import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

const Rewards = () => {
  const navigate = useNavigate();
  const [rewards, setRewards] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRewards();
  }, []);

  const fetchRewards = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get('/rewards/');
      setRewards(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load rewards');
    } finally {
      setIsLoading(false);
    }
  };

  // Reward tiers with thresholds and icons
  const rewardTiers = [
    {
      id: 1,
      name: 'Bronze Badge',
      icon: '🥉',
      description: 'Beginner',
      pointsRequired: 0,
      color: '#CD7F32',
    },
    {
      id: 2,
      name: 'Silver Badge',
      icon: '🥈',
      description: 'Intermediate',
      pointsRequired: 100,
      color: '#C0C0C0',
    },
    {
      id: 3,
      name: 'Gold Badge',
      icon: '🥇',
      description: 'Advanced',
      pointsRequired: 250,
      color: '#FFD700',
    },
    {
      id: 4,
      name: 'Platinum Badge',
      icon: '💎',
      description: 'Expert',
      pointsRequired: 500,
      color: '#E5E4E2',
    },
    {
      id: 5,
      name: 'Diamond Badge',
      icon: '👑',
      description: 'Master',
      pointsRequired: 1000,
      color: '#71C7EC',
    },
  ];

  if (isLoading) {
    return (
      <div className="container">
        <div className="loading">Loading rewards...</div>
        <style jsx>{`
          .container {
            max-width: 1000px;
            margin: 0 auto;
            padding: 40px 20px;
          }
          .loading {
            text-align: center;
            font-size: 18px;
            color: #667eea;
            margin-top: 100px;
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={fetchRewards} className="retry-btn">
            Retry
          </button>
        </div>
        <style jsx>{`
          .container {
            max-width: 1000px;
            margin: 0 auto;
            padding: 40px 20px;
          }
          .error-banner {
            background: #fee;
            border: 1px solid #f99;
            color: #c33;
            padding: 15px 20px;
            border-radius: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
          }
          .retry-btn {
            background: #c33;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 600;
          }
          .retry-btn:hover {
            background: #a22;
          }
        `}</style>
      </div>
    );
  }

  const totalPoints = rewards?.total_points || 0;
  const earnedRewards = rewards?.earned_rewards || [];

  // Determine current tier
  const currentTier = rewardTiers.find(
    (tier) =>
      totalPoints >= tier.pointsRequired &&
      (rewardTiers[rewardTiers.indexOf(tier) + 1]?.pointsRequired === undefined ||
        totalPoints < rewardTiers[rewardTiers.indexOf(tier) + 1]?.pointsRequired)
  );

  // Find next tier
  const nextTier = rewardTiers.find(
    (tier) => tier.pointsRequired > totalPoints
  );

  const progressToNextTier = nextTier
    ? Math.min(
        ((totalPoints - currentTier.pointsRequired) /
          (nextTier.pointsRequired - currentTier.pointsRequired)) *
          100,
        100
      )
    : 100;

  return (
    <div className="container">
      {/* Header */}
      <div className="header">
        <h1>My Rewards</h1>
        <button onClick={() => navigate('/profile')} className="back-btn">
          ← Back to Profile
        </button>
      </div>

      {/* Total Points Card */}
      <div className="total-points-card">
        <div className="points-display">
          <div className="points-icon">⭐</div>
          <div className="points-info">
            <div className="points-value">{totalPoints}</div>
            <div className="points-label">Total Points Earned</div>
          </div>
        </div>
        <div className="current-tier">
          <div className="tier-label">Current Tier</div>
          <div className="tier-display">
            <span className="tier-icon">{currentTier.icon}</span>
            <span className="tier-name">{currentTier.name}</span>
          </div>
        </div>
      </div>

      {/* Progress to Next Tier */}
      {nextTier && (
        <div className="progress-section">
          <div className="progress-header">
            <span className="progress-label">Progress to {nextTier.name}</span>
            <span className="progress-points">
              {totalPoints} / {nextTier.pointsRequired} points
            </span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progressToNextTier}%` }}
            />
          </div>
          <div className="progress-text">
            {nextTier.pointsRequired - totalPoints} points to go!
          </div>
        </div>
      )}

      {/* Earned Rewards */}
      <section className="section">
        <h2>Earned Rewards 🏆</h2>

        {earnedRewards.length > 0 ? (
          <div className="rewards-grid">
            {earnedRewards.map((reward) => {
              const tier = rewardTiers.find((t) => t.id === reward.tier_id);
              return (
                <div key={reward.id} className="reward-card earned">
                  <div className="reward-icon">{tier.icon}</div>
                  <div className="reward-content">
                    <h3>{tier.name}</h3>
                    <p>{tier.description}</p>
                    <div className="reward-date">
                      Earned: {new Date(reward.earned_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="checkmark">✓</div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <p>No rewards earned yet. Start taking quizzes to earn badges!</p>
            <button onClick={() => navigate('/quiz')} className="btn btn-primary">
              Start Quiz 📝
            </button>
          </div>
        )}
      </section>

      {/* Locked Rewards */}
      <section className="section">
        <h2>Locked Rewards 🔒</h2>

        <div className="rewards-grid">
          {rewardTiers.map((tier) => {
            const isEarned = earnedRewards.some((r) => r.tier_id === tier.id);
            const isLocked = totalPoints < tier.pointsRequired;

            if (!isLocked) return null; // Skip already earned

            const pointsNeeded = tier.pointsRequired - totalPoints;

            return (
              <div key={tier.id} className="reward-card locked">
                <div className="reward-icon locked-icon">{tier.icon}</div>
                <div className="reward-content">
                  <h3>{tier.name}</h3>
                  <p>{tier.description}</p>
                  <div className="points-needed">
                    <span className="lock-icon">🔐</span>
                    <span>
                      Unlock in {pointsNeeded} points
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Achievement Statistics */}
      <section className="section">
        <h2>Achievement Statistics 📊</h2>

        <div className="stats-grid">
          <div className="stats-card">
            <div className="stats-icon">🎖️</div>
            <div className="stats-content">
              <div className="stats-value">{earnedRewards.length}</div>
              <div className="stats-label">Total Badges Earned</div>
            </div>
          </div>

          <div className="stats-card">
            <div className="stats-icon">🎯</div>
            <div className="stats-content">
              <div className="stats-value">
                {rewardTiers.length - earnedRewards.length}
              </div>
              <div className="stats-label">Badges to Unlock</div>
            </div>
          </div>

          <div className="stats-card">
            <div className="stats-icon">📈</div>
            <div className="stats-content">
              <div className="stats-value">
                {nextTier
                  ? Math.round(
                      ((totalPoints - currentTier.pointsRequired) /
                        (nextTier.pointsRequired - currentTier.pointsRequired)) *
                        100
                    )
                  : 100}
                %
              </div>
              <div className="stats-label">Progress to Next Badge</div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <div className="cta-section">
        <h3>Ready to earn more rewards?</h3>
        <button onClick={() => navigate('/quiz')} className="btn btn-primary">
          Start New Quiz 🚀
        </button>
      </div>

      <style jsx>{`
        .container {
          max-width: 1000px;
          margin: 0 auto;
          padding: 40px 20px;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 40px;
          flex-wrap: wrap;
          gap: 10px;
        }

        .header h1 {
          font-size: 36px;
          color: #333;
          margin: 0;
        }

        .back-btn {
          background: transparent;
          border: 2px solid #667eea;
          color: #667eea;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .back-btn:hover {
          background: #667eea;
          color: white;
        }

        .total-points-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 12px;
          padding: 35px;
          margin-bottom: 40px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        }

        .points-display {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .points-icon {
          font-size: 48px;
          line-height: 1;
        }

        .points-value {
          font-size: 42px;
          font-weight: 700;
          line-height: 1;
          margin: 0;
        }

        .points-label {
          font-size: 14px;
          opacity: 0.9;
          margin-top: 5px;
        }

        .current-tier {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: flex-end;
        }

        .tier-label {
          font-size: 12px;
          opacity: 0.8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
        }

        .tier-display {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .tier-icon {
          font-size: 36px;
        }

        .tier-name {
          font-size: 18px;
          font-weight: 700;
        }

        .progress-section {
          background: white;
          border-radius: 12px;
          padding: 25px;
          margin-bottom: 40px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .progress-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .progress-label {
          font-size: 14px;
          font-weight: 700;
          color: #333;
        }

        .progress-points {
          font-size: 13px;
          color: #999;
          font-weight: 600;
        }

        .progress-bar {
          width: 100%;
          height: 12px;
          background: #e0e0e0;
          border-radius: 6px;
          overflow: hidden;
          margin-bottom: 10px;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
          transition: width 0.5s ease;
        }

        .progress-text {
          font-size: 12px;
          color: #667eea;
          font-weight: 600;
        }

        .section {
          margin-bottom: 50px;
        }

        .section h2 {
          font-size: 24px;
          color: #333;
          margin: 0 0 25px 0;
          font-weight: 700;
        }

        .rewards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
        }

        .reward-card {
          background: white;
          border-radius: 12px;
          padding: 25px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
          position: relative;
          display: flex;
          flex-direction: column;
        }

        .reward-card.earned {
          border: 2px solid #667eea;
          background: linear-gradient(135deg, #f8f9ff 0%, #f0f2ff 100%);
        }

        .reward-card.earned:hover {
          transform: translateY(-4px);
          box-shadow: 0 4px 16px rgba(102, 126, 234, 0.2);
        }

        .reward-card.locked {
          opacity: 0.7;
          border: 2px dashed #ddd;
        }

        .reward-icon {
          font-size: 42px;
          margin-bottom: 15px;
          line-height: 1;
        }

        .reward-icon.locked-icon {
          opacity: 0.5;
        }

        .reward-content {
          flex: 1;
        }

        .reward-card h3 {
          font-size: 18px;
          color: #333;
          margin: 0 0 5px 0;
          font-weight: 700;
        }

        .reward-card p {
          font-size: 13px;
          color: #999;
          margin: 0 0 10px 0;
        }

        .reward-date {
          font-size: 12px;
          color: #667eea;
          font-weight: 600;
        }

        .points-needed {
          font-size: 13px;
          color: #667eea;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .lock-icon {
          font-size: 14px;
        }

        .checkmark {
          position: absolute;
          top: 10px;
          right: 10px;
          background: #3a3;
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 18px;
        }

        .empty-state {
          text-align: center;
          padding: 60px 40px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .empty-state p {
          font-size: 16px;
          color: #666;
          margin: 0 0 25px 0;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
        }

        .stats-card {
          background: white;
          border-radius: 12px;
          padding: 25px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          gap: 20px;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .stats-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 4px 16px rgba(102, 126, 234, 0.2);
        }

        .stats-icon {
          font-size: 36px;
        }

        .stats-content {
          flex: 1;
        }

        .stats-value {
          font-size: 28px;
          font-weight: 700;
          color: #667eea;
          margin: 0;
        }

        .stats-label {
          font-size: 13px;
          color: #999;
          margin: 4px 0 0 0;
          font-weight: 600;
        }

        .cta-section {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 12px;
          padding: 40px;
          text-align: center;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        }

        .cta-section h3 {
          font-size: 24px;
          margin: 0 0 20px 0;
        }

        .btn {
          padding: 14px 28px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          font-size: 15px;
          transition: all 0.3s ease;
        }

        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .cta-section .btn-primary {
          background: white;
          color: #667eea;
        }

        .cta-section .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        @media (max-width: 768px) {
          .container {
            padding: 20px 15px;
          }

          .header {
            flex-direction: column;
            align-items: flex-start;
          }

          .header h1 {
            font-size: 28px;
          }

          .total-points-card {
            grid-template-columns: 1fr;
            gap: 20px;
          }

          .current-tier {
            align-items: flex-start;
          }

          .rewards-grid {
            grid-template-columns: 1fr;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .section h2 {
            font-size: 20px;
          }

          .cta-section {
            padding: 30px 20px;
          }

          .cta-section h3 {
            font-size: 20px;
          }
        }
      `}</style>
    </div>
  );
};

export default Rewards;

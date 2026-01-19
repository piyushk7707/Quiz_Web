import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api/client';
import './Profile.css';

/**
 * Profile Component
 * 
 * Displays user profile information with:
 * - Loading state while fetching data
 * - Error state with retry option
 * - User information display
 * - Edit profile link
 * - Statistics and achievements
 */
export default function Profile() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch user profile data
  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Mock API response - Replace with actual API call
      // const response = await api.get('/accounts/profile/');
      
      // Simulated profile data
      const profileData = {
        id: user?.id || 1,
        username: user?.username || 'user@example.com',
        email: user?.email || 'user@example.com',
        first_name: user?.first_name || 'John',
        last_name: user?.last_name || 'Doe',
        bio: 'Quiz enthusiast and lifelong learner',
        avatar: '👤',
        joined_date: '2026-01-01',
        total_quizzes_taken: 15,
        total_score: 1250,
        average_accuracy: 82,
        friends_count: 8,
        badges: ['🏆 Quiz Master', '⭐ Top Scorer', '🎯 Consistent'],
      };
      
      setProfileData(profileData);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="profile-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="profile-container">
        <div className="error-state">
          <h2>⚠️ Error Loading Profile</h2>
          <p>{error}</p>
          <div className="error-actions">
            <button onClick={fetchProfileData} className="btn btn-primary">
              ↻ Retry
            </button>
            <button onClick={() => navigate('/dashboard')} className="btn btn-secondary">
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Profile not found
  if (!profileData) {
    return (
      <div className="profile-container">
        <div className="error-state">
          <h2>Profile Not Found</h2>
          <p>We couldn't find your profile data.</p>
          <button onClick={() => navigate('/dashboard')} className="btn btn-primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Profile display
  return (
    <div className="profile-container">
      {/* Header */}
      <div className="profile-header">
        <div className="profile-banner"></div>
        <div className="profile-info-section">
          <div className="profile-avatar">{profileData.avatar}</div>
          <div className="profile-header-content">
            <h1 className="profile-name">
              {profileData.first_name} {profileData.last_name}
            </h1>
            <p className="profile-username">@{profileData.username}</p>
            <p className="profile-email">{profileData.email}</p>
            {profileData.bio && <p className="profile-bio">{profileData.bio}</p>}
            <p className="profile-joined">Joined {profileData.joined_date}</p>
          </div>
          <button
            onClick={() => navigate('/profile/edit')}
            className="btn btn-edit"
          >
            ✏️ Edit Profile
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="profile-stats">
        <div className="stat-card">
          <p className="stat-label">Quizzes Taken</p>
          <p className="stat-value">{profileData.total_quizzes_taken}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Total Score</p>
          <p className="stat-value">{profileData.total_score}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Average Accuracy</p>
          <p className="stat-value">{profileData.average_accuracy}%</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Friends</p>
          <p className="stat-value">{profileData.friends_count}</p>
        </div>
      </div>

      {/* Badges Section */}
      <div className="profile-section">
        <h2 className="section-title">🏅 Badges & Achievements</h2>
        <div className="badges-grid">
          {profileData.badges && profileData.badges.length > 0 ? (
            profileData.badges.map((badge, index) => (
              <div key={index} className="badge-item">
                {badge}
              </div>
            ))
          ) : (
            <p className="empty-message">No badges earned yet</p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="profile-actions">
        <button
          onClick={() => navigate('/quiz')}
          className="btn btn-primary btn-large"
        >
          📝 Start Quiz
        </button>
        <button
          onClick={() => navigate('/rewards')}
          className="btn btn-secondary btn-large"
        >
          🎁 View Rewards
        </button>
        <button
          onClick={() => navigate('/friends')}
          className="btn btn-secondary btn-large"
        >
          👥 Friends
        </button>
      </div>
    </div>
  );
}

import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../api/client";

const Profile = () => {
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/accounts/profile/");
      setProfile(res.data);
    } catch (err) {
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true);
      await api.delete("/accounts/profile/");
      // Clear all stored data
      localStorage.clear();
      sessionStorage.clear();
      // Redirect to login
      window.location.href = '/login';
    } catch (err) {
      setError("Failed to delete account. Please try again.");
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return <p style={{ textAlign: "center", marginTop: 100 }}>Loading profile…</p>;
  }

  if (error) {
    return (
      <div style={{ textAlign: "center", marginTop: 100 }}>
        <p>{error}</p>
        <button onClick={fetchProfile}>Retry</button>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="profile-container">
      {/* HEADER */}
      <div className="profile-header">
        <h1>My Profile</h1>
        <button onClick={() => navigate("/profile/edit")} className="edit-btn">
          Edit Profile
        </button>
      </div>

      {/* PROFILE CARD */}
      <div className="profile-card">
        <div className="profile-photo">
          {profile.profile_photo ? (
            <img src={profile.profile_photo} alt="Profile" />
          ) : (
            <div className="placeholder">
              {profile.username?.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="profile-info">
          <h2>{profile.username}</h2>
          <p>{profile.email}</p>
          <p className="bio">{profile.bio || "No bio added yet"}</p>
        </div>
      </div>

      {/* STATS */}
      <div className="stats-grid">
        <div className="stat">
          <span>{profile.total_points || 0}</span>
          <label>Total Points</label>
        </div>
        <div className="stat">
          <span>{profile.tests_attempted || 0}</span>
          <label>Tests Attempted</label>
        </div>
        <div className="stat">
          <span>{profile.correct_answers || 0}</span>
          <label>Correct Answers</label>
        </div>
        <div className="stat">
          <span>{profile.accuracy_percentage || 0}%</span>
          <label>Accuracy</label>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="actions">
        <button onClick={() => navigate("/quiz")}>Start Quiz</button>
        <button onClick={() => navigate("/rewards")}>View Rewards</button>
        <button onClick={handleLogout} className="logout">
          Logout
        </button>
      </div>

      {/* DANGER ZONE */}
      <div className="danger-zone">
        <h3>⚠️ Danger Zone</h3>
        <p>Once you delete your account, there is no going back. Please be certain.</p>
        <button
          className="delete-account-btn"
          onClick={() => setShowDeleteModal(true)}
        >
          🗑️ Delete Account
        </button>
      </div>

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>⚠️ Delete Account?</h3>
            <p>This action is <strong>permanent</strong> and cannot be undone. All your data including:</p>
            <ul>
              <li>Profile information</li>
              <li>Quiz history and scores</li>
              <li>Friends and messages</li>
              <li>Rewards and achievements</li>
            </ul>
            <p>will be permanently deleted.</p>
            <div className="modal-actions">
              <button
                className="cancel-btn"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                className="confirm-delete-btn"
                onClick={handleDeleteAccount}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete My Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BASIC STYLES */}
      <style>{`
        .profile-container {
          max-width: 900px;
          margin: 40px auto;
          padding: 20px;
        }
        .profile-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .edit-btn {
          padding: 10px 18px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
        }
        .profile-card {
          background: white;
          border-radius: 12px;
          padding: 30px;
          display: flex;
          gap: 30px;
          align-items: center;
          margin-top: 30px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .profile-photo img {
          width: 120px;
          height: 120px;
          border-radius: 12px;
          object-fit: cover;
        }
        .placeholder {
          width: 120px;
          height: 120px;
          border-radius: 12px;
          background: linear-gradient(135deg,#667eea,#764ba2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 48px;
          color: white;
          font-weight: bold;
        }
        .profile-info h2 {
          margin: 0;
        }
        .bio {
          margin-top: 10px;
          color: #555;
        }
        .stats-grid {
          margin-top: 40px;
          display: grid;
          grid-template-columns: repeat(auto-fit,minmax(180px,1fr));
          gap: 20px;
        }
        .stat {
          background: white;
          border-radius: 10px;
          padding: 20px;
          text-align: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .stat span {
          font-size: 28px;
          font-weight: bold;
          color: #667eea;
        }
        .stat label {
          display: block;
          margin-top: 6px;
          color: #777;
          font-size: 14px;
        }
        .actions {
          margin-top: 40px;
          display: flex;
          gap: 15px;
          flex-wrap: wrap;
          justify-content: center;
        }
        .actions button {
          padding: 12px 24px;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          font-weight: 600;
        }
        .logout {
          background: #fee;
          color: #c33;
          border: 2px solid #f99;
        }

        /* DANGER ZONE */
        .danger-zone {
          margin-top: 50px;
          padding: 25px;
          background: var(--bg-secondary, #fff5f5);
          border: 2px solid #fca5a5;
          border-radius: 12px;
          text-align: center;
        }

        .danger-zone h3 {
          margin: 0 0 10px 0;
          color: #dc2626;
          font-size: 18px;
        }

        .danger-zone p {
          margin: 0 0 20px 0;
          color: var(--text-secondary, #666);
          font-size: 14px;
        }

        .delete-account-btn {
          padding: 12px 24px;
          background: #dc2626;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.2s ease;
        }

        .delete-account-btn:hover {
          background: #b91c1c;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
        }

        /* MODAL */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          padding: 20px;
        }

        .modal {
          background: var(--bg-secondary, white);
          border-radius: 16px;
          padding: 30px;
          max-width: 450px;
          width: 100%;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .modal h3 {
          margin: 0 0 16px 0;
          color: #dc2626;
          font-size: 20px;
        }

        .modal p {
          color: var(--text-secondary, #555);
          font-size: 14px;
          line-height: 1.6;
          margin: 0 0 10px 0;
        }

        .modal ul {
          margin: 10px 0 16px 0;
          padding-left: 24px;
          color: var(--text-secondary, #666);
          font-size: 14px;
        }

        .modal li {
          margin: 6px 0;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          margin-top: 24px;
        }

        .cancel-btn {
          flex: 1;
          padding: 12px 20px;
          background: var(--bg-tertiary, #f3f4f6);
          color: var(--text-primary, #374151);
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
          transition: background 0.2s ease;
        }

        .cancel-btn:hover:not(:disabled) {
          background: #e5e7eb;
        }

        .confirm-delete-btn {
          flex: 1;
          padding: 12px 20px;
          background: #dc2626;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.2s ease;
        }

        .confirm-delete-btn:hover:not(:disabled) {
          background: #b91c1c;
        }

        .confirm-delete-btn:disabled,
        .cancel-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default Profile;

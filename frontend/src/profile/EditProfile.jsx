import React, { useState, useEffect, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../api/client";

const EditProfile = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    bio: "",
    profile_photo: null,
  });

  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isHoveringPhoto, setIsHoveringPhoto] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get("/accounts/profile/");
      setFormData({
        username: res.data.username || "",
        email: res.data.email || "",
        bio: res.data.bio || "",
        profile_photo: null,
      });
      setPreview(res.data.profile_photo || null);
    } catch {
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
    if (error) setError(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB");
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError("Please select an image file");
      return;
    }

    setFormData((p) => ({ ...p, profile_photo: file }));
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      setSaving(true);
      const data = new FormData();
      data.append("username", formData.username);
      data.append("email", formData.email);
      data.append("bio", formData.bio || "");

      if (formData.profile_photo) {
        data.append("profile_photo", formData.profile_photo);
      }

      await api.patch("/accounts/profile/", data);

      setSuccess(true);
      setTimeout(() => navigate("/profile"), 1200);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Failed to update profile"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading profile...</p>
        <style>{`
          .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 400px;
            color: #667eea;
          }
          .spinner {
            width: 40px;
            height: 40px;
            border: 3px solid #e0e0e0;
            border-top-color: #667eea;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin-bottom: 16px;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header">
        <h1>Edit Profile</h1>
        <button type="button" onClick={() => navigate("/profile")} className="back-btn">
          ← Back to Profile
        </button>
      </div>

      {error && (
        <div className="message error">
          <span>⚠️</span>
          <span>{error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {success && (
        <div className="message success">
          <span>✅</span>
          <span>Profile updated successfully! Redirecting...</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* PHOTO UPLOAD */}
        <div className="photo-section">
          <div
            className={`photo ${isHoveringPhoto ? 'hovering' : ''}`}
            onClick={() => fileInputRef.current.click()}
            onMouseEnter={() => setIsHoveringPhoto(true)}
            onMouseLeave={() => setIsHoveringPhoto(false)}
          >
            {preview ? (
              <img src={preview} alt="preview" />
            ) : (
              <div className="placeholder">
                {(formData.username || user?.username || "U")[0].toUpperCase()}
              </div>
            )}
            <div className="photo-overlay">
              <span>📷</span>
              <span>Change Photo</span>
            </div>
          </div>
          <p className="photo-hint">📷 Click the photo above to change it</p>
          <p className="photo-subhint">Max size: 5MB • JPG, PNG, GIF</p>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          hidden
          accept="image/*"
          onChange={handleFileChange}
        />

        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Username"
            required
            disabled={saving}
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email"
            required
            disabled={saving}
          />
        </div>

        <div className="form-group">
          <label htmlFor="bio">Bio</label>
          <textarea
            id="bio"
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            placeholder="Tell us about yourself..."
            rows={4}
            disabled={saving}
          />
        </div>

        <div className="button-group">
          <button type="submit" disabled={saving} className="save-btn">
            {saving ? (
              <>
                <span className="btn-spinner"></span>
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>

          <button type="button" onClick={() => navigate("/profile")} className="cancel-btn" disabled={saving}>
            Cancel
          </button>
        </div>
      </form>

      <style>{`
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 40px 20px;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .header h1 {
          margin: 0;
          font-size: 28px;
          color: #333;
        }

        .back-btn {
          background: transparent;
          border: 2px solid #667eea;
          color: #667eea;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.2s;
        }

        .back-btn:hover {
          background: #667eea;
          color: white;
        }

        .message {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 16px;
          border-radius: 8px;
          margin-bottom: 20px;
          font-size: 14px;
        }

        .message.error {
          background: #fee2e2;
          border: 1px solid #fecaca;
          color: #dc2626;
        }

        .message.success {
          background: #dcfce7;
          border: 1px solid #bbf7d0;
          color: #16a34a;
        }

        .message span:nth-child(2) {
          flex: 1;
        }

        .message button {
          background: none;
          border: none;
          font-size: 18px;
          cursor: pointer;
          color: inherit;
          padding: 0;
        }

        .photo-section {
          text-align: center;
          margin-bottom: 30px;
        }

        .photo {
          width: 140px;
          height: 140px;
          border-radius: 16px;
          cursor: pointer;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
          overflow: hidden;
          position: relative;
          transition: transform 0.2s, box-shadow 0.2s;
          border: 4px solid transparent;
        }

        .photo:hover {
          transform: scale(1.05);
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
          border-color: #667eea;
        }

        .photo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .placeholder {
          font-size: 56px;
          font-weight: bold;
        }

        .photo-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.2s;
          color: white;
          gap: 4px;
        }

        .photo-overlay span:first-child {
          font-size: 28px;
        }

        .photo-overlay span:last-child {
          font-size: 12px;
          font-weight: 600;
        }

        .photo.hovering .photo-overlay,
        .photo:hover .photo-overlay {
          opacity: 1;
        }

        .photo-hint {
          color: #667eea;
          font-size: 14px;
          font-weight: 600;
          margin: 0 0 4px 0;
        }

        .photo-subhint {
          color: #999;
          font-size: 12px;
          margin: 0;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 6px;
        }

        input, textarea {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 15px;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
        }

        input:focus, textarea:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        input:disabled, textarea:disabled {
          background: #f9fafb;
          color: #9ca3af;
        }

        textarea {
          resize: vertical;
          min-height: 100px;
        }

        .button-group {
          display: flex;
          gap: 12px;
          margin-top: 30px;
        }

        .save-btn {
          flex: 2;
          padding: 14px 24px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .save-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .save-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .cancel-btn {
          flex: 1;
          padding: 14px 24px;
          background: #f3f4f6;
          color: #374151;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 600;
          transition: background 0.2s;
        }

        .cancel-btn:hover:not(:disabled) {
          background: #e5e7eb;
        }

        .cancel-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 500px) {
          .container {
            padding: 20px 16px;
          }

          .header {
            flex-direction: column;
            align-items: flex-start;
          }

          .button-group {
            flex-direction: column;
          }

          .save-btn, .cancel-btn {
            flex: none;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default EditProfile;

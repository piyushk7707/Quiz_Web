import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Load remembered email on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setFormData(prev => ({ ...prev, email: savedEmail }));
      setRememberMe(true);
    }
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post('/auth/login/', formData);
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);

      // Handle remember me
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', formData.email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Login error:', error);
      let errorMsg = 'Login failed. Please try again.';

      if (error.response) {
        const data = error.response.data;
        if (typeof data === 'string') {
          errorMsg = data;
        } else if (data.detail) {
          errorMsg = data.detail;
        } else if (data.non_field_errors) {
          errorMsg = data.non_field_errors.join(' ');
        } else if (data.email) {
          errorMsg = `Email: ${data.email.join(' ')}`;
        } else if (data.password) {
          errorMsg = `Password: ${data.password.join(' ')}`;
        } else {
          errorMsg = 'Invalid email or password.';
        }
      } else if (error.request) {
        errorMsg = 'Network error: Unable to connect to the server. Please ensure the backend is running at http://localhost:8000';
      } else {
        errorMsg = error.message;
      }

      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>Login</h2>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
          <button className="error-close" onClick={() => setError(null)}>×</button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <input
            type="email"
            id="email"
            name="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <div className="password-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        <div className="remember-me">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <span className="checkmark"></span>
            Remember me
          </label>
        </div>

        <button type="submit" disabled={isLoading} className="submit-btn">
          {isLoading ? (
            <>
              <span className="spinner"></span>
              Logging in...
            </>
          ) : (
            'Login'
          )}
        </button>
      </form>

      <div className="auth-links">
        <Link to="/forgot-password" className="forgot-link">Forgot Password?</Link>
        <p>
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </div>

      <style>{`
        .auth-container {
          max-width: 420px;
          margin: 60px auto;
          padding: 40px;
          background: var(--bg-secondary, white);
          border-radius: 16px;
          box-shadow: 0 10px 40px var(--shadow-color, rgba(0, 0, 0, 0.1));
        }

        .auth-container h2 {
          text-align: center;
          margin: 0 0 30px 0;
          font-size: 28px;
          color: var(--text-primary, #333);
        }

        .error-message {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          background: var(--error-bg, #fee2e2);
          border: 1px solid #fecaca;
          border-radius: 8px;
          color: var(--error-text, #dc2626);
          margin-bottom: 20px;
          font-size: 14px;
        }

        .error-icon {
          flex-shrink: 0;
        }

        .error-message span:nth-child(2) {
          flex: 1;
        }

        .error-close {
          background: none;
          border: none;
          color: var(--error-text, #dc2626);
          font-size: 20px;
          cursor: pointer;
          padding: 0;
          line-height: 1;
        }

        .auth-container form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-group label {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary, #374151);
        }

        .auth-container input[type="email"],
        .auth-container input[type="text"],
        .auth-container input[type="password"] {
          padding: 12px 16px;
          border: 2px solid var(--border-color, #e5e7eb);
          border-radius: 8px;
          font-size: 15px;
          transition: border-color 0.2s, box-shadow 0.2s;
          background: var(--bg-tertiary, white);
          color: var(--text-primary, #333);
        }

        .auth-container input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .auth-container input:disabled {
          background: var(--bg-tertiary, #f9fafb);
          color: var(--text-muted, #9ca3af);
        }

        .password-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .password-wrapper input {
          width: 100%;
          padding-right: 50px;
        }

        .password-toggle {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 18px;
          padding: 4px;
          opacity: 0.7;
          transition: opacity 0.2s;
        }

        .password-toggle:hover {
          opacity: 1;
        }

        .remember-me {
          display: flex;
          align-items: center;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          font-size: 14px;
          color: var(--text-secondary, #6b7280);
          user-select: none;
        }

        .checkbox-label input[type="checkbox"] {
          width: 18px;
          height: 18px;
          cursor: pointer;
          accent-color: #667eea;
        }

        .submit-btn {
          padding: 14px;
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

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .auth-links {
          margin-top: 24px;
          text-align: center;
        }

        .forgot-link {
          color: #667eea;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
        }

        .forgot-link:hover {
          text-decoration: underline;
        }

        .auth-links p {
          margin-top: 16px;
          color: var(--text-secondary, #6b7280);
          font-size: 14px;
        }

        .auth-links a {
          color: #667eea;
          text-decoration: none;
          font-weight: 600;
        }

        .auth-links a:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}

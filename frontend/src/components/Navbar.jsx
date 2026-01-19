import React, { useContext, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import NotificationBell from './NotificationBell';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { isDarkMode, toggleDarkMode } = useContext(ThemeContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/quiz', label: 'Quiz', icon: '📝' },
    { path: '/profile', label: 'Profile', icon: '👤' },
    { path: '/friends', label: 'Friends', icon: '👥' },
    { path: '/chat', label: 'Chat', icon: '💬' },
    { path: '/rewards', label: 'Rewards', icon: '🏆' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">
          <Link to="/dashboard" className="navbar-brand">
            <span className="brand-icon">📚</span>
            <span className="brand-text">Quiz Platform</span>
          </Link>

          <div className={`navbar-menu ${isMobileMenuOpen ? 'open' : ''}`}>
            <div className="nav-links">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </Link>
              ))}
            </div>

            <div className="nav-user">
              {/* Notifications */}
              <NotificationBell />

              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className="theme-toggle"
                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                <span className="theme-icon">{isDarkMode ? '☀️' : '🌙'}</span>
                <span className="theme-label">{isDarkMode ? 'Light' : 'Dark'}</span>
              </button>

              <span className="user-email">{user?.email}</span>
              <button onClick={handleLogout} className="logout-btn">
                Logout
              </button>
            </div>
          </div>

          <button
            className="mobile-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span className={`hamburger ${isMobileMenuOpen ? 'open' : ''}`}></span>
          </button>
        </div>
      </nav>

      <style>{`
        .navbar {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 0 20px;
          position: sticky;
          top: 0;
          z-index: 1000;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .navbar-container {
          max-width: 1400px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 64px;
        }

        .navbar-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          color: white;
        }

        .brand-icon {
          font-size: 28px;
        }

        .brand-text {
          font-size: 20px;
          font-weight: 700;
        }

        .navbar-menu {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .nav-links {
          display: flex;
          gap: 4px;
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 14px;
          color: rgba(255, 255, 255, 0.85);
          text-decoration: none;
          border-radius: 8px;
          transition: all 0.2s ease;
          font-size: 14px;
          font-weight: 500;
        }

        .nav-link:hover {
          background: rgba(255, 255, 255, 0.15);
          color: white;
        }

        .nav-link.active {
          background: rgba(255, 255, 255, 0.2);
          color: white;
        }

        .nav-icon {
          font-size: 16px;
        }

        .nav-user {
          display: flex;
          align-items: center;
          gap: 12px;
          padding-left: 20px;
          border-left: 1px solid rgba(255, 255, 255, 0.2);
          margin-left: 16px;
        }

        .theme-toggle {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 20px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          transition: all 0.2s ease;
        }

        .theme-toggle:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: scale(1.05);
        }

        .theme-icon {
          font-size: 16px;
        }

        .theme-label {
          font-size: 12px;
        }

        .user-email {
          color: rgba(255, 255, 255, 0.9);
          font-size: 13px;
          max-width: 120px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .logout-btn {
          padding: 8px 16px;
          background: rgba(255, 255, 255, 0.15);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          transition: all 0.2s ease;
        }

        .logout-btn:hover {
          background: rgba(255, 255, 255, 0.25);
        }

        .mobile-toggle {
          display: none;
          background: none;
          border: none;
          cursor: pointer;
          padding: 8px;
        }

        .hamburger {
          display: block;
          width: 24px;
          height: 2px;
          background: white;
          position: relative;
          transition: background 0.2s ease;
        }

        .hamburger::before,
        .hamburger::after {
          content: '';
          position: absolute;
          width: 24px;
          height: 2px;
          background: white;
          left: 0;
          transition: transform 0.2s ease;
        }

        .hamburger::before {
          top: -7px;
        }

        .hamburger::after {
          top: 7px;
        }

        .hamburger.open {
          background: transparent;
        }

        .hamburger.open::before {
          transform: rotate(45deg) translate(5px, 5px);
        }

        .hamburger.open::after {
          transform: rotate(-45deg) translate(5px, -5px);
        }

        @media (max-width: 900px) {
          .mobile-toggle {
            display: block;
          }

          .navbar-menu {
            position: fixed;
            top: 64px;
            left: 0;
            right: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            flex-direction: column;
            padding: 20px;
            gap: 20px;
            transform: translateY(-100%);
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
          }

          .navbar-menu.open {
            transform: translateY(0);
            opacity: 1;
            visibility: visible;
          }

          .nav-links {
            flex-direction: column;
            width: 100%;
            gap: 8px;
          }

          .nav-link {
            padding: 14px 16px;
            font-size: 16px;
          }

          .nav-user {
            flex-direction: column;
            border-left: none;
            border-top: 1px solid rgba(255, 255, 255, 0.2);
            padding: 16px 0 0 0;
            margin: 0;
            width: 100%;
            gap: 12px;
          }

          .theme-toggle {
            width: 100%;
            justify-content: center;
            padding: 12px;
          }

          .logout-btn {
            width: 100%;
            padding: 12px;
          }
        }
      `}</style>
    </>
  );
};

export default Navbar;

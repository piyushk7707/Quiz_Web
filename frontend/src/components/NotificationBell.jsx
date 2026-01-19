import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api/client';

const NotificationBell = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch pending friend requests as notifications
    const fetchNotifications = async () => {
        if (!user) return;

        try {
            setIsLoading(true);
            const response = await api.get('/friends/requests/');
            const pendingRequests = response.data.map(req => ({
                id: req.id,
                type: 'friend_request',
                message: `${req.sender_username} sent you a friend request`,
                time: req.created_at,
                data: req,
            }));
            setNotifications(pendingRequests);
        } catch (err) {
            console.log('Could not fetch notifications');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll for new notifications every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [user]);

    const handleAccept = async (requestId) => {
        try {
            await api.post(`/friends/request/${requestId}/accept/`);
            setNotifications(prev => prev.filter(n => n.id !== requestId));
        } catch (err) {
            console.log('Failed to accept request');
        }
    };

    const handleReject = async (requestId) => {
        try {
            await api.post(`/friends/request/${requestId}/reject/`);
            setNotifications(prev => prev.filter(n => n.id !== requestId));
        } catch (err) {
            console.log('Failed to reject request');
        }
    };

    const unreadCount = notifications.length;

    return (
        <div className="notification-container">
            <button
                className="notification-bell"
                onClick={() => setIsOpen(!isOpen)}
                title={`${unreadCount} notifications`}
            >
                <span className="bell-icon">🔔</span>
                {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
            </button>

            {isOpen && (
                <div className="notification-dropdown">
                    <div className="dropdown-header">
                        <h4>Notifications</h4>
                        <button className="close-btn" onClick={() => setIsOpen(false)}>×</button>
                    </div>

                    <div className="notification-list">
                        {isLoading ? (
                            <div className="loading">Loading...</div>
                        ) : notifications.length === 0 ? (
                            <div className="empty">
                                <span className="empty-icon">🎉</span>
                                <p>No new notifications</p>
                            </div>
                        ) : (
                            notifications.map(notification => (
                                <div key={notification.id} className="notification-item">
                                    <div className="notification-content">
                                        <span className="notification-icon">👤</span>
                                        <div className="notification-text">
                                            <p>{notification.message}</p>
                                            <span className="notification-time">
                                                {new Date(notification.time).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                    {notification.type === 'friend_request' && (
                                        <div className="notification-actions">
                                            <button
                                                className="action-btn accept"
                                                onClick={() => handleAccept(notification.id)}
                                            >
                                                ✓
                                            </button>
                                            <button
                                                className="action-btn reject"
                                                onClick={() => handleReject(notification.id)}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    {notifications.length > 0 && (
                        <div className="dropdown-footer">
                            <button onClick={() => { navigate('/friends'); setIsOpen(false); }}>
                                View All Friend Requests
                            </button>
                        </div>
                    )}
                </div>
            )}

            <style>{`
        .notification-container {
          position: relative;
        }

        .notification-bell {
          position: relative;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .notification-bell:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: scale(1.05);
        }

        .bell-icon {
          font-size: 18px;
        }

        .notification-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          background: #ef4444;
          color: white;
          font-size: 10px;
          font-weight: 700;
          min-width: 18px;
          height: 18px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        .notification-dropdown {
          position: absolute;
          top: 50px;
          right: 0;
          width: 340px;
          background: var(--bg-secondary, white);
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
          z-index: 1001;
          overflow: hidden;
        }

        .dropdown-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          border-bottom: 1px solid var(--border-color, #e0e0e0);
        }

        .dropdown-header h4 {
          margin: 0;
          font-size: 16px;
          color: var(--text-primary, #333);
        }

        .dropdown-header .close-btn {
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          color: var(--text-muted, #999);
        }

        .notification-list {
          max-height: 300px;
          overflow-y: auto;
        }

        .notification-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          border-bottom: 1px solid var(--border-color, #f0f0f0);
          transition: background 0.2s ease;
        }

        .notification-item:hover {
          background: var(--bg-tertiary, #f9f9f9);
        }

        .notification-content {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
        }

        .notification-icon {
          font-size: 24px;
        }

        .notification-text {
          flex: 1;
        }

        .notification-text p {
          margin: 0;
          font-size: 14px;
          color: var(--text-primary, #333);
        }

        .notification-time {
          font-size: 11px;
          color: var(--text-muted, #999);
        }

        .notification-actions {
          display: flex;
          gap: 6px;
        }

        .action-btn {
          width: 28px;
          height: 28px;
          border: none;
          border-radius: 50%;
          cursor: pointer;
          font-size: 12px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .action-btn.accept {
          background: #dcfce7;
          color: #16a34a;
        }

        .action-btn.accept:hover {
          background: #16a34a;
          color: white;
        }

        .action-btn.reject {
          background: #fee2e2;
          color: #dc2626;
        }

        .action-btn.reject:hover {
          background: #dc2626;
          color: white;
        }

        .empty {
          padding: 40px 20px;
          text-align: center;
          color: var(--text-muted, #999);
        }

        .empty-icon {
          font-size: 40px;
          display: block;
          margin-bottom: 12px;
        }

        .empty p {
          margin: 0;
          font-size: 14px;
        }

        .loading {
          padding: 40px 20px;
          text-align: center;
          color: var(--text-muted, #999);
        }

        .dropdown-footer {
          padding: 12px 16px;
          border-top: 1px solid var(--border-color, #e0e0e0);
        }

        .dropdown-footer button {
          width: 100%;
          padding: 10px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          font-size: 13px;
          transition: all 0.2s ease;
        }

        .dropdown-footer button:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        @media (max-width: 400px) {
          .notification-dropdown {
            width: calc(100vw - 20px);
            right: -10px;
          }
        }
      `}</style>
        </div>
    );
};

export default NotificationBell;

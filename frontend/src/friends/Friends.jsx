import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api/client';

const Friends = () => {
  const { user } = useContext(AuthContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [activeTab, setActiveTab] = useState('friends');
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch pending requests and friends
      const [pendingRes, friendsRes] = await Promise.all([
        api.get('/friends/requests/'),
        api.get('/friends/list/'),
      ]);

      setPendingRequests(pendingRes.data);
      setFriends(friendsRes.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      setError(null);
      const response = await api.get('/friends/search/', {
        params: { q: searchQuery }
      });
      setSearchResults(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Search failed');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendRequest = async (userId) => {
    try {
      setError(null);
      await api.post(`/friends/request/${userId}/`);
      setSuccessMessage('Friend request sent!');
      setTimeout(() => setSuccessMessage(null), 3000);
      setSearchQuery('');
      setSearchResults([]);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send request');
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      setError(null);
      await api.post(`/friends/request/${requestId}/accept/`);
      setSuccessMessage('Friend request accepted!');
      setTimeout(() => setSuccessMessage(null), 3000);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to accept request');
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      setError(null);
      await api.post(`/friends/request/${requestId}/reject/`);
      setSuccessMessage('Friend request rejected');
      setTimeout(() => setSuccessMessage(null), 3000);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reject request');
    }
  };

  const handleRemoveFriend = async (friendId) => {
    if (!window.confirm('Remove this friend?')) return;

    try {
      setError(null);
      await api.post(`/friends/remove/${friendId}/`);
      setSuccessMessage('Friend removed');
      setTimeout(() => setSuccessMessage(null), 3000);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove friend');
    }
  };

  const isUserInSearchResults = (userId) => {
    return searchResults.some(user => user.id === userId) ||
      friends.some(friend => friend.id === userId) ||
      pendingRequests.some(req => req.sender.id === userId || req.receiver.id === userId);
  };

  const getUserRequestStatus = (userId) => {
    const pending = pendingRequests.find(req => req.sender.id === userId);
    if (pending) return { status: 'pending_received', id: pending.id };

    const sent = pendingRequests.find(req => req.receiver.id === userId);
    if (sent) return { status: 'pending_sent', id: sent.id };

    if (friends.some(friend => friend.id === userId)) {
      return { status: 'friends', id: null };
    }

    return { status: 'none', id: null };
  };

  if (isLoading) {
    return (
      <div className="friends-container">
        <div className="loading">Loading friends...</div>
        <style jsx>{`
          .friends-container {
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

  return (
    <div className="friends-container">
      {/* Header */}
      <div className="header">
        <h1>👥 Friends</h1>
      </div>

      {/* Messages */}
      {error && (
        <div className="message error-message">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="close-btn">✕</button>
        </div>
      )}

      {successMessage && (
        <div className="message success-message">
          {successMessage}
        </div>
      )}

      {/* Search Section */}
      <div className="search-section">
        <div className="search-box">
          <label htmlFor="friend-search" className="sr-only">Search for users</label>
          <input
            id="friend-search"
            type="text"
            placeholder="🔍 Search users (min 2 characters)..."
            value={searchQuery}
            onChange={(e) => {
              const value = e.target.value;
              setSearchQuery(value);

              // Clear previous timeout
              if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
              }

              // Debounce: wait 300ms before searching
              if (value.length >= 2) {
                searchTimeoutRef.current = setTimeout(() => {
                  handleSearch();
                }, 300);
              } else {
                setSearchResults([]);
              }
            }}
            className="search-input"
          />
          {isSearching && <div className="spinner"></div>}
          {searchQuery.length > 0 && searchQuery.length < 2 && (
            <div className="search-hint">Type at least 2 characters to search</div>
          )}
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="search-results">
            {searchResults.map((user) => {
              const { status, id } = getUserRequestStatus(user.id);
              return (
                <div key={user.id} className="search-result-item">
                  <div className="user-info">
                    <div className="user-name">{user.username}</div>
                    <div className="user-email">{user.email}</div>
                  </div>
                  <div className="action-button">
                    {status === 'none' && (
                      <button
                        onClick={() => handleSendRequest(user.id)}
                        className="btn btn-send"
                      >
                        Add Friend
                      </button>
                    )}
                    {status === 'pending_sent' && (
                      <button className="btn btn-pending" disabled>
                        Request Sent
                      </button>
                    )}
                    {status === 'pending_received' && (
                      <div className="pending-actions">
                        <button
                          onClick={() => handleAcceptRequest(id)}
                          className="btn btn-accept"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleRejectRequest(id)}
                          className="btn btn-reject"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                    {status === 'friends' && (
                      <button className="btn btn-friends" disabled>
                        ✓ Friends
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'friends' ? 'active' : ''}`}
          onClick={() => setActiveTab('friends')}
        >
          Friends ({friends.length})
        </button>
        <button
          className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending ({pendingRequests.length})
        </button>
      </div>

      {/* Friends List */}
      {activeTab === 'friends' && (
        <div className="list-section">
          {friends.length === 0 ? (
            <div className="empty-state">
              <p>No friends yet. Search for users and send them a friend request!</p>
            </div>
          ) : (
            <div className="friends-list">
              {friends.map((friend) => (
                <div key={friend.id} className="friend-card">
                  <div className="friend-avatar">
                    {friend.username[0].toUpperCase()}
                  </div>
                  <div className="friend-info">
                    <div className="friend-name">{friend.username}</div>
                    <div className="friend-email">{friend.email}</div>
                    <div className="friend-points">⭐ {friend.total_points} points</div>
                  </div>
                  <div className="friend-actions">
                    <button
                      onClick={() => {
                        // Will implement chat navigation
                        window.location.href = `/chat?friend=${friend.id}`;
                      }}
                      className="btn btn-chat"
                    >
                      💬 Chat
                    </button>
                    <button
                      onClick={() => handleRemoveFriend(friend.id)}
                      className="btn btn-remove"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pending Requests */}
      {activeTab === 'pending' && (
        <div className="list-section">
          {pendingRequests.length === 0 ? (
            <div className="empty-state">
              <p>No pending friend requests</p>
            </div>
          ) : (
            <div className="pending-list">
              {pendingRequests.map((request) => (
                <div key={request.id} className="pending-card">
                  <div className="pending-avatar">
                    {request.sender_username[0].toUpperCase()}
                  </div>
                  <div className="pending-info">
                    <div className="pending-name">
                      <strong>{request.sender_username}</strong> sent you a request
                    </div>
                    <div className="pending-date">
                      {new Date(request.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="pending-actions">
                    <button
                      onClick={() => handleAcceptRequest(request.id)}
                      className="btn btn-accept"
                    >
                      ✓ Accept
                    </button>
                    <button
                      onClick={() => handleRejectRequest(request.id)}
                      className="btn btn-reject"
                    >
                      ✕ Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .friends-container {
          max-width: 1000px;
          margin: 0 auto;
          padding: 40px 20px;
        }

        .header {
          margin-bottom: 40px;
        }

        .header h1 {
          font-size: 32px;
          color: #333;
          margin: 0;
        }

        .message {
          padding: 15px 20px;
          border-radius: 8px;
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .error-message {
          background: #fee;
          border: 1px solid #f99;
          color: #c33;
        }

        .success-message {
          background: #efe;
          border: 1px solid #9f9;
          color: #3a3;
        }

        .close-btn {
          background: transparent;
          border: none;
          cursor: pointer;
          font-size: 18px;
          padding: 0;
        }

        .search-section {
          background: white;
          border-radius: 12px;
          padding: 25px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          margin-bottom: 30px;
        }

        .search-box {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-input {
          width: 100%;
          padding: 12px 15px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-size: 15px;
          transition: border-color 0.3s ease;
        }

        .search-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .spinner {
          position: absolute;
          right: 15px;
          width: 20px;
          height: 20px;
          border: 3px solid #e0e0e0;
          border-top: 3px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .search-hint {
          position: absolute;
          bottom: -24px;
          left: 0;
          font-size: 12px;
          color: #f59e0b;
          font-weight: 500;
        }

        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          border: 0;
        }

        .search-box {
          position: relative;
          display: flex;
          flex-direction: column;
        }

        .search-results {
          margin-top: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: 400px;
          overflow-y: auto;
        }

        .search-result-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px;
          background: #f9f9f9;
          border-radius: 8px;
          border: 1px solid #e0e0e0;
        }

        .user-info {
          flex: 1;
        }

        .user-name {
          font-weight: 600;
          color: #333;
          margin-bottom: 4px;
        }

        .user-email {
          font-size: 12px;
          color: #999;
        }

        .action-button {
          display: flex;
          gap: 8px;
        }

        .pending-actions {
          display: flex;
          gap: 8px;
        }

        .tabs {
          display: flex;
          gap: 0;
          margin-bottom: 30px;
          border-bottom: 2px solid #e0e0e0;
        }

        .tab {
          padding: 12px 24px;
          background: transparent;
          border: none;
          cursor: pointer;
          font-weight: 600;
          color: #999;
          border-bottom: 3px solid transparent;
          transition: all 0.3s ease;
          margin-bottom: -2px;
        }

        .tab.active {
          color: #667eea;
          border-bottom-color: #667eea;
        }

        .tab:hover {
          color: #333;
        }

        .list-section {
          background: white;
          border-radius: 12px;
          padding: 25px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #999;
        }

        .friends-list {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .friend-card {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 20px;
          background: #f9f9f9;
          border-radius: 8px;
          border: 1px solid #e0e0e0;
          transition: all 0.3s ease;
        }

        .friend-card:hover {
          background: #f0f0f0;
          border-color: #667eea;
        }

        .friend-avatar {
          width: 50px;
          height: 50px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 20px;
          flex-shrink: 0;
        }

        .friend-info {
          flex: 1;
        }

        .friend-name {
          font-weight: 600;
          color: #333;
          margin-bottom: 4px;
        }

        .friend-email {
          font-size: 12px;
          color: #999;
          margin-bottom: 8px;
        }

        .friend-points {
          font-size: 13px;
          color: #667eea;
          font-weight: 600;
        }

        .friend-actions {
          display: flex;
          gap: 10px;
        }

        .pending-list {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .pending-card {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 20px;
          background: #f9f9f9;
          border-radius: 8px;
          border: 1px solid #e0e0e0;
        }

        .pending-avatar {
          width: 50px;
          height: 50px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 20px;
          flex-shrink: 0;
        }

        .pending-info {
          flex: 1;
        }

        .pending-name {
          color: #333;
          margin-bottom: 4px;
        }

        .pending-date {
          font-size: 12px;
          color: #999;
        }

        .btn {
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          font-size: 13px;
          transition: all 0.3s ease;
          white-space: nowrap;
        }

        .btn-send {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .btn-send:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .btn-pending {
          background: #f0f0f0;
          color: #999;
          cursor: not-allowed;
        }

        .btn-friends {
          background: #efe;
          color: #3a3;
          cursor: not-allowed;
        }

        .btn-accept {
          background: #efe;
          color: #3a3;
        }

        .btn-accept:hover {
          background: #dfd;
        }

        .btn-reject {
          background: #fee;
          color: #c33;
        }

        .btn-reject:hover {
          background: #fdd;
        }

        .btn-chat {
          background: #e3f2fd;
          color: #0066cc;
        }

        .btn-chat:hover {
          background: #bbdefb;
        }

        .btn-remove {
          background: #ffebee;
          color: #c62828;
        }

        .btn-remove:hover {
          background: #ffcdd2;
        }

        @media (max-width: 600px) {
          .friends-container {
            padding: 20px 15px;
          }

          .friend-card,
          .pending-card,
          .search-result-item {
            flex-direction: column;
            align-items: flex-start;
          }

          .friend-actions,
          .pending-actions,
          .action-button {
            width: 100%;
          }

          .btn {
            flex: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default Friends;

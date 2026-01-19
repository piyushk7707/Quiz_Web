import React, { useState } from 'react';
import './Friends.css';

/**
 * Friends Component
 * 
 * Displays three main sections:
 * 1. Search Users - Find and add new friends
 * 2. Pending Requests - Manage incoming friend requests
 * 3. Friends List - View all friends with chat option
 * 
 * Uses dummy data for now (backend API integration planned)
 */
export default function Friends() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  // DUMMY DATA - Replace with API calls later
  const [pendingRequests, setPendingRequests] = useState([
    { id: 1, name: 'Alice Johnson', avatar: '👩' },
    { id: 2, name: 'Bob Smith', avatar: '👨' },
  ]);

  const [friendsList, setFriendsList] = useState([
    { id: 10, name: 'Sarah Williams', avatar: '👩', status: 'online' },
    { id: 11, name: 'John Doe', avatar: '👨', status: 'offline' },
    { id: 12, name: 'Emma Davis', avatar: '👩', status: 'online' },
    { id: 13, name: 'Michael Brown', avatar: '👨', status: 'offline' },
  ]);

  const [allUsers, setAllUsers] = useState([
    { id: 20, name: 'David Wilson', avatar: '👨' },
    { id: 21, name: 'Jessica Lee', avatar: '👩' },
    { id: 22, name: 'Chris Martinez', avatar: '👨' },
    { id: 23, name: 'Amy Taylor', avatar: '👩' },
  ]);

  // Search for users
  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    const results = allUsers.filter((user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setSearchResults(results);
    setHasSearched(true);
  };

  // Handle key press for search
  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Add friend from search results
  const handleAddFriend = (userId) => {
    const userToAdd = searchResults.find((u) => u.id === userId);
    if (userToAdd) {
      setFriendsList([...friendsList, { ...userToAdd, status: 'offline' }]);
      setSearchResults(searchResults.filter((u) => u.id !== userId));
      setAllUsers(allUsers.filter((u) => u.id !== userId));
    }
  };

  // Accept friend request
  const handleAcceptRequest = (userId) => {
    const acceptedUser = pendingRequests.find((r) => r.id === userId);
    if (acceptedUser) {
      setFriendsList([...friendsList, { ...acceptedUser, status: 'offline' }]);
      setPendingRequests(pendingRequests.filter((r) => r.id !== userId));
    }
  };

  // Reject friend request
  const handleRejectRequest = (userId) => {
    setPendingRequests(pendingRequests.filter((r) => r.id !== userId));
  };

  return (
    <div className="friends-container">
      <div className="friends-header">
        <h1>Friends</h1>
        <p className="friends-subtitle">Manage your friends and friend requests</p>
      </div>

      {/* SECTION 1: SEARCH USERS */}
      <div className="friends-section">
        <h2 className="section-title">🔍 Search Users</h2>
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleSearchKeyPress}
            className="search-input"
          />
          <button onClick={handleSearch} className="btn btn-search">
            Search
          </button>
        </div>

        {/* Search Results */}
        {hasSearched && (
          <div className="search-results">
            {searchResults.length > 0 ? (
              <div className="users-grid">
                {searchResults.map((user) => (
                  <div key={user.id} className="user-card">
                    <div className="user-avatar">{user.avatar}</div>
                    <div className="user-info">
                      <p className="user-name">{user.name}</p>
                    </div>
                    <button
                      onClick={() => handleAddFriend(user.id)}
                      className="btn btn-add"
                    >
                      Add Friend
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No users found matching "{searchQuery}"</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SECTION 2: PENDING FRIEND REQUESTS */}
      <div className="friends-section">
        <h2 className="section-title">📬 Pending Requests</h2>
        {pendingRequests.length > 0 ? (
          <div className="requests-list">
            {pendingRequests.map((request) => (
              <div key={request.id} className="request-card">
                <div className="request-avatar">{request.avatar}</div>
                <div className="request-info">
                  <p className="request-name">{request.name}</p>
                  <p className="request-status">Wants to add you</p>
                </div>
                <div className="request-actions">
                  <button
                    onClick={() => handleAcceptRequest(request.id)}
                    className="btn btn-accept"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleRejectRequest(request.id)}
                    className="btn btn-reject"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No pending requests</p>
          </div>
        )}
      </div>

      {/* SECTION 3: FRIENDS LIST */}
      <div className="friends-section">
        <h2 className="section-title">👥 Friends List</h2>
        {friendsList.length > 0 ? (
          <div className="friends-grid">
            {friendsList.map((friend) => (
              <div key={friend.id} className="friend-card">
                <div className="friend-header">
                  <div className="friend-avatar">{friend.avatar}</div>
                  <div className="status-indicator" data-status={friend.status}></div>
                </div>
                <div className="friend-info">
                  <p className="friend-name">{friend.name}</p>
                  <p className="friend-status">
                    {friend.status === 'online' ? '🟢 Online' : '⚪ Offline'}
                  </p>
                </div>
                <button className="btn btn-chat" disabled>
                  💬 Chat
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No friends yet</p>
            <small>Search for users and add them as friends</small>
          </div>
        )}
      </div>
    </div>
  );
}


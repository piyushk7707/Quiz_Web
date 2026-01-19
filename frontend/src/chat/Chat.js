import React, { useState, useEffect, useContext, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api/client';
import ChatWebSocket from '../utils/ChatWebSocket';

const Chat = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const wsRef = useRef(null);

  useEffect(() => {
    fetchFriends();
  }, []);

  useEffect(() => {
    const friendId = searchParams.get('friend');
    if (friendId && friends.length > 0) {
      const friend = friends.find(f => f.id === parseInt(friendId));
      if (friend) {
        selectFriend(friend);
      }
    }
  }, [searchParams, friends]);

  useEffect(() => {
    if (selectedFriend && user) {
      setupWebSocket();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.disconnect();
        wsRef.current = null;
      }
    };
  }, [selectedFriend, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchFriends = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get('/friends/list/');
      setFriends(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load friends');
    } finally {
      setIsLoading(false);
    }
  };

  const selectFriend = async (friend) => {
    setSelectedFriend(friend);
    setMessages([]);
    setError(null);

    try {
      try {
        const response = await api.get(`/chat/history/${friend.id}/`);
        setMessages(response.data.map(msg => ({
          id: msg.id,
          sender_id: msg.sender.id,
          sender_username: msg.sender.username,
          text: msg.text,
          timestamp: msg.created_at,
          is_own: msg.sender.id === user.id
        })));
      } catch (e) {
        console.log('Chat history not available');
      }
    } catch (err) {
      console.log('Could not load chat history');
    }
  };

  const setupWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.disconnect();
    }

    const token = localStorage.getItem('access_token');
    if (!token) {
      setError('Authentication required');
      return;
    }

    wsRef.current = new ChatWebSocket(user.id, selectedFriend.id, token);

    wsRef.current.onMessage((message) => {
      setMessages(prev => [...prev, message]);
    });

    wsRef.current.onConnectionEvent((event, data) => {
      if (event === 'connected') {
        setIsConnected(true);
        setError(null);
      } else if (event === 'disconnected') {
        setIsConnected(false);
      } else if (event === 'error') {
        setError(data || 'Connection error');
        setIsConnected(false);
      }
    });

    wsRef.current.connect();
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!messageText.trim() || !wsRef.current || !wsRef.current.isConnected()) {
      return;
    }

    setIsSending(true);
    const text = messageText.trim();
    setMessageText('');

    if (wsRef.current.sendMessage(text)) {
      // Message will be added through WebSocket handler
    } else {
      setError('Failed to send message');
      setMessageText(text);
      setIsSending(false);
    }

    setIsSending(false);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="chat-container">
        <div className="loading">Loading chats...</div>
        <style jsx>{`
          .chat-container {
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .loading {
            font-size: 18px;
            color: #667eea;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>💬 Chats</h2>
          <button onClick={() => navigate('/friends')} className="friends-link">
            👥 Friends
          </button>
        </div>

        {friends.length === 0 ? (
          <div className="empty-friends">
            <p>No friends yet</p>
            <button onClick={() => navigate('/friends')} className="btn-primary">
              Add Friends
            </button>
          </div>
        ) : (
          <div className="friends-list">
            {friends.map((friend) => (
              <div
                key={friend.id}
                className={`friend-item ${selectedFriend?.id === friend.id ? 'active' : ''}`}
                onClick={() => selectFriend(friend)}
              >
                <div className="friend-avatar">
                  {friend.username[0].toUpperCase()}
                </div>
                <div className="friend-details">
                  <div className="friend-name">{friend.username}</div>
                  <div className="friend-points">⭐ {friend.total_points || 0} pts</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="chat-area">
        {selectedFriend ? (
          <>
            <div className="chat-header">
              <div className="header-content">
                <div className="header-avatar">
                  {selectedFriend.username[0].toUpperCase()}
                </div>
                <div className="header-info">
                  <div className="header-name">{selectedFriend.username}</div>
                  <div className={`header-status ${isConnected ? 'connected' : 'disconnected'}`}>
                    {isConnected ? '🟢 Connected' : '🔴 Connecting...'}
                  </div>
                </div>
              </div>
              <button onClick={() => navigate('/profile')} className="btn-profile">
                Profile
              </button>
            </div>

            {error && (
              <div className="error-banner">
                {error}
              </div>
            )}

            <div className="messages-container">
              {messages.length === 0 && (
                <div className="no-messages">
                  <p>No messages yet. Start the conversation!</p>
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`message ${message.is_own ? 'own' : 'other'}`}
                >
                  <div className="message-avatar">
                    {message.sender_username[0].toUpperCase()}
                  </div>
                  <div className="message-content">
                    <div className="message-sender">
                      {message.sender_username}
                    </div>
                    <div className="message-text">
                      {message.text}
                    </div>
                    <div className="message-time">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}

              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="message-form">
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type a message..."
                disabled={!isConnected || isSending}
                className="message-input"
              />
              <button
                type="submit"
                disabled={!isConnected || isSending || !messageText.trim()}
                className="send-button"
              >
                {isSending ? '⏳' : '📤'}
              </button>
            </form>
          </>
        ) : (
          <div className="no-chat-selected">
            <div className="empty-state">
              <div className="empty-icon">💬</div>
              <h3>Select a friend to start chatting</h3>
              <p>Choose a friend from the list on the left to begin the conversation</p>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .chat-container {
          display: flex;
          height: 100vh;
          background: #f5f5f5;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .sidebar {
          width: 300px;
          background: white;
          border-right: 1px solid #e0e0e0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .sidebar-header {
          padding: 20px;
          border-bottom: 1px solid #e0e0e0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .sidebar-header h2 {
          margin: 0;
          font-size: 20px;
          color: #333;
        }

        .friends-link {
          background: #f0f0f0;
          border: none;
          color: #667eea;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
          font-size: 12px;
          transition: all 0.3s ease;
        }

        .friends-link:hover {
          background: #e0e0e0;
        }

        .empty-friends {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 20px;
          padding: 20px;
          text-align: center;
          color: #999;
        }

        .empty-friends .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
        }

        .friends-list {
          flex: 1;
          overflow-y: auto;
        }

        .friend-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 15px;
          cursor: pointer;
          border-left: 4px solid transparent;
          transition: all 0.3s ease;
        }

        .friend-item:hover {
          background: #f9f9f9;
        }

        .friend-item.active {
          background: #f0f0f0;
          border-left-color: #667eea;
        }

        .friend-avatar {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          flex-shrink: 0;
        }

        .friend-details {
          flex: 1;
          min-width: 0;
        }

        .friend-name {
          font-weight: 600;
          color: #333;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .friend-status {
          font-size: 12px;
          color: #999;
        }

        .chat-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: white;
        }

        .chat-header {
          padding: 15px 20px;
          border-bottom: 1px solid #e0e0e0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .header-content {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .header-avatar {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          flex-shrink: 0;
        }

        .header-info {
          display: flex;
          flex-direction: column;
        }

        .header-name {
          font-weight: 600;
          color: #333;
        }

        .header-status {
          font-size: 12px;
          color: #999;
        }

        .header-status.connected {
          color: #3a3;
        }

        .header-status.disconnected {
          color: #c33;
        }

        .btn-profile {
          background: #f0f0f0;
          border: none;
          color: #333;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
          font-size: 12px;
          transition: all 0.3s ease;
        }

        .btn-profile:hover {
          background: #e0e0e0;
        }

        .error-banner {
          background: #fee;
          border-bottom: 1px solid #f99;
          color: #c33;
          padding: 12px 20px;
          font-size: 13px;
        }

        .messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .no-messages {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #999;
          text-align: center;
        }

        .message {
          display: flex;
          gap: 10px;
          align-items: flex-end;
          animation: slideIn 0.3s ease;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .message.own {
          justify-content: flex-end;
        }

        .message.own .message-avatar {
          order: 2;
        }

        .message-avatar {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 12px;
          flex-shrink: 0;
        }

        .message-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .message.own .message-content {
          align-items: flex-end;
        }

        .message-sender {
          font-size: 12px;
          font-weight: 600;
          color: #999;
        }

        .message-text {
          padding: 12px 16px;
          background: #f0f0f0;
          border-radius: 12px;
          color: #333;
          word-break: break-word;
          max-width: 400px;
        }

        .message.own .message-text {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .message-time {
          font-size: 11px;
          color: #ccc;
          padding: 0 12px;
        }

        .message-form {
          display: flex;
          gap: 10px;
          padding: 15px 20px;
          border-top: 1px solid #e0e0e0;
        }

        .message-input {
          flex: 1;
          padding: 12px 15px;
          border: 1px solid #e0e0e0;
          border-radius: 24px;
          font-size: 14px;
          outline: none;
          transition: border-color 0.3s ease;
        }

        .message-input:focus {
          border-color: #667eea;
        }

        .message-input:disabled {
          background: #f5f5f5;
          color: #ccc;
        }

        .send-button {
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 50%;
          cursor: pointer;
          font-size: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .send-button:hover:not(:disabled) {
          transform: scale(1.1);
        }

        .send-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .no-chat-selected {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .empty-state {
          text-align: center;
          color: #999;
        }

        .empty-icon {
          font-size: 64px;
          margin-bottom: 20px;
        }

        .empty-state h3 {
          margin: 0 0 10px 0;
          color: #333;
        }

        .empty-state p {
          margin: 0;
          font-size: 14px;
        }

        .friend-points {
          font-size: 11px;
          color: #667eea;
          font-weight: 600;
        }

        @media (max-width: 768px) {
          .chat-container {
            flex-direction: column;
          }

          .sidebar {
            width: 100%;
            height: auto;
            max-height: 200px;
            border-right: none;
            border-bottom: 1px solid #e0e0e0;
          }

          .friends-list {
            display: flex;
            overflow-x: auto;
            flex-direction: row;
          }

          .friend-item {
            flex-direction: column;
            min-width: 90px;
            padding: 10px;
            text-align: center;
            border: none;
            border-bottom: 3px solid transparent;
          }

          .friend-item.active {
            border-bottom-color: #667eea;
            border-left: none;
          }

          .friend-details {
            display: block;
          }

          .friend-name {
            font-size: 11px !important;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 70px;
          }

          .friend-points {
            font-size: 10px;
          }

          .chat-area {
            flex: 1;
          }

          .message-text {
            max-width: 200px;
          }
        }
      `}</style>
    </div>
  );
};

export default Chat;

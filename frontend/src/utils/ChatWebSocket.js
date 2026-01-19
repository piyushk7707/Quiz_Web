/**
 * WebSocket utilities for real-time chat
 * Handles JWT authentication and message management
 */

class ChatWebSocket {
  constructor(userId, friendId, token) {
    this.userId = userId;
    this.friendId = friendId;
    this.token = token;
    this.socket = null;
    this.messageHandlers = [];
    this.connectionHandlers = [];
    this.isConnecting = false;
  }

  /**
   * Establish WebSocket connection with JWT authentication
   */
  connect() {
    if (this.socket) return; // Already connected
    if (this.isConnecting) return;
    
    this.isConnecting = true;
    
    // Build WebSocket URL with token as query parameter
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws/chat/${this.friendId}/?token=${this.token}`;
    
    try {
      this.socket = new WebSocket(wsUrl);
      
      this.socket.onopen = () => {
        console.log('WebSocket connected');
        this.isConnecting = false;
        this.emitConnectionEvent('connected');
      };
      
      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };
      
      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
        this.emitConnectionEvent('error');
      };
      
      this.socket.onclose = () => {
        console.log('WebSocket disconnected');
        this.socket = null;
        this.isConnecting = false;
        this.emitConnectionEvent('disconnected');
        
        // Auto-reconnect after 3 seconds
        setTimeout(() => {
          if (!this.socket) {
            this.connect();
          }
        }, 3000);
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      this.isConnecting = false;
      this.emitConnectionEvent('error');
    }
  }

  /**
   * Send a message through WebSocket
   */
  sendMessage(messageText) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket is not connected');
      return false;
    }
    
    try {
      const data = {
        message: messageText
      };
      this.socket.send(JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Failed to send message:', error);
      return false;
    }
  }

  /**
   * Handle incoming message
   */
  handleMessage(data) {
    const { type } = data;
    
    if (type === 'connection_established') {
      console.log(data.message);
    } else if (type === 'message') {
      this.emitMessage({
        id: Date.now(),
        sender_id: data.sender_id,
        sender_username: data.sender_username,
        text: data.message,
        timestamp: data.timestamp,
        is_own: data.sender_id === this.userId
      });
    } else if (type === 'error') {
      this.emitConnectionEvent('error', data.message);
    }
  }

  /**
   * Register a handler for incoming messages
   */
  onMessage(handler) {
    this.messageHandlers.push(handler);
  }

  /**
   * Emit message to all handlers
   */
  emitMessage(message) {
    this.messageHandlers.forEach(handler => handler(message));
  }

  /**
   * Register a handler for connection events
   */
  onConnectionEvent(handler) {
    this.connectionHandlers.push(handler);
  }

  /**
   * Emit connection event
   */
  emitConnectionEvent(event, data = null) {
    this.connectionHandlers.forEach(handler => handler(event, data));
  }

  /**
   * Disconnect WebSocket
   */
  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  /**
   * Check if connected
   */
  isConnected() {
    return this.socket && this.socket.readyState === WebSocket.OPEN;
  }
}

export default ChatWebSocket;

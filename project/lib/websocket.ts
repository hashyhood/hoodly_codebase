import { io, Socket } from 'socket.io-client';
import { CONFIG } from './config';
import { supabase } from './supabase';

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

interface WebSocketHandlers {
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: any) => void;
  onTyping?: (data: { userId: string; roomId: string }) => void;
  onStopTyping?: (data: { userId: string; roomId: string }) => void;
  onSafetyAlert?: (alert: any) => void;
  onLocationUpdate?: (data: { userId: string; location: any }) => void;
  onNotification?: (data: any) => void;
}

class WebSocketManager {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private handlers: WebSocketHandlers = {};

  constructor() {
    this.initializeSocket();
  }

  private initializeSocket() {
    try {
      this.socket = io(CONFIG.API.DEV.SOCKET_URL, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
      });

      this.setupEventListeners();
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
    }
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.handlers.onConnect?.();
      this.authenticate();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.isConnected = false;
      this.handlers.onDisconnect?.();
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.handlers.onError?.(error);
    });

    this.socket.on('user-typing', (data) => {
      this.handlers.onTyping?.(data);
    });

    this.socket.on('user-stop-typing', (data) => {
      this.handlers.onStopTyping?.(data);
    });

    this.socket.on('safety_alert', (alert) => {
      this.handlers.onSafetyAlert?.(alert);
    });

    this.socket.on('user_nearby', (data) => {
      this.handlers.onLocationUpdate?.(data);
    });

    this.socket.on('auth_error', (error) => {
      console.error('WebSocket authentication error:', error);
      this.handlers.onError?.(error);
    });

    this.socket.on('notification', (data) => {
      this.handlers.onNotification?.(data);
    });
  }

  private async authenticate() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        this.socket?.emit('authenticate', {
          token: session.access_token,
          userId: session.user.id
        });
      }
    } catch (error) {
      console.error('Authentication error:', error);
    }
  }

  // Public methods
  public connect() {
    if (!this.socket) {
      this.initializeSocket();
    }
    this.socket?.connect();
  }

  public disconnect() {
    this.socket?.disconnect();
    this.socket = null;
    this.isConnected = false;
  }

  public isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  public setHandlers(handlers: WebSocketHandlers) {
    this.handlers = { ...this.handlers, ...handlers };
  }

  // Room management
  public joinRoom(roomId: string) {
    if (this.isSocketConnected()) {
      this.socket?.emit('join-room', roomId);
    }
  }

  public leaveRoom(roomId: string) {
    if (this.isSocketConnected()) {
      this.socket?.emit('leave-room', roomId);
    }
  }

  // Messaging
  public sendMessage(roomId: string, message: {
    text: string;
    user: string;
    userId: string;
    emoji?: string;
  }) {
    if (!this.socket?.connected) {
      console.warn("Socket not connected. Message not sent.");
      return;
    }
    
  }

  // Typing indicators
  public startTyping(roomId: string) {
    if (!this.socket?.connected) {
      console.warn("Socket not connected. Typing indicator not sent.");
      return;
    }
    this.socket.emit('typing-start', roomId);
  }

  public stopTyping(roomId: string) {
    if (!this.socket?.connected) {
      console.warn("Socket not connected. Typing indicator not sent.");
      return;
    }
    this.socket.emit('typing-stop', roomId);
  }

  // Location updates
  public updateLocation(location: {
    latitude: number;
    longitude: number;
    address: string;
  }) {
    if (!this.socket?.connected) {
      console.warn("Socket not connected. Location update not sent.");
      return;
    }
    this.socket.emit('location_update', location);
  }

  // Safety alerts
  public createSafetyAlert(alert: {
    type: string;
    title: string;
    description: string;
    location: {
      latitude: number;
      longitude: number;
    };
    severity: 'low' | 'medium' | 'high' | 'critical';
    affected_area?: number;
  }) {
    if (!this.socket?.connected) {
      console.warn("Socket not connected. Safety alert not sent.");
      return;
    }
    this.socket.emit('create_safety_alert', alert);
  }

  public respondToAlert(alertId: string, response: {
    responseType: 'acknowledge' | 'assist' | 'ignore';
    comment?: string;
  }) {
    if (!this.socket?.connected) {
      console.warn("Socket not connected. Alert response not sent.");
      return;
    }
    this.socket.emit('respond_to_alert', {
      alertId,
      ...response
    });
  }

  // User info
  public updateUserInfo(userInfo: {
    username: string;
    avatar?: string;
    status?: string;
  }) {
    if (!this.socket?.connected) {
      console.warn("Socket not connected. User info update not sent.");
      return;
    }
    this.socket.emit('user-info', userInfo);
  }

  // Private messaging
  public sendPrivateMessage(receiverId: string, message: {
    text: string;
    user: string;
    userId: string;
    emoji?: string;
  }) {
    if (!this.socket?.connected) {
      console.warn("Socket not connected. Private message not sent.");
      return;
    }
    this.socket.emit('privateMessage', {
      ...message,
      receiverId,
      timestamp: new Date().toISOString()
    });
  }

  // Notification events
  public emitLikePost(postId: string, postOwnerId: string) {
    if (!this.socket?.connected) {
      console.warn("Socket not connected. Like notification not sent.");
      return;
    }
    this.socket.emit('like_post', { postId, postOwnerId });
  }

  public emitFriendRequest(receiverId: string, requestId: string) {
    if (!this.socket?.connected) {
      console.warn("Socket not connected. Friend request notification not sent.");
      return;
    }
    this.socket.emit('friend_request', { receiverId, requestId });
  }

  public emitPrivateMessage(receiverId: string, message: string, messageId: string) {
    if (!this.socket?.connected) {
      console.warn("Socket not connected. Private message notification not sent.");
      return;
    }
    this.socket.emit('private_message', { receiverId, message, messageId });
  }

  public emitCommentPost(postId: string, postOwnerId: string, comment: string) {
    if (!this.socket?.connected) {
      console.warn("Socket not connected. Comment notification not sent.");
      return;
    }
    this.socket.emit('comment_post', { postId, postOwnerId, comment });
  }

  public emitMarkNotificationRead(notificationId: string) {
    if (!this.socket?.connected) {
      console.warn("Socket not connected. Mark read notification not sent.");
      return;
    }
    this.socket.emit('mark_notification_read', { notificationId });
  }

  public emitMarkAllNotificationsRead() {
    if (!this.socket?.connected) {
      console.warn("Socket not connected. Mark all read notification not sent.");
      return;
    }
    this.socket.emit('mark_all_notifications_read');
  }

  // Get socket instance for direct access (use sparingly)
  public getSocket(): Socket | null {
    return this.socket;
  }
}

// Create singleton instance
export const websocketManager = new WebSocketManager();

// Export for use in components
export default websocketManager; 
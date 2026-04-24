/**
 * Network Manager
 * Handles Socket.IO connection and events for the client
 */

import { io } from 'socket.io-client';
import { SERVER_URL } from '../config.js';

const PENDING_SEND_CAP = 50;

class NetworkManager {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.reconnecting = false;
    this.serverUrl = SERVER_URL;
    this.eventHandlers = new Map();
    this.pendingSends = [];
  }

  /**
   * Connect to the server
   */
  connect() {
    if (this.socket && this.connected) {
      console.log('[Network] Already connected');
      return this.socket;
    }

    console.log(`[Network] Connecting to ${this.serverUrl}...`);

    this.socket = io(this.serverUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10
    });

    this.setupSocketListeners();

    return this.socket;
  }

  /**
   * Disconnect from server
   */
  disconnect() {
    if (this.socket) {
      console.log('[Network] Disconnecting...');
      this.socket.disconnect();
      this.connected = false;
    }
  }

  /**
   * Setup socket event listeners
   */
  setupSocketListeners() {
    this.socket.on('connect', () => {
      console.log('[Network] Connected to server:', this.socket.id);
      this.connected = true;
      this.reconnecting = false;
      this._flushPending();
      this.emit('network:connected', { socketId: this.socket.id });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[Network] Disconnected:', reason);
      this.connected = false;
      this.emit('network:disconnected', { reason });
    });

    this.socket.on('connect_error', (error) => {
      console.error('[Network] Connection error:', error);
      this.emit('network:error', { error: error.message });
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`[Network] Reconnect attempt ${attemptNumber}...`);
      this.reconnecting = true;
      this.emit('network:reconnecting', { attempt: attemptNumber });
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`[Network] Reconnected after ${attemptNumber} attempts`);
      this.reconnecting = false;
      this.emit('network:reconnected', { attempts: attemptNumber });
    });

    this.socket.on('reconnect_failed', () => {
      console.error('[Network] Reconnection failed');
      this.emit('network:reconnect_failed');
    });

    // Welcome message
    this.socket.on('welcome', (data) => {
      console.log('[Network] Welcome:', data.message);
    });
  }

  /**
   * Send event to server. Queues the emit if the socket is not connected yet;
   * the queue is flushed on 'connect'. Guards against unbounded growth via cap.
   */
  send(eventName, data = {}) {
    if (this.socket && this.connected) {
      console.log(`[Network] Sending ${eventName}:`, data);
      this.socket.emit(eventName, data);
      return true;
    }

    if (!this.socket) {
      console.warn('[Network] Not initialized - cannot send:', eventName);
      return false;
    }

    if (this.pendingSends.length >= PENDING_SEND_CAP) {
      console.warn(`[Network] Send queue full (${PENDING_SEND_CAP}), dropping:`, eventName);
      return false;
    }

    console.log(`[Network] Queuing ${eventName} until connected`);
    this.pendingSends.push({ eventName, data });
    return true;
  }

  _flushPending() {
    if (this.pendingSends.length === 0) return;
    console.log(`[Network] Flushing ${this.pendingSends.length} queued send(s)`);
    const queue = this.pendingSends;
    this.pendingSends = [];
    for (const { eventName, data } of queue) {
      this.socket.emit(eventName, data);
    }
  }

  /**
   * Register event handler
   */
  on(eventName, handler) {
    if (!this.socket) {
      console.warn('[Network] Socket not initialized');
      return;
    }

    // Store handler reference
    if (!this.eventHandlers.has(eventName)) {
      this.eventHandlers.set(eventName, []);
    }
    this.eventHandlers.get(eventName).push(handler);

    // Register with socket
    this.socket.on(eventName, handler);
  }

  /**
   * Unregister event handler
   */
  off(eventName, handler) {
    if (!this.socket) return;

    this.socket.off(eventName, handler);

    // Remove from stored handlers
    if (this.eventHandlers.has(eventName)) {
      const handlers = this.eventHandlers.get(eventName);
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Emit custom event (for internal communication)
   */
  emit(eventName, data) {
    if (this.eventHandlers.has(eventName)) {
      const handlers = this.eventHandlers.get(eventName);
      handlers.forEach(handler => handler(data));
    }
  }

  /**
   * Get socket instance
   */
  getSocket() {
    return this.socket;
  }

  /**
   * Check connection status
   */
  isConnected() {
    return this.connected;
  }

  /**
   * Check reconnection status
   */
  isReconnecting() {
    return this.reconnecting;
  }

  /**
   * Join matchmaking queue
   */
  joinMatchmaking(playerName, userId, matchType = 'FFA', rating = 1000) {
    return this.send('matchmaking:join', {
      playerName,
      userId,
      matchType,
      rating
    });
  }

  /**
   * Leave matchmaking queue
   */
  leaveMatchmaking(matchType = null) {
    return this.send('matchmaking:leave', { matchType });
  }

  /**
   * Create private room
   */
  createRoom(playerName, userId, matchType = 'FFA', rating = 1000) {
    return this.send('room:create', {
      playerName,
      userId,
      matchType,
      rating
    });
  }

  /**
   * Join room by code
   */
  joinRoom(roomCode, playerName, userId, rating = 1000) {
    return this.send('room:join', {
      roomCode,
      playerName,
      userId,
      rating
    });
  }

  /**
   * Leave current room
   */
  leaveRoom() {
    return this.send('room:leave', {});
  }

  /**
   * Set ready state
   */
  setReady(ready) {
    return this.send('room:ready', { ready });
  }

  /**
   * Send quiz completion
   */
  sendQuizCompletion(roomCode, playerName, score, completionTime) {
    return this.send('quiz:completed', {
      roomCode,
      playerName,
      score,
      completionTime
    });
  }

  /**
   * Send game action
   */
  sendGameAction(roomCode, angle, power) {
    return this.send('game:action', {
      roomCode,
      angle,
      power
    });
  }

  /**
   * Send explosion event
   */
  sendExplosion(roomCode, position, radius, playerId) {
    return this.send('game:explosion', {
      roomCode,
      position,
      radius,
      playerId
    });
  }

  /**
   * End current turn
   */
  endTurn(roomCode) {
    return this.send('game:end_turn', { roomCode });
  }

  /**
   * Update player position
   */
  updatePosition(roomCode, x, y) {
    return this.send('game:position', {
      roomCode,
      x,
      y
    });
  }
}

// Export singleton instance
export const networkManager = new NetworkManager();
export default networkManager;

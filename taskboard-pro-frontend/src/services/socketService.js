import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
  }
  
  init() {
    if (this.socket) return;
    
    const token = localStorage.getItem('authToken');
    if (!token) return;
    
    this.socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });
    
    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.connected = true;
    });
    
    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.connected = false;
    });
    
    this.socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
      this.connected = false;
    });
  }
  
  joinProject(projectId) {
    if (!this.socket || !this.connected) return;
    this.socket.emit('join-project', projectId);
  }
  
  leaveProject(projectId) {
    if (!this.socket || !this.connected) return;
    this.socket.emit('leave-project', projectId);
  }
  
  subscribeToTaskUpdates(callback) {
    if (!this.socket) return;
    this.socket.on('task-updated', callback);
  }
  
  subscribeToTaskCreated(callback) {
    if (!this.socket) return;
    this.socket.on('task-created', callback);
  }
  
  subscribeToTaskDeleted(callback) {
    if (!this.socket) return;
    this.socket.on('task-deleted', callback);
  }
  
  subscribeToCommentAdded(callback) {
    if (!this.socket) return;
    this.socket.on('comment-added', callback);
  }
  
  subscribeToProjectUpdates(callback) {
    if (!this.socket) return;
    this.socket.on('project-updated', callback);
  }
  
  subscribeToNotifications(callback) {
    if (!this.socket) return;
    this.socket.on('notification', callback);
  }
  
  unsubscribeFromTaskUpdates() {
    if (!this.socket) return;
    this.socket.off('task-updated');
  }
  
  unsubscribeFromTaskCreated() {
    if (!this.socket) return;
    this.socket.off('task-created');
  }
  
  unsubscribeFromTaskDeleted() {
    if (!this.socket) return;
    this.socket.off('task-deleted');
  }
  
  unsubscribeFromCommentAdded() {
    if (!this.socket) return;
    this.socket.off('comment-added');
  }
  
  unsubscribeFromProjectUpdates() {
    if (!this.socket) return;
    this.socket.off('project-updated');
  }
  
  unsubscribeFromNotifications() {
    if (!this.socket) return;
    this.socket.off('notification');
  }
  
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }
}

// Create a singleton instance
const socketService = new SocketService();
export default socketService;
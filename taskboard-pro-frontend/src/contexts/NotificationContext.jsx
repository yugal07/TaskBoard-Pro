import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import socketService from '../services/socketService';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  
  // Fetch notifications when user is authenticated
  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }
    
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const response = await api.get('/notifications');
        setNotifications(response.data);
        setUnreadCount(response.data.filter(n => !n.isRead).length);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        setLoading(false);
      }
    };
    
    fetchNotifications();
  }, [currentUser]);
  
  // Set up real-time notification updates
  useEffect(() => {
    if (!currentUser) return;
    
    // Handler for new notifications
    const handleNewNotification = (notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Show browser notification if supported
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('TaskBoard Pro', {
          body: notification.content,
          icon: '/vite.svg' // Replace with your app icon
        });
      }
    };
    
    // Subscribe to socket events
    socketService.subscribeToNotifications(handleNewNotification);
    
    return () => {
      // Unsubscribe from socket events
      socketService.unsubscribeFromNotifications();
    };
  }, [currentUser]);
  
  // Mark a notification as read
  const markAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      
      setNotifications(prev => 
        prev.map(notification => 
          notification._id === notificationId 
            ? { ...notification, isRead: true } 
            : notification
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };
  
  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, isRead: true }))
      );
      
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };
  
  const value = {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead
  };
  
  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
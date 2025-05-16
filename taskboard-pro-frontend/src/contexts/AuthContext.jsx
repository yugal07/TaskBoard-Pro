import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/config';
import api from '../services/api';
import socketService from '../services/socketService'; // Add this

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Get ID token for backend authentication
        const token = await user.getIdToken();
        
        // Store token in localStorage
        localStorage.setItem('authToken', token);
        
        // Set auth header for API requests
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Initialize socket connection
        socketService.init();
        
        // Get or create user in our database
        try {
          const response = await api.post('/auth/user-profile', {
            uid: user.uid,
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
          });
          
          setCurrentUser({
            ...response.data,
            uid: user.uid,
          });
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      } else {
        setCurrentUser(null);
        localStorage.removeItem('authToken');
        delete api.defaults.headers.common['Authorization'];
        
        // Disconnect socket
        socketService.disconnect();
      }
      setLoading(false);
    });
    
    return () => {
      unsubscribe();
      socketService.disconnect();
    };
  }, []);
  
  const value = {
    currentUser,
    loading,
  };
  
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
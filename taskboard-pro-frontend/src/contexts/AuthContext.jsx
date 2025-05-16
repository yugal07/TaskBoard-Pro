import { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
  sendEmailVerification,
  reauthenticateWithCredential,
  updatePassword,
  EmailAuthProvider,
  signInWithRedirect
} from 'firebase/auth';
import { auth } from '../firebase/config';
import api from '../services/api';
import socketService from '../services/socketService';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [sessionExpiry, setSessionExpiry] = useState(null);
  const [rememberMe, setRememberMe] = useState(
    localStorage.getItem('rememberMe') === 'true'
  );

  // Set up session timer
  useEffect(() => {
    let sessionTimer;
    
    if (currentUser && sessionExpiry) {
      const timeLeft = new Date(sessionExpiry) - new Date();
      
      if (timeLeft > 0) {
        sessionTimer = setTimeout(() => {
          // Log the user out when session expires if remember me is not enabled
          if (!rememberMe) {
            handleSignOut();
          }
        }, timeLeft);
      }
    }
    
    return () => {
      if (sessionTimer) clearTimeout(sessionTimer);
    };
  }, [currentUser, sessionExpiry, rememberMe]);

  // Listen for authentication state changes
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
        
        // If remember me is not enabled, set session expiry (4 hours)
        if (!rememberMe) {
          const expiryTime = new Date();
          expiryTime.setHours(expiryTime.getHours() + 4);
          setSessionExpiry(expiryTime.toISOString());
          localStorage.setItem('sessionExpiry', expiryTime.toISOString());
        } else {
          setSessionExpiry(null);
          localStorage.removeItem('sessionExpiry');
        }
        
        // Get or create user in our database
        try {
          const response = await api.post('/auth/user-profile', {
            uid: user.uid,
            displayName: user.displayName || user.email.split('@')[0],
            email: user.email,
            photoURL: user.photoURL,
            emailVerified: user.emailVerified
          });
          
          setCurrentUser({
            ...response.data,
            uid: user.uid,
            emailVerified: user.emailVerified
          });
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setAuthError('Failed to fetch user profile. Please try again later.');
        }
      } else {
        setCurrentUser(null);
        localStorage.removeItem('authToken');
        localStorage.removeItem('sessionExpiry');
        setSessionExpiry(null);
        delete api.defaults.headers.common['Authorization'];
        
        // Disconnect socket
        socketService.disconnect();
      }
      setLoading(false);
    });
    
    // Check if there's a session expiry in localStorage
    const savedExpiry = localStorage.getItem('sessionExpiry');
    if (savedExpiry) {
      setSessionExpiry(savedExpiry);
    }
    
    return () => {
      unsubscribe();
      socketService.disconnect();
    };
  }, [rememberMe]);
  
  // Handle sign-in with email/password
  const handleSignIn = async (email, password, remember = false) => {
    setAuthError(null);
    setRememberMe(remember);
    localStorage.setItem('rememberMe', remember);
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch (error) {
      console.error('Error signing in:', error);
      
      // Provide user-friendly error messages
      switch (error.code) {
        case 'auth/invalid-email':
          setAuthError('The email address is invalid.');
          break;
        case 'auth/user-disabled':
          setAuthError('This account has been disabled.');
          break;
        case 'auth/user-not-found':
          setAuthError('No account found with this email.');
          break;
        case 'auth/wrong-password':
          setAuthError('Incorrect password. Please try again.');
          break;
        case 'auth/too-many-requests':
          setAuthError('Too many failed login attempts. Please try again later or reset your password.');
          break;
        default:
          setAuthError('Failed to sign in. Please check your credentials and try again.');
      }
      
      return false;
    }
  };
  
  // Handle sign-up with email/password
  const handleSignUp = async (email, password, displayName) => {
    setAuthError(null);
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update the user's profile with the display name
      if (displayName) {
        await updateProfile(userCredential.user, { 
          displayName 
        });
      }
      
      // Send email verification
      await sendEmailVerification(userCredential.user);
      
      return true;
    } catch (error) {
      console.error('Error signing up:', error);
      
      // Provide user-friendly error messages
      switch (error.code) {
        case 'auth/email-already-in-use':
          setAuthError('This email is already in use. Please sign in or use a different email.');
          break;
        case 'auth/invalid-email':
          setAuthError('The email address is invalid.');
          break;
        case 'auth/operation-not-allowed':
          setAuthError('Email/password accounts are not enabled.');
          break;
        case 'auth/weak-password':
          setAuthError('The password is too weak. Please use a stronger password.');
          break;
        default:
          setAuthError('Failed to create account. Please try again later.');
      }
      
      return false;
    }
  };
  
  // Handle sign-in with Google
  
// Handle sign-in with Google using redirect instead of popup
const handleGoogleSignIn = async () => {
  setAuthError(null);
  
  try {
    const provider = new GoogleAuthProvider();
    
    // Add scopes if needed
    provider.addScope('https://www.googleapis.com/auth/userinfo.email');
    provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
    
    // Set custom parameters for the auth provider
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    
    // Sign in with redirect instead of popup
    await signInWithRedirect(auth, provider);
    
    // The result will be handled in a useEffect hook that checks for redirect result
    return true;
  } catch (error) {
    console.error('Error initiating Google sign-in:', error);
    setAuthError(`Failed to initiate Google sign-in: ${error.message}`);
    return false;
  }
};
  
  // Handle password reset
  const handlePasswordReset = async (email) => {
    setAuthError(null);
    
    try {
      await sendPasswordResetEmail(auth, email);
      return true;
    } catch (error) {
      console.error('Error sending password reset email:', error);
      
      // Provide user-friendly error messages
      switch (error.code) {
        case 'auth/invalid-email':
          setAuthError('The email address is invalid.');
          break;
        case 'auth/user-not-found':
          setAuthError('No account found with this email.');
          break;
        default:
          setAuthError('Failed to send password reset email. Please try again later.');
      }
      
      return false;
    }
  };
  
  // Handle sign-out
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      return true;
    } catch (error) {
      console.error('Error signing out:', error);
      setAuthError('Failed to sign out. Please try again later.');
      return false;
    }
  };
  
  // Update user profile
  const updateUserProfile = async (profileData) => {
    setAuthError(null);
    
    try {
      // Update Firebase profile
      await updateProfile(auth.currentUser, profileData);
      
      // Update backend profile
      await api.put('/auth/user-profile', profileData);
      
      // Update local user state
      setCurrentUser(prev => ({
        ...prev,
        ...profileData
      }));
      
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      setAuthError('Failed to update profile. Please try again later.');
      return false;
    }
  };
  
  // Change password
  const changePassword = async (currentPassword, newPassword) => {
    setAuthError(null);
    
    try {
      // Re-authenticate the user before changing password
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email,
        currentPassword
      );
      
      await reauthenticateWithCredential(auth.currentUser, credential);
      
      // Update the password
      await updatePassword(auth.currentUser, newPassword);
      
      return true;
    } catch (error) {
      console.error('Error changing password:', error);
      
      // Provide user-friendly error messages
      switch (error.code) {
        case 'auth/wrong-password':
          setAuthError('Current password is incorrect.');
          break;
        case 'auth/weak-password':
          setAuthError('The new password is too weak. Please use a stronger password.');
          break;
        case 'auth/requires-recent-login':
          setAuthError('This operation requires a recent login. Please log out and log back in before retrying.');
          break;
        default:
          setAuthError('Failed to change password. Please try again later.');
      }
      
      return false;
    }
  };
  
  // Resend verification email
  const resendVerificationEmail = async () => {
    setAuthError(null);
    
    try {
      await sendEmailVerification(auth.currentUser);
      return true;
    } catch (error) {
      console.error('Error sending verification email:', error);
      setAuthError('Failed to send verification email. Please try again later.');
      return false;
    }
  };
  
  // Clear auth error
  const clearAuthError = () => {
    setAuthError(null);
  };
  
  const value = {
    currentUser,
    loading,
    authError,
    sessionExpiry,
    rememberMe,
    handleSignIn,
    handleSignUp,
    handleGoogleSignIn,
    handlePasswordReset,
    handleSignOut,
    updateUserProfile,
    changePassword,
    resendVerificationEmail,
    clearAuthError,
    setRememberMe
  };
  
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

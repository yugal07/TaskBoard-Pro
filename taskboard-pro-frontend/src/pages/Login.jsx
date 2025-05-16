import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import logo from '../assets/react.svg'; // for placeholder

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    message: '',
    color: ''
  });
  
  const navigate = useNavigate();
  const { 
    handleSignIn, 
    handleSignUp, 
    handleGoogleSignIn, 
    handlePasswordReset, 
    authError, 
    clearAuthError 
  } = useAuth();
  
  // Clear auth errors when switching modes
  useEffect(() => {
    clearAuthError();
    setSuccessMessage('');
  }, [isSignUp, isResetPassword, clearAuthError]);
  
  // Password strength checker
  useEffect(() => {
    if (!password || !isSignUp) return;
    
    const hasMinLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[^A-Za-z0-9]/.test(password);
    
    // Calculate strength score (0-4)
    const score = [hasMinLength, hasUpperCase, hasLowerCase, hasNumber, hasSpecialChar]
      .filter(Boolean).length - 1;
    
    let message;
    let color;
    
    switch (score) {
      case 0:
        message = 'Very weak';
        color = 'red-600';
        break;
      case 1:
        message = 'Weak';
        color = 'orange-500';
        break;
      case 2:
        message = 'Medium';
        color = 'yellow-500';
        break;
      case 3:
        message = 'Strong';
        color = 'green-500';
        break;
      case 4:
        message = 'Very strong';
        color = 'green-700';
        break;
      default:
        message = '';
        color = '';
    }
    
    setPasswordStrength({ score, message, color });
  }, [password, isSignUp]);
  
  const handleEmailAuth = async (e) => {
    e.preventDefault();
    clearAuthError();
    setSuccessMessage('');
    setLoading(true);
    
    try {
      if (isResetPassword) {
        // Handle password reset
        const success = await handlePasswordReset(email);
        if (success) {
          setSuccessMessage('Password reset email sent. Please check your inbox.');
        }
      } else if (isSignUp) {
        // Validate passwords match
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }
        
        // Validate password strength
        if (passwordStrength.score < 2) {
          throw new Error('Please choose a stronger password');
        }
        
        // Handle sign up
        const success = await handleSignUp(email, password, displayName);
        if (success) {
          setSuccessMessage('Account created successfully! Please verify your email before signing in.');
          // Switch to sign in mode after short delay
          setTimeout(() => {
            setIsSignUp(false);
          }, 3000);
        }
      } else {
        // Handle sign in
        const success = await handleSignIn(email, password, rememberMe);
        if (success) {
          navigate('/');
        }
      }
    } catch (error) {
      console.error('Authentication error:', error);
      clearAuthError(); // Clear any previous auth errors
      setSuccessMessage(''); // Clear any success messages
    } finally {
      setLoading(false);
    }
  };
  
  const handleSocialAuth = async (provider) => {
    clearAuthError();
    setSuccessMessage('');
    setLoading(true);
    
    try {
      let success;
      
      if (provider === 'google') {
        success = await handleGoogleSignIn();
      } 
      // Add other providers as needed (Facebook, GitHub, etc.)
      
      if (success) {
        navigate('/');
      }
    } catch (error) {
      console.error(`Error with ${provider} authentication:`, error);
    } finally {
      setLoading(false);
    }
  };
  
  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setIsResetPassword(false);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setDisplayName('');
    clearAuthError();
    setSuccessMessage('');
  };
  
  const toggleResetPassword = () => {
    setIsResetPassword(!isResetPassword);
    setIsSignUp(false);
    setPassword('');
    setConfirmPassword('');
    setDisplayName('');
    clearAuthError();
    setSuccessMessage('');
  };
  
  // Password requirements component
  const PasswordRequirements = () => (
    <div className="mt-2 text-xs space-y-1">
      <p className={`flex items-center ${password.length >= 8 ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
        <span className={`mr-1 ${password.length >= 8 ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
          {password.length >= 8 ? '✓' : '○'}
        </span>
        At least 8 characters
      </p>
      <p className={`flex items-center ${/[A-Z]/.test(password) ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
        <span className={`mr-1 ${/[A-Z]/.test(password) ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
          {/[A-Z]/.test(password) ? '✓' : '○'}
        </span>
        Contains uppercase letter
      </p>
      <p className={`flex items-center ${/[a-z]/.test(password) ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
        <span className={`mr-1 ${/[a-z]/.test(password) ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
          {/[a-z]/.test(password) ? '✓' : '○'}
        </span>
        Contains lowercase letter
      </p>
      <p className={`flex items-center ${/[0-9]/.test(password) ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
        <span className={`mr-1 ${/[0-9]/.test(password) ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
          {/[0-9]/.test(password) ? '✓' : '○'}
        </span>
        Contains number
      </p>
      <p className={`flex items-center ${/[^A-Za-z0-9]/.test(password) ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
        <span className={`mr-1 ${/[^A-Za-z0-9]/.test(password) ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
          {/[^A-Za-z0-9]/.test(password) ? '✓' : '○'}
        </span>
        Contains special character
      </p>
    </div>
  );
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-900 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <img src={logo} alt="TaskBoard Pro Logo" className="h-16 w-auto" />
          </div>
          <h1 className="mt-4 text-3xl font-extrabold text-gray-900 dark:text-white">
            TaskBoard Pro
          </h1>
          <h2 className="mt-6 text-xl font-bold text-gray-900 dark:text-white">
            {isResetPassword 
              ? 'Reset your password'
              : isSignUp 
                ? 'Create your account' 
                : 'Sign in to your account'}
          </h2>
        </div>
        
        {authError && (
          <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{authError}</span>
          </div>
        )}
        
        {successMessage && (
          <div className="bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{successMessage}</span>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleEmailAuth}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="input-field rounded-md w-full"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            {!isResetPassword && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  required
                  className="input-field rounded-md w-full"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                
                {/* Show password strength indicator for sign up */}
                {isSignUp && password && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between">
                      <div className="w-full bg-gray-200 dark:bg-dark-600 rounded-full h-1.5 mr-2">
                        <div 
                          className={`bg-${passwordStrength.color} h-1.5 rounded-full`} 
                          style={{ width: `${Math.min(25 * (passwordStrength.score + 1), 100)}%` }}
                        ></div>
                      </div>
                      <span className={`text-xs text-${passwordStrength.color}`}>
                        {passwordStrength.message}
                      </span>
                    </div>
                    <PasswordRequirements />
                  </div>
                )}
              </div>
            )}
            
            {/* Confirm password field for sign up */}
            {isSignUp && (
              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Confirm Password
                </label>
                <input
                  id="confirm-password"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  className={`input-field rounded-md w-full ${
                    confirmPassword && password !== confirmPassword 
                      ? 'border-red-500 dark:border-red-700' 
                      : ''
                  }`}
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                {confirmPassword && password !== confirmPassword && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    Passwords do not match
                  </p>
                )}
              </div>
            )}
            
            {/* Display name field for sign up */}
            {isSignUp && (
              <div>
                <label htmlFor="display-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Display Name
                </label>
                <input
                  id="display-name"
                  name="displayName"
                  type="text"
                  autoComplete="name"
                  className="input-field rounded-md w-full"
                  placeholder="Your name (optional)"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
            )}
          </div>
          
          {/* Remember me checkbox for sign in */}
          {!isSignUp && !isResetPassword && (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Remember me
                </label>
              </div>
              
              <div className="text-sm">
                <button
                  type="button"
                  onClick={toggleResetPassword}
                  className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
                >
                  Forgot your password?
                </button>
              </div>
            </div>
          )}
          
          <div>
            <button
              type="submit"
              disabled={loading || (isSignUp && password !== confirmPassword)}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {loading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : isResetPassword ? (
                'Send Reset Link'
              ) : isSignUp ? (
                'Create Account'
              ) : (
                'Sign In'
              )}
            </button>
          </div>
        </form>
        
        {/* Toggle between sign in and sign up */}
        {!isResetPassword && (
          <div className="text-center">
            <button
              onClick={toggleMode}
              className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
            >
              {isSignUp
                ? 'Already have an account? Sign in'
                : "Don't have an account? Sign up"}
            </button>
          </div>
        )}
        
        {/* Back to sign in from reset password */}
        {isResetPassword && (
          <div className="text-center">
            <button
              onClick={toggleResetPassword}
              className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
            >
              Back to sign in
            </button>
          </div>
        )}
        
        {/* Social login buttons */}
        {!isResetPassword && (
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-dark-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 dark:bg-dark-900 text-gray-500 dark:text-gray-400">
                  Or continue with
                </span>
              </div>
            </div>
            
            <div className="mt-6">
              <button
                type="button"
                onClick={() => handleSocialAuth('google')}
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 dark:border-dark-600 rounded-md shadow-sm bg-white dark:bg-dark-800 text-sm font-medium text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-dark-700 disabled:opacity-50"
              >
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                    <path
                      fill="#4285F4"
                      d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"
                    />
                    <path
                      fill="#34A853"
                      d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"
                    />
                    <path
                      fill="#EA4335"
                      d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"
                    />
                  </g>
                </svg>
                Sign in with Google
              </button>
            </div>
          </div>
        )}

        {/* Terms of service */}
        <div className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
          By continuing, you agree to TaskBoard Pro's
          <a href="#" className="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 mx-1">Terms of Service</a>
          and
          <a href="#" className="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 ml-1">Privacy Policy</a>
        </div>
      </div>
    </div>
  );
}
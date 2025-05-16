import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function NotFound() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [countdown, setCountdown] = useState(10);
  
  // Auto-redirect after countdown
  useEffect(() => {
    if (countdown <= 0) {
      navigate(currentUser ? '/' : '/login');
      return;
    }
    
    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [countdown, navigate, currentUser]);
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-dark-900 px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-extrabold text-primary-600 dark:text-primary-400">404</h1>
          <div className="inline-block border-r border-l border-b border-primary-600 dark:border-primary-400 px-4 py-1 -mt-2 rounded-b-md text-sm font-medium text-primary-600 dark:text-primary-400">
            Page Not Found
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          We couldn't find what you're looking for
        </h2>
        
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Sorry, the page you are looking for doesn't exist or has been moved.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
          <Link 
            to={currentUser ? '/' : '/login'} 
            className="btn-primary w-full sm:w-auto"
          >
            Go to {currentUser ? 'Dashboard' : 'Login'}
          </Link>
          
          <button 
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700"
          >
            Go Back
          </button>
        </div>
        
        <div className="mt-8 text-sm text-gray-500 dark:text-gray-400">
          <p>Redirecting to {currentUser ? 'Dashboard' : 'Login'} in {countdown} seconds...</p>
        </div>
        
        {/* Task Board Pro Illustration */}
        <div className="mt-12 flex justify-center">
          <svg 
            className="w-64 h-auto text-gray-300 dark:text-gray-700"
            viewBox="0 0 300 200" 
            fill="none" 
            stroke="currentColor"
          >
            <rect x="50" y="30" width="200" height="140" rx="4" strokeWidth="2" />
            <line x1="50" y1="60" x2="250" y2="60" strokeWidth="2" />
            <line x1="130" y1="30" x2="130" y2="170" strokeWidth="2" />
            <line x1="190" y1="30" x2="190" y2="170" strokeWidth="2" />
            
            {/* Task Cards */}
            <rect x="60" y="70" width="60" height="20" rx="2" strokeWidth="2" />
            <rect x="60" y="100" width="60" height="20" rx="2" strokeWidth="2" />
            <rect x="140" y="70" width="40" height="20" rx="2" strokeWidth="2" />
            <rect x="140" y="100" width="40" height="20" rx="2" strokeWidth="2" />
            <rect x="140" y="130" width="40" height="20" rx="2" strokeWidth="2" />
            <rect x="200" y="70" width="40" height="20" rx="2" strokeWidth="2" />
            
            {/* Column Headers */}
            <text x="90" y="50" textAnchor="middle" fontSize="10" fill="currentColor">To Do</text>
            <text x="160" y="50" textAnchor="middle" fontSize="10" fill="currentColor">In Progress</text>
            <text x="220" y="50" textAnchor="middle" fontSize="10" fill="currentColor">Done</text>
            
            {/* Question Mark */}
            <circle cx="150" cy="110" r="25" strokeWidth="2" strokeDasharray="5,5" />
            <text x="150" y="118" textAnchor="middle" fontSize="24" fill="currentColor">?</text>
          </svg>
        </div>
      </div>
    </div>
  );
}
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useProjects } from '../contexts/ProjectContext';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const { currentUser } = useAuth();
  const { projects, loading } = useProjects();
  const location = useLocation();
  
  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  
  return (
    <aside className={`${
      isOpen ? 'w-64' : 'w-20'
    } transition-width duration-300 bg-white dark:bg-dark-800 border-r dark:border-dark-700 shadow-sm`}>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b dark:border-dark-700">
          {isOpen ? (
            <h1 className="text-xl font-bold text-primary-600">TaskBoard Pro</h1>
          ) : (
            <h1 className="text-xl font-bold text-primary-600">TB</h1>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-dark-700"
          >
            {isOpen ? (
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            )}
          </button>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4">
          <Link
            to="/"
            className={`flex items-center px-4 py-2 mt-2 ${
              location.pathname === '/' 
                ? 'bg-primary-50 dark:bg-primary-900 text-primary-600 dark:text-primary-400' 
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            {isOpen && <span className="ml-3">Dashboard</span>}
          </Link>
          
          {isOpen && (
            <div className="px-4 mt-6">
              <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Projects
              </h2>
              {loading ? (
                <div className="mt-2 text-gray-500 dark:text-gray-400">Loading...</div>
              ) : projects.length === 0 ? (
                <div className="mt-2 text-gray-500 dark:text-gray-400">No projects yet</div>
              ) : (
                <ul className="mt-2 space-y-1">
                  {projects.map((project) => (
                    <li key={project._id}>
                      <Link
                        to={`/projects/${project._id}`}
                        className={`block px-2 py-1.5 rounded-md ${
                          location.pathname === `/projects/${project._id}`
                            ? 'bg-primary-50 dark:bg-primary-900 text-primary-600 dark:text-primary-400'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700'
                        }`}
                      >
                        {project.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </nav>
        
        <div className="p-4 border-t dark:border-dark-700">
          <button
            onClick={handleSignOut}
            className="flex items-center w-full px-2 py-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-md"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {isOpen && <span className="ml-3">Sign Out</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
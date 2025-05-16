import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { ProjectProvider } from './contexts/ProjectContext';
import { TaskProvider } from './contexts/TaskContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { useAuth } from './contexts/AuthContext';

// Import page components
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import ProjectDetails from './pages/ProjectDetails';
import NotFound from './pages/NotFound';
import Layout from './components/Layout';

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <ProjectProvider>
            <TaskProvider>
              <NotificationProvider>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={
                  <ProtectedRoute>
                    <Layout>
                      <Dashboard />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/projects/:projectId" element={
                  <ProtectedRoute>
                    <Layout>
                      <ProjectDetails />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="*" element={<NotFound />} />
              </Routes>
              </NotificationProvider>
            </TaskProvider>
          </ProjectProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
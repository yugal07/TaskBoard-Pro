import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { ProjectProvider } from './contexts/ProjectContext';
import { TaskProvider } from './contexts/TaskContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { AutomationProvider } from './contexts/AutomationContext';
import { useAuth } from './contexts/AuthContext';

// Import page components
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import ProjectDetails from './pages/ProjectDetails';
import ProjectAutomations from './pages/ProjectAutomations';
import ProjectAnalytics from './pages/ProjectAnalytics';
import ProjectReports from './pages/ProjectReports';
import ProjectSettings from './pages/ProjectSettings';
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
                <AutomationProvider>
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
                    <Route path="/projects/:projectId/automations" element={
                      <ProtectedRoute>
                        <Layout>
                          <ProjectAutomations />
                        </Layout>
                      </ProtectedRoute>
                    } />
                    {/* New Analytics Routes */}
                    <Route path="/projects/:projectId/analytics" element={
                      <ProtectedRoute>
                        <Layout>
                          <ProjectAnalytics />
                        </Layout>
                      </ProtectedRoute>
                    } />
                    <Route path="/projects/:projectId/reports" element={
                      <ProtectedRoute>
                        <Layout>
                          <ProjectReports />
                        </Layout>
                      </ProtectedRoute>
                    } />
                    <Route path="/projects/:projectId/settings" element={
                      <ProtectedRoute>
                        <Layout>
                          <ProjectSettings />
                        </Layout>
                      </ProtectedRoute>
                    } />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </AutomationProvider>
              </NotificationProvider>
            </TaskProvider>
          </ProjectProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
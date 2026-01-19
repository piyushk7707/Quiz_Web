import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import AuthProvider from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './routes/ProtectedRoute';
import QuizProtectedRoute from './routes/QuizProtectedRoute';
import Navbar from './components/Navbar';
import Login from './auth/Login';
import Register from './auth/Register';
import Dashboard from './dashboard/Dashboard';
import QuizStart from './quiz/QuizStart';
import QuizQuestion from './quiz/QuizQuestion';
import QuizResult from './quiz/QuizResult';
import Profile from './profile/Profile';
import EditProfile from './profile/EditProfile';
import Rewards from './rewards/Rewards';
import Friends from './friends/Friends';
import Chat from './chat/Chat';
import './App.css';
import './darkMode.css';

// Wrapper component to pass testId from URL to QuizProtectedRoute
const QuizQuestionWrapper = () => {
  const { testId } = useParams();
  return (
    <QuizProtectedRoute testId={testId}>
      <QuizQuestion />
    </QuizProtectedRoute>
  );
};

// Layout wrapper that includes Navbar for protected routes
const ProtectedLayout = ({ children }) => {
  return (
    <>
      <Navbar />
      <main className="main-content">
        {children}
      </main>
    </>
  );
};

// Forgot Password placeholder page
const ForgotPassword = () => (
  <div style={{
    maxWidth: '420px',
    margin: '60px auto',
    padding: '40px',
    background: 'white',
    borderRadius: '16px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
    textAlign: 'center'
  }}>
    <h2 style={{ marginBottom: '20px' }}>🔒 Reset Password</h2>
    <p style={{ color: '#666', marginBottom: '20px' }}>
      This feature is coming soon. Please contact the administrator to reset your password.
    </p>
    <a href="/login" style={{
      display: 'inline-block',
      padding: '12px 24px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      borderRadius: '8px',
      textDecoration: 'none',
      fontWeight: '600'
    }}>← Back to Login</a>
  </div>
);

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Auth Routes - No Navbar */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Protected Routes - With Navbar */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <ProtectedLayout>
                    <Dashboard />
                  </ProtectedLayout>
                </ProtectedRoute>
              }
            />

            {/* Quiz Routes - All Protected */}
            <Route
              path="/quiz"
              element={
                <ProtectedRoute>
                  <ProtectedLayout>
                    <QuizStart />
                  </ProtectedLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/quiz/test/:testId"
              element={
                <ProtectedRoute>
                  <QuizQuestionWrapper />
                </ProtectedRoute>
              }
            />

            <Route
              path="/quiz/results/:testId"
              element={
                <ProtectedRoute>
                  <ProtectedLayout>
                    <QuizResult />
                  </ProtectedLayout>
                </ProtectedRoute>
              }
            />

            {/* Profile Routes - All Protected */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProtectedLayout>
                    <Profile />
                  </ProtectedLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile/edit"
              element={
                <ProtectedRoute>
                  <ProtectedLayout>
                    <EditProfile />
                  </ProtectedLayout>
                </ProtectedRoute>
              }
            />

            {/* Rewards Routes - All Protected */}
            <Route
              path="/rewards"
              element={
                <ProtectedRoute>
                  <ProtectedLayout>
                    <Rewards />
                  </ProtectedLayout>
                </ProtectedRoute>
              }
            />

            {/* Friends Routes - All Protected */}
            <Route
              path="/friends"
              element={
                <ProtectedRoute>
                  <ProtectedLayout>
                    <Friends />
                  </ProtectedLayout>
                </ProtectedRoute>
              }
            />

            {/* Chat Routes - All Protected */}
            <Route
              path="/chat"
              element={
                <ProtectedRoute>
                  <ProtectedLayout>
                    <Chat />
                  </ProtectedLayout>
                </ProtectedRoute>
              }
            />

            {/* Default Routes */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

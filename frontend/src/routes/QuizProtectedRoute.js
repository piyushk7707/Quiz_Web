import React, { useContext, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api/client';

/**
 * QuizProtectedRoute Component
 * 
 * Specialized route protection for quiz pages (/quiz/:testId)
 * - Validates testId parameter against actual test data
 * - Prevents access to quiz pages without a valid test
 * - Redirects to /quiz if test not found
 */
const QuizProtectedRoute = ({ children, testId }) => {
  const { user, loading } = useContext(AuthContext);
  const [isValidTest, setIsValidTest] = useState(false);
  const [isCheckingTest, setIsCheckingTest] = useState(true);
  const token = localStorage.getItem('access_token');

  // All hooks at the top - React hook rules
  useEffect(() => {
    const validateTest = async () => {
      try {
        setIsCheckingTest(true);
        const response = await api.get(`/quiz/test/${testId}/`);
        if (response.data && response.data.id === parseInt(testId)) {
          setIsValidTest(true);
        } else {
          setIsValidTest(false);
        }
      } catch (err) {
        setIsValidTest(false);
      } finally {
        setIsCheckingTest(false);
      }
    };

    if (testId) {
      validateTest();
    } else {
      setIsCheckingTest(false);
      setIsValidTest(false);
    }
  }, [testId]);

  // Conditional rendering after all hooks
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#667eea',
        color: 'white',
      }}>
        <div>
          <div style={{
            border: '4px solid rgba(255,255,255,0.3)',
            borderTop: '4px solid white',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px',
          }}></div>
          <p>Loading...</p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!user || !token) {
    return <Navigate to="/login" />;
  }

  if (isCheckingTest) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#667eea',
        color: 'white',
      }}>
        <div>
          <div style={{
            border: '4px solid rgba(255,255,255,0.3)',
            borderTop: '4px solid white',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px',
          }}></div>
          <p>Validating test...</p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!isValidTest) {
    return <Navigate to="/quiz" />;
  }

  return children;
};

export default QuizProtectedRoute;

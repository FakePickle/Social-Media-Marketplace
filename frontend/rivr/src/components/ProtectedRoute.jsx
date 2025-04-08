import React, { useContext, useEffect } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useContext(AuthContext);
  console.log("ProtectedRoute isAuthenticated:", isAuthenticated); // Debugging line
  const navigate = useNavigate()
  useEffect(() => {
    if (!isAuthenticated) {
      console.log("User is not authenticated, redirecting to /auth"); // Debugging line
      navigate('/auth');
    }
  }, [isAuthenticated]);
  return children;
};

export default ProtectedRoute;
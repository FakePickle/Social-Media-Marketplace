import React, { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useContext(AuthContext);

  if (!isAuthenticated) {
    Navigate("/auth"); // Redirect (use React Router in practice)
    return null;
  }
  return children;
};

export default ProtectedRoute;

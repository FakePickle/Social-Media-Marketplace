import React, { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate()
  if (!isAuthenticated) {
    navigate("/auth"); 
    return null;
  }
  return children;
};

export default ProtectedRoute;
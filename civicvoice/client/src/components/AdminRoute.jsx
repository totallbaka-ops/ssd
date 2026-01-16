// src/components/AdminRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const AdminRoute = ({ children }) => {
  const location = useLocation();

  // Get user info from localStorage
  const userString = localStorage.getItem('civic_user');
  const user = userString ? JSON.parse(userString) : null;
  const token = localStorage.getItem('civic_token');

  // Check if user is logged in AND is an admin
  // (We use 'admin' OR 'department' based on your controller)
  if (token && user && (user.role === 'admin' || user.role === 'department')) {
    // All checks pass, show the protected admin page
    return children;
  }

  // Not logged in, or not an admin
  // Redirect to the Admin login page
  return <Navigate to="/admin/login" state={{ from: location }} replace />;
};

export default AdminRoute;
import { Navigate } from "react-router-dom";

// Siempre '/login' — React Router agrega el basename automáticamente
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('jwt_token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default PrivateRoute;
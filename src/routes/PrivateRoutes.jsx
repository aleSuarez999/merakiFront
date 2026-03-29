import { Navigate } from "react-router-dom";

const pathLogin = import.meta.env.VITE_PRODUCTION === 'true' 
  ? '/help2/merakiApp/login' 
  : '/login';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('jwt_token');

  if (!token) {
    return <Navigate to={pathLogin} replace />;
  }

  return children;
};

export default PrivateRoute;
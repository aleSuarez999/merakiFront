import { Navigate } from "react-router-dom";

const PRODUCTION = import.meta.env.VITE_PRODUCTION

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('jwt_token');

  if (!token) {
    const alreadyRedirected = sessionStorage.getItem('already_redirected');
    if (!alreadyRedirected) {
      localStorage.setItem('logout_reason', 'expirado');
      sessionStorage.setItem('already_redirected', 'true');
    }
    return <Navigate to={`(${PRODUCTION}) ? "/login" : "login"`} />;
  }

  sessionStorage.removeItem('already_redirected');
  return children;
};

export default PrivateRoute;

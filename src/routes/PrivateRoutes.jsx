import { Navigate } from "react-router-dom";

const pathLogin = import.meta.env.VITE_PRODUCTION === 'true' ? '/help2/merakiApp/login' : '/login';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('jwt_token');
  const alreadyRedirected = localStorage.getItem('already_redirected');

  if (!token) {
    if (alreadyRedirected) {
        return
      localStorage.setItem('logout_reason', 'no token');
      localStorage.setItem('already_redirected', 'true');
      return <Navigate to={pathLogin} />;
    }
    else if (isExpired(token))
    {
      return
    if (!alreadyRedirected) {
        localStorage.setItem('logout_reason', 'token-expirado');
        localStorage.setItem('already_redirected', 'true');
        return <Navigate to={pathLogin} />;
      }
    }

    // Si ya redirigió, no lo hace de nuevo
    return null;
  }

  sessionStorage.removeItem('already_redirected');
  return children;
};

export default PrivateRoute;
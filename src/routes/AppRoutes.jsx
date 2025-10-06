import { BrowserRouter, Route, Routes } from 'react-router';
import Layout from '../layout/Layout';
import DashBoard from '../pages/Dashboard';
import Login from '../components/Login';
import PrivateRoute from './PrivateRoutes';
import "../styles/main.scss";
import Provider from '../context/Provider';
import ApplianceStatus from '../pages/ApplianceStatus';

//detecto si estoy en produccion o desarrollo
const isProduction = import.meta.env.VITE_PRODUCTION === 'true';
const basename = isProduction ? '/help2/merakiApp' : '/';
const pathLogin = isProduction ? 'login' : '/login';


function AppRoutes() {
  return (
    <BrowserRouter basename={basename} >
      <Routes>
        <Route element={<Layout />}>
          <Route path={pathLogin} element={<Login />} />
          <Route 
            path="/organizations/:orgId" 
            element={
              <Provider>
                <PrivateRoute>
                  <ApplianceStatus />
                </PrivateRoute>
              </Provider>
            }
          />
          
          <Route
            path="/"
            element={
              <Provider>
                <PrivateRoute>
                  <DashBoard />
                </PrivateRoute>
              </Provider>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;

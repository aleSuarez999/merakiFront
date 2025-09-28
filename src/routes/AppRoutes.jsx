import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Layout from '../layout/Layout';
import DashBoard from '../pages/Dashboard';
import Login from '../components/Login';
import PrivateRoute from './PrivateRoutes';
import "../styles/main.scss";
import Provider from '../context/Provider';

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/login" element={<Login />} />
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

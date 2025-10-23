import { BrowserRouter, Route, Routes } from 'react-router';
import Layout from '../layout/Layout';
import DashBoard from '../pages/Dashboard';
import Login from '../components/Login';
import Devices from '../pages/Devices';
import Uplinks from '../pages/Uplinks';
import "../styles/main.scss";
import Provider from "../context/Provider"
import UplinkStatuses from '../pages/UplinkStatuses';
const isProduction = import.meta.env.VITE_PRODUCTION === 'true';
const basename = isProduction ? '/help2/merakiApp' : '/';

function AppRoutes() {
  return (
    <BrowserRouter basename={basename}>
      <Routes>
        {/* Login fuera del layout */}
       

        {/* Rutas protegidas dentro del layout */}
          <Route path="/login" element={<Login />} />
        <Route element={<Provider><Layout /></Provider>}>
          
            <Route path="/" element={<DashBoard />} />
            <Route path="/Devices" element={<Devices />} />
            <Route path="/Uplinks" element={<Uplinks />} />
            <Route path="/UplinkStatuses/:orgId" element={<UplinkStatuses />} />
          
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
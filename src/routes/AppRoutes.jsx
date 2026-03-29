import { BrowserRouter, Route, Routes } from 'react-router';
import Layout from '../layout/Layout';

import Login from '../components/Login';
import Devices from '../pages/Devices';
import Uplinks from '../pages/Uplinks';
import "../styles/main.scss";
import Provider from "../context/Provider"
import UplinkStatuses from '../pages/UplinkStatuses';
//import NetworkVlans from '../pages/NetworkVlans';
import NetworkVlans2 from '../pages/NetworkVlans2';
import NetworkSsdis from '../pages/NetworkSsids';
import { NetworkProvider } from '../context/networkContext';
import PrivateRoute from './PrivateRoutes';
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
          
            <Route path="/" element={<PrivateRoute><Uplinks /></PrivateRoute>} />
            <Route path="/Devices" element={<PrivateRoute><Devices /></PrivateRoute>} />
            <Route path="/Uplinks" element={<PrivateRoute><Uplinks /></PrivateRoute>} />
            <Route path="/UplinkStatuses/:orgId" element={<PrivateRoute><UplinkStatuses/> </PrivateRoute>} />
            <Route path="/networks/:networkId/vlans" element={<PrivateRoute><NetworkVlans2 /></PrivateRoute>} />


            <Route path="/networks/:networkId/wireless/ssids" element={<NetworkProvider><NetworkSsdis /></NetworkProvider>} />
          

        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
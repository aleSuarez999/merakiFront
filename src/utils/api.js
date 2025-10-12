import axios from "axios";

const isProduction = import.meta.env.VITE_PRODUCTION === 'true';
const baseURL = isProduction ? 'http://consultasnoc.int.fibercorp.com.ar/help2/merakiApp/api' : 'http://localhost:4000/api';
const locationHREF = isProduction ? '/help2/merakiApp/login' : '/login';

const axiosInstance = axios.create({
  //baseURL: "http://localhost:4000/api"
  baseURL: `${baseURL}`
});

// Interceptor para agregar el token en cada request
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwt_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores de autenticación
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      localStorage.removeItem('jwt_token');
      localStorage.setItem('logout_reason', 'expirado');
      window.location.href = `${locationHREF}`;
      
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;


export const getOrgs = async () => {
    const resp = await axiosInstance.get("/organizations")
    //console.log(resp.data.orgs)
    if (resp.data.ok)
    {
        //{ok=true, orgs=[]}
        return resp.data.orgs
    }
}

export const getNetworksByOrg = async (orgId) => {
    try{

        const resp = await axiosInstance.get(`/organizations/${orgId}/networks`)
        if (resp.data.ok)
        {
            return resp.data.networks
        }
    }
    catch(error) {
        console.error(error.message)
        return []
    }

}

export const getOrganizationDevicesStatusesOverview = async(orgId) => {

    try {

        const resp = await axiosInstance.get(`/organizations/${orgId}/devices/statuses/overview`)

        //console.log("uplinkStatuses", resp.data)
        if (resp.data.ok)
        {
            return resp.data.statuses
        }
        else{
           // console.log("NOOK", resp.data.ok)
            
            const res = {
                    error: true,
                    counts: {
                        byStatus:{
                            "alerting":0,
                            "dormant":0,
                            "offline":0,
                            "online":0
                        }
                    }
                }
        return res    
        }
    } catch (error) {
       // console.log(`No hay permiso en orgId ${orgId}`)
            const res = {
                    error: true,
                    counts: {
                        byStatus:{
                            "alerting":0,
                            "dormant":0,
                            "offline":0,
                            "online":0
                        }
                    }
                }
        return res
    }
}

export const getOrganizationApplianceUplinkStatuses = async(orgId) => {
     //console.log("appliance consult:", orgId)
    try {
        
        const resp = await axiosInstance.get(`/organizations/${orgId}/appliance/uplink/statuses`)

        console.log("uplinkStatuses", resp.data.networks)
        if (resp.data.ok)
        {
            //console.log("ok", resp.data.ok)
            const res = {
                    ok: true,
                    networks: resp.data.networks
            }
            return res

        }
        else{
           //console.log("NOOK", resp.data.ok)
            
            const res = {
                    ok: false,
                    counts: {
                        byStatus:{
                            "alerting":0,
                            "dormant":0,
                            "offline":0,
                            "online":0
                        }
                    }
                }
        return res    
        }
    } catch (error) {
       // console.log(`No hay permiso en orgId ${orgId}`)
            const res = {
                    ok: false,
                    counts: 0
                }
        return res
    }
}


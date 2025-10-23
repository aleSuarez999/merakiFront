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

        //console.log("uplinkStatuses", resp.data.statuses)
        if (resp.data.ok)
        {
            //return resp.data.statuses
              const {alerting, dormant, offline, online} = resp.data.statuses.counts.byStatus
              const res = {
                    ok: true,
                    counts: {
                        byStatus:{
                            "online":online,
                           // "alerting":alerting
                          //  "dormant":0,
                            "offline":offline
                        }
                    }
                }
            return res 
        }
        else{
           // console.log("NOOK", resp.data.ok)
            
            const res = {
                    error: true,
                    counts: {
                        byStatus:{
                            "alerting":0,
                          //  "dormant":0,
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
                           // "dormant":0,
                            "offline":0,
                            "online":0
                        }
                    }
                }
        return res
    }
}

export const getOrganizationApplianceUplinkStatuses = async (orgId) => {
  try {
    const resp = await axiosInstance.get(`/organizations/${orgId}/appliance/uplink/statuses`);
    const networks = Array.isArray(resp.data.networks) ? resp.data.networks : [];

    return {
      ok: true,
      networks
    };
  } catch (error) {
    console.error(`Error: ${error.message}`);
    return {
      ok: false,
      networks: []
    };
  }
};

export const getOrganizationApplianceUplinkStatusesd = async(orgId) => {
     //console.log("appliance consult:", orgId)
     let res = []
    try {
        const resp = await axiosInstance.get(`/organizations/${orgId}/appliance/uplink/statuses`)
        
        const networks = Array.isArray(resp.data.networks) ? resp.data.networks : [];

     //   console.log("uplinkStatuses", orgId, networks)
    //    if (resp.data.ok)
        {
            console.log("ok", resp.data.ok)
             return {
                    ok: true,
                    networks
            }
      
        }
     
            
          
       // }
             
    } catch (error) {
        console.log(`Errpr ${error.message}`)
            const res = {
                    ok: false,
                    networks: [],
                    counts: 0
                }
        return res
    }
}


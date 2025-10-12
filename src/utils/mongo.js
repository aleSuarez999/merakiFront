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


export const postOrg = async (body) => {
   
    console.log("mando body", body)
    const resp = await axiosInstance.post("/organizations", body)
    return resp.data
}

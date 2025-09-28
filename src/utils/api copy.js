import axios from "axios"

/*
const axiosInstance = axios.create({
    baseURL: "http://localhost:4000/api"
})
*/
const API_KEY = import.meta.env.VITE_API_KEY
/*
sin jwt
const axiosInstance = axios.create({
    baseURL: "http://localhost:4000/api",
    headers: {
    'x-api-key': API_KEY
  }
})
*/


const token = localStorage.getItem('jwt_token');

const axiosInstance = axios.create({
  baseURL: 'http://localhost:4000/api',
  headers: {
    Authorization: `Bearer ${token}`
  }
});


export const getOrgs = async () => {
    const resp = await axiosInstance.get("/organizations")
    //console.log(resp.data.orgs)
    if (resp.data.ok)
    {
        //{ok=true, orgs=[]}
        return resp.data.orgs
    }
}

export const orgStatuses = async(orgId) => {
    // console.log("satatuses", orgId)
    try {
        
        const resp = await axiosInstance.get(`/organizations/${orgId}/devices/statuses/overview`)
       // console.log("satatuses", resp.data.statuses)
        if (resp.data.ok)
        {
           // console.log("ok", resp.data.ok)
            //{ok=true, orgs=[]}
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


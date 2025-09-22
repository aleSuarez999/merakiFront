import axios from "axios"

const axiosInstance = axios.create({
    baseURL: "http://localhost:4000/api"
})

export const getOrgs = async () => {
    const resp = await axiosInstance.get("/organizations")
    //console.log(resp.data.orgs)
    if (resp.data.ok)
    {
        //{ok=true, orgs=[]}
        return resp.data.orgs
    }
}
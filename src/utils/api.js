import axios from "axios"

const axiosInstance = axios.create({
    baseURL: "http://localhost:4000"
})

export const getOrgs = async () => {
    const resp = await axiosInstance.get("/organizations")
    if (resp.data.ok)
    {
        //viene ok
        console.info("REspuesta api Orgs:  ", resp.data)
        return resp.data
    }
}
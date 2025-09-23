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

export const orgStatuses = async(orgId) => {
    // console.log("satatuses", orgId)
    const resp = await axiosInstance.get(`/organizations/${orgId}/devices/statuses/overview`)
    //console.log("satatuses", resp.data)
    if (resp.data.ok)
    {
        console.log("ok", resp.data.ok)
        //{ok=true, orgs=[]}
        return resp.data.statuses
    }
}


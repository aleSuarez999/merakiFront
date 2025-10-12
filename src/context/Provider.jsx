import { useEffect, useState } from "react"

import Context from "./Context"
import { getNetworksByOrg, getOrgs } from "../utils/api"
import { postOrg } from "../utils/mongo"

function Provider({children}) {

  const [orgs, setOrgs] = useState([])
  const [networks, setNetworks] = useState([])

    useEffect(() => {
       getOrgs()
       .then(data => setOrgs(data))
       //.then(() => console.log(orgs))

      

       .catch(error => { console.log(error.message)} )  
    }, [])

   
    useEffect(() => {
        if (orgs.length < 1)
            return
        const allNetworks = [];
      
            console.log("ORGS", orgs)
            /* ver esto
            orgs.map(async (org) => {
               
                const redes = await getNetworksByOrg(org.id)
                postOrg({id: org.id, name: org.name, redes})
                .then(
                allNetworks.push({orgId: org.id, orgName: org.name, redes})
            )
                //console.info("red ", org.id, org.name, redes)
                .catch((error) => console.error(error.message) )
            })
                */
   //    }
      // networks(orgs)

       setNetworks(allNetworks)

    }, [orgs])

     return (
        <Context.Provider value={orgs}>
            {children}
        </Context.Provider>
  )
}

export default Provider
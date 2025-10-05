import { useEffect, useState } from "react"

import Context from "./Context"
import { getOrgs } from "../utils/api"

function Provider({children}) {

  const [orgs, setOrgs] = useState([])

    useEffect(() => {
       getOrgs()
       .then(data => setOrgs(data))
       //.then(() => console.log(orgs))
       .catch(error => { console.log(error.message)} )  
    }, [])
    
     return (
        <Context.Provider value={orgs}>
            {children}
        </Context.Provider>
  )
}

export default Provider
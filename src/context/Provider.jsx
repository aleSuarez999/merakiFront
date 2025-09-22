import { useEffect, useState } from "react"

import Context from "./Context"
import { getOrgs } from "../utils/api"

function Provider({children}) {

  const [orgs, setOrgs] = useState([])

    useEffect(() => {
       getOrgs()
       .then(data => console.log(data))
       .then(data => setOrgs(data))
       .catch(error => { console.log(error.message)} )  
    }, [])
    
     return (
        <Context.Provider value={
          orgs
          }>
            {children}
        </Context.Provider>
  )
}

export default Provider
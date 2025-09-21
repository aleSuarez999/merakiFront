import React, { useEffect, useState } from 'react'
import { NavLink } from 'react-router'
import { getOrgs } from '../utils/api'
// aside conformato por las organizaciones
function Aside() {

  const [orgs, setOrgs] = useState([])  
    // lista de orgs
    useEffect(() => {
      getOrgs()
      .then(obj => setOrgs(obj))
      .catch(err => console.error(err))
      .finally(
        )
      
    }, [])

  return (
    <aside>
        <nav>
          {
            orgs.map(
                    (org) =>  

                 
                        <NavLink key={org.orgId} to={`/category/${org.orgId}`} >{org.name}</NavLink>
                   
                  )
          }
        </nav>
    </aside>
  )
}

export default Aside
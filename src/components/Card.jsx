import React, { useContext } from 'react'
import Text from './Text'
import { NavLink, useNavigate } from 'react-router'
import Context from '../context/Context';

import Box from './Box';
import OrgStatus from './OrgStatus';
import OrgStatusChart from './OrgStatusChart';

function Card({
    org,
    ...props

}) {

  const navigate = useNavigate();
 // console.log(org)
  return (
      <>
         
          <Box className="card__body">
              <NavLink to={`/organizations/${org.id}`} >

              </NavLink>
              <Text as="p" className="card__title">{org.name}</Text>
              
              <Box className="d-flex counter__container jcc">
                
                <OrgStatusChart org={org} />
              </Box>
          </Box>
    </>
  )
}

export default Card
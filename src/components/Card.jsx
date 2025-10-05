import React, { useContext } from 'react'
import Text from './Text'
import { NavLink, useNavigate } from 'react-router'
import Context from '../context/Context';

import Box from './Box';
import OrgStatus from './OrgStatus';


function Card({
    org,
    onClick,
    ...props
    

}) {

/*
{
    "counts": {
        "byStatus": {
            "online": 0,
            "alerting": 0,
            "offline": 0,
            "dormant": 0
        }
    }
}
*/


  const navigate = useNavigate();
 // console.log(org)
  return (
      <>
         
          <Box className="card__body" onClick={onClick}>

              <Text as="p" className="card__title">{org.name}</Text>
              
              <Box className="d-flex card__status">
                <OrgStatus org={org} />
                
              </Box>
          </Box>
    </>
  )
}

export default Card
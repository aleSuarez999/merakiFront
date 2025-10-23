import React, { useContext } from 'react'
import Text from './Text'
import { NavLink, useNavigate } from 'react-router'

import Box from './Box';

import DeviceStatus from './DeviceStatus';


function Card({
    org,
    onClick,
    ...props
    

}) {


  const navigate = useNavigate();
  //console.log(org)
  return (
      <>
         
          <Box className="card__body" onClick={onClick}>

              <Text as="p" className="card__title">{org.name}</Text>
              
              <Box className="d-flex card__status">
                <DeviceStatus org={org} />
                
              </Box>
          </Box>
    </>
  )
}

export default Card
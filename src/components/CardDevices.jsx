import React, { useContext } from 'react'
import Text from './Text'
import { NavLink, useNavigate } from 'react-router'

import Box from './Box';

//import DeviceStatus from './DeviceStatus';
import DeviceStatusAutoUpdate from './DeviceStatusAutoUpdate';


function CardDevices({
    org,
    onClick,
    ...props
    

}) {


  const navigate = useNavigate();

  return (
      <>
         
          <Box className="card__body" onClick={onClick}>

              <Text as="p" className="card__title">{org.name}</Text>
              
              <Box className="d-flex card__status">
                <DeviceStatusAutoUpdate org={org} />
                
              </Box>
          </Box>
    </>
  )
}

export default CardDevices
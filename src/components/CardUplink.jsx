import React, { useContext } from 'react'
import Text from './Text'
import { NavLink, useNavigate } from 'react-router'

import Box from './Box';

import UplinkStatus from './UplinkStatus';


function CardUplink({
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
                <UplinkStatus org={org} />
                
              </Box>
          </Box>
    </>
  )
}

export default CardUplink
import React, { useContext, useState } from 'react'
import Text from './Text'
import { NavLink, useNavigate } from 'react-router'

import Box from './Box';

import DeviceStatusAutoUpdate from './DeviceStatusAutoUpdate';


function CardVlans({
    vlans,
    onClick,
    ...props

}) {

  console.log("netvla1n", vlans)

  const navigate = useNavigate();

  return (
      
         
          <Box className="card__vlans__body" onClick={onClick}>

              <Text as="p" className="card__title">{vlans.name}</Text>
              {
              (vlans) && (
                    
                    <Box key={vlans.interfaceId} className="vlan_container">
                      <h5>VlanName: - {vlans.name}</h5>  
                      <ul>
                        <li>Ip: {vlans.applianceIp} / Net: {vlans.subnet}</li>
                        <li>Vlan: {vlans.id}</li>
                      </ul>
                    </Box>
              
                )              
           }
          </Box>
    
  )
}

export default CardVlans
import React, { useContext, useState } from 'react'
import Text from './Text'
import { NavLink, useNavigate } from 'react-router'

import Box from './Box';

import DeviceStatusAutoUpdate from './DeviceStatusAutoUpdate';


function CardVlans({
    vlans,
    updateVlanField,
    selectedData,
    isSelected,
    onClick,
    ...props

}) {

  //console.log("netvla1n", vlans)

  const navigate = useNavigate();

  return (
      
         
          <Box className="card__vlans__body" onClick={onClick}>

           
              {
              (vlans) && (
                    
                    <Box key={vlans.interfaceId} className="vlan_container">
                      <h5>Id: {vlans.id} VlanName: - {vlans.name}</h5>  
                      <ul>
                        <li><input
                      type="text"
                      value={isSelected ? selectedData.applianceIp : vlans.applianceIp}
                      onChange={(e) => updateVlanField(vlans.id, 'applianceIp', e.target.value)}
                      disabled={!isSelected}
                    /></li>
                        <li><input
                      type="text"
                      value={isSelected ? selectedData.subnet : vlans.subnet}
                      onChange={(e) => updateVlanField(vlans.id, 'subnet', e.target.value)}
                      disabled={!isSelected}
                    /></li>
                      </ul>
                    </Box>
              
                )              
           }
          </Box>
    
  )
}

export default CardVlans
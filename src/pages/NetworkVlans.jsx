

import { useEffect, useState } from 'react'


import { NavLink, useParams } from 'react-router'
import {  getNetworkVlans } from '../utils/api'
import Box from '../components/Box'

export default function NetworkVlans  ()  {

  const [loading, setLoading] = useState(true)
  const [networkVlans, setnetworkVlans] = useState([])
  
  const { networkId } = useParams();

  useEffect(() => {
    const fetchVlans = async () => {
      const res = await getNetworkVlans(networkId);
      console.log ("ver", res)
      setnetworkVlans(res)
    };
    
    fetchVlans()
    setLoading(false)

  }, [networkId]);


  if (loading) {
    //return <div>Cargando productos...</div>
  }

  if (loading) return <p>Cargando vlans...</p>;

  return (
    <Box className="network-container">
      
      {
        (networkVlans) && (
        networkVlans.map((net, index) => (
        
        <Box key={index} className="vlan_container">
          <h5>VlanName: - {net.name}</h5>  
          <ul>
            <li>Ip: {net.applianceIp} / Net: {net.subnet}</li>
            <li>Vlan: {net.id}</li>
          </ul>
        </Box>
      ))
    )
    }
    </Box>
  );
}

  


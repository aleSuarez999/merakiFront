

import { useEffect, useState } from 'react'


import { useParams } from 'react-router'
import {  getOrganizationApplianceUplinkStatusesAll } from '../utils/api'
import Box from '../components/Box'

export default function UplinkStatuses() {

  const [loading, setLoading] = useState(true)
  const [uplinks, setUplinks] = useState([])
  
  const { orgId } = useParams();

  useEffect(() => {
    const fetchUplinks = async () => {
      const res = await getOrganizationApplianceUplinkStatusesAll(orgId);
      console.log ("ver", res)
      if (res.ok) {


      const sorted = res.networks.sort((a, b) => {
        const aFailed = a.uplinks.some(u => u.status === 'failed');
        const bFailed = b.uplinks.some(u => u.status === 'failed');
        return bFailed - aFailed; // los fallados primero
      });


        setUplinks(sorted);
        console.log("uplnikeses", sorted)
        setLoading(false)

      }
    };
    
    fetchUplinks(); // primera carga
    const interval = setInterval(fetchUplinks, 20000); // cada 20 segundos

    return () => clearInterval(interval); // limpieza

  }, [orgId]);


  if (loading) {
    //return <div>Cargando productos...</div>
  }

  if (loading) return <p>Cargando uplinks...</p>;

  return (
    <Box className="uplink-container">
      <h2>Uplinks por red - Organización {orgId}</h2>
      {uplinks.map((net, index) => (
        <Box key={index} style={{ border: '1px solid #ccc', margin: '10px', padding: '10px' }}>
          
          <h4>Network ID: {net.name}</h4>
          <p>Serial: {net.serial}</p>
          <p>Uplinks activos: {net.activeUplinkCount} / {net.uplinkCount}</p>
          <ul>
            {net.uplinks.map((uplink, i) => (
              <li key={i} className={uplink.status === 'failed' ? 'down' : uplink.status === 'active' ? 'active' : 'unknown'}>
                {uplink.interface}: {uplink.status} Ip: {uplink.ip} Pública: {uplink.publicIp}
              </li>
            ))}
          </ul>
        </Box>
      ))}
    </Box>
  );
}

  


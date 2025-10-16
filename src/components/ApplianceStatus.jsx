
import Text from './Text'
import Card from './Card'
import { useContext, useEffect, useState } from 'react'

import Box from './Box'
import Context from '../context/Context'
import { getOrganizationApplianceUplinkStatuses } from '../utils/api'
import { useParams } from 'react-router'



export default function ApplianceStatus({orgId}) {

  const [loading, setLoading] = useState(true);

  const [redes, setRedes] = useState([]);

  useEffect(() => {
    getOrganizationApplianceUplinkStatuses(orgId)
      .then((data) => {
        setLoading(false);
        setRedes(data?.networks || []);
        //console.log('Uplink data:', data);
      })
      .catch((error) => {
        console.error('Error al obtener uplinks:', error);
        setLoading(false);
      });
  }, [orgId]);




  if (loading) return <div>Cargando estado de uplinks...</div>;
  

 
  return (
    <div className="appliance-status">
      {redes.length === 0 ? (
        <div>No se encontraron datos de uplinks para esta organización.</div>
      ) : (
            redes.map((item, idx) => (
        <Box key={idx} className="uplink-card">
                <Text tag="h4">Network ID: {item.networkId}</Text>
                <Text><strong>Serial:</strong> {item.serial}</Text>
            {item.estado.map((uplink, i) => (
                <ul>
                  <li key={i}>
                    <strong>{uplink.interface}</strong> - IP: {uplink.ip} - Estado: {uplink.status}
                  </li>
                </ul>
              ))}
          </Box>
        ))
      )}
    </div>
  );

}

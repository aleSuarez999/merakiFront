import React, { useContext, useEffect, useState } from 'react'
import Text from './Text'
import { NavLink, useNavigate } from 'react-router'

import Box from './Box';
import { orgStatuses } from '../utils/api';
import OrgStatusChart from './OrgStatusChart';

function OrgStatus( { org }) 
{
  const navigate = useNavigate();
  const [orgStatus, setorgStatus] = useState([])
  const [charData, setCharData] = useState([])
 // console.log("sta", org)
 /* contenido org
 sta {id: '935608', name: '-MERAKI TECO - Organización Maestra - NO USAR NI EDITAR', url: 'https://n515.dashboard.meraki.com/o/Z-K5jc/manage/organization/overview', samlConsumerUrls: null, samlConsumerUrl: null, …}
 */
  useEffect(() => {
   // console.log("sta", org.id)
    orgStatuses(org.id)
    .then((data) => {
        // mando error en true cuando la api no tiene perfil para ver el cliente
        if (!data.error)
        {
          setorgStatus(data.counts.byStatus)
        } 
          
      const dataItems = Object.entries(data.counts.byStatus).map(([name, value]) => ({
  name,
  value
}));

    setCharData(dataItems)
    console.log("dataitems", dataItems)

    } )
    
    .catch((error) => console.error(error.message))

  }, [org])
  

  return (
      <>
        
          {orgStatus && Object.keys(orgStatus).length > 0 ? (
            <>
              <ul className='orgStatus'>
                  <li>Online: {orgStatus.online}</li>
                  <li>Alert: {orgStatus.alerting}</li>
                  <li>Dormant: {orgStatus.dormant}</li>
                  <li className='red-alert'>Offline: {orgStatus.offline}</li>
              </ul>
              <Box>
                <OrgStatusChart data={charData} />
              </Box>
            </>
          ) : <>Verificar Permisos</>
        }

    </>
  )
}

export default OrgStatus
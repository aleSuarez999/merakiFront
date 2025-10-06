import React, { useContext, useEffect, useState } from 'react'
import Text from './Text'
import { NavLink, useNavigate } from 'react-router'

import Box from './Box';
import { getOrganizationApplianceUplinkStatuses } from '../utils/api';
import OrgStatusChart from './OrgStatusChart';

function UplinkStatus( { org }) 
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
    getOrganizationApplianceUplinkStatuses(org.id)
    .then((data) => {
        // mando error en true cuando la api no tiene perfil para ver el cliente
        if (!data.error)
        {
          console.log("redesrecibidas", data)
          setorgStatus(data)
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
              <Box>
                 <OrgStatusChart data={charData} />
              </Box>
              <Box className="w-100">
                <ul className='orgStatus d-flex '>
                    <li  className='jcsb d-flex'><span>Online:</span> <span> {orgStatus.online} </span></li>
                    <li  className='jcsb d-flex'><span>Alert:</span> <span>  {orgStatus.alerting}</span></li>
                    <li className='jcsb d-flex'><span>Dorm:</span><span>  {orgStatus.dormant} </span></li>
                    <li  className='jcsb d-flex red-alert'><span>Offline:</span><span>  {orgStatus.offline} </span></li>
                </ul>
              </Box>
            </>
          ) : <>Verificar Permisos</>
        }

    </>
  )
}

export default UplinkStatus
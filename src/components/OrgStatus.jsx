import React, { useContext, useEffect, useState } from 'react'
import Text from './Text'
import { NavLink, useNavigate } from 'react-router'

import Box from './Box';
import { orgStatuses } from '../utils/api';

function OrgStatus( { org }) 
{
  const navigate = useNavigate();
  const [orgStatus, setorgStatus] = useState([])
 // console.log("sta", org)
 /* contenido org
 sta {id: '935608', name: '-MERAKI TECO - Organización Maestra - NO USAR NI EDITAR', url: 'https://n515.dashboard.meraki.com/o/Z-K5jc/manage/organization/overview', samlConsumerUrls: null, samlConsumerUrl: null, …}
 */
  useEffect(() => {
   // console.log("sta", org.id)
    orgStatuses(org.id)
    .then((data) => {
        console.log("pepe", data.counts.byStatus)
        setorgStatus(data.counts.byStatus)
      
    } )
    
    .catch((error) => console.error(error.message))

  }, [org])
  
  return (
      <>
          <Box className="status__body">
          

          {orgStatus && Object.keys(orgStatus).length > 0 ? (
              Object.entries(orgStatus).map(([key, value], index) => (
                <div key={index}>
                  <strong>{key}</strong>: {value}
                </div>
              ))
            ) : (
              <p>No hay datos de estado disponibles.</p>
            )}


          </Box>
    </>
  )
}

export default OrgStatus
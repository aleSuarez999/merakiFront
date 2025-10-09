import React, { useContext, useEffect, useState } from 'react'
import Text from './Text'
import { NavLink, useNavigate } from 'react-router'

import Box from './Box';
import { getOrganizationApplianceUplinkStatuses } from '../utils/api';
import UplinkStatusChart from './UplinkStatusChart';


function UplinkStatus( { org }) 
{
  const navigate = useNavigate();
  const [uplinkStatus, setUplinkStatus] = useState([])
  const [charData, setCharData] = useState([])
  
  const [uplinkCount, setUplinkCount] = useState(0)
  const [activeUplinkCount, setactiveUplinkCount] = useState(0)
  

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
          setUplinkStatus(data)
        } 
          
     

    //data.networks.map((obj) => {
      // por cada red 
     // console.log("estado", obj.uplinkCount, obj.activeUplinkCount)
      
    //})

    const uplinkCount = data.networks.reduce( 
    (acc, obj) => acc + obj.uplinkCount , 0
  )
    setUplinkCount(uplinkCount)
    const activeUplinkCount = data.networks.reduce( 
    (acc, obj) => acc + obj.activeUplinkCount , 0
  )
    setactiveUplinkCount(activeUplinkCount)

    const dataItems = [
      { "name": "uplinkCount",
        "value": uplinkCount},
      { "name": "activeUplinkCount",
        "value": uplinkCount - activeUplinkCount}
    ]
    setCharData(dataItems)
    console.log("dataitems", dataItems)

    } )
    
    .catch((error) => console.error(error.message))

  }, [org])
  

  return (
      <>
        
          {uplinkStatus && Object.keys(uplinkStatus).length > 0 ? (
            
            <>
              <Box>
                 <UplinkStatusChart  data={charData} />
              </Box>
              <Box className="w-100">
                <ul className='orgStatus d-flex '>
                    <li  className='jcsb d-flex'><span>Uplinks:</span> <span> {uplinkCount} </span></li>
                    <li  className='jcsb d-flex'><span>Failed:</span> <span>  {uplinkCount - activeUplinkCount}</span></li>
            
                    
                </ul>
              </Box>
            </>
          ) : <>Verificar Permisos</>
        }

    </>
  )
}

export default UplinkStatus
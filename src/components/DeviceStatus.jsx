import React, { useEffect, useState } from 'react'
import Text from './Text'
import { useNavigate } from 'react-router'

import Box from './Box';
import { getOrganizationDevicesStatusesOverview } from '../utils/api';
import DeviceStatusChart from './DeviceStatusChart';

function DeviceStatus( { org }) 
{
  const navigate = useNavigate();
  const [deviceStatus, setDeviceStatus] = useState([])
  const [charData, setCharData] = useState([])

  useEffect(() => {
 
    getOrganizationDevicesStatusesOverview(org.id)
    .then((data) => {
        // mando error en true cuando la api no tiene perfil para ver el cliente
        if (!data.error)
        {
          setDeviceStatus(data.counts.byStatus)
         // console.log(data.counts.byStatus)
        } 
          
      const dataItems = Object.entries(data.counts.byStatus).map(([name, value]) => ({
  name,
  value
}));

    setCharData(dataItems)
    // una vez que esta info está disponible se hace de nuevo el render del grafico
    //console.log("dataitems", dataItems)

    } )
    
    .catch((error) => console.error(error.message))

  }, [org])
  

  return (
      <>
        
          {deviceStatus && Object.keys(deviceStatus).length > 0 ? (
            
             
            
            <>
              <Box>
                 <DeviceStatusChart data={charData} />
              </Box>
              <Box className="w-100">
                <ul className='deviceStatus d-flex '>
                    <li  className='jcsb d-flex'><span>Online:</span> <span> {deviceStatus.online} </span></li>
                  { /* <li  className='jcsb d-flex'><span>Alert:</span> <span>  {deviceStatus.alerting}</span></li>
                    <li className='jcsb d-flex'><span>Dorm:</span><span>  {deviceStatus.dormant} </span></li> */}
                   { deviceStatus.offline > 0 && (
                    <li  className={`jcsb d-flex ${deviceStatus.offline > 0 ? 'red-alert' : ''}`}><span>Offline:</span><span>  {deviceStatus.offline} </span></li>
                   )}
                </ul>
              </Box>
            </>
          ) : <>Verificar Permisos</>
        }

    </>
  )
}

export default DeviceStatus
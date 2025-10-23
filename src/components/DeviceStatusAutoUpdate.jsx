import React, { useEffect, useState } from 'react'
import Text from './Text'
import { useNavigate } from 'react-router'

import Box from './Box';
import { getOrganizationDevicesStatusesOverview } from '../utils/api';
import DeviceStatusChart from './DeviceStatusChart';

function DeviceStatusAutoUpdate( { org }) 
{
  const navigate = useNavigate();
  const [deviceStatus, setDeviceStatus] = useState([])
  const [charData, setCharData] = useState([])

  const fetchDevices = async () => {
      const data = await getOrganizationDevicesStatusesOverview(org.id);
      if (!data.error){
        setDeviceStatus(data.counts.byStatus)
      } 
    };

     useEffect(() => {
        fetchDevices(); // primera carga
    
        const interval = setInterval(fetchDevices, 20000); // cada 20 segundos
    
        return () => clearInterval(interval); // limpieza al desmontar
      }, [org]);

      useEffect(() => {
        if (!deviceStatus || Object.keys(deviceStatus).length < 1) return;

      
      const dataItems = Object.entries(deviceStatus).map(([name, value]) => 
        ({
          name,
          value
        }
        ))
      console.log(dataItems)
      setCharData(dataItems)

      }, [deviceStatus])
      
          
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

export default DeviceStatusAutoUpdate
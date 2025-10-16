import React, { useContext, useEffect, useState } from 'react'
import Text from './Text'
import { NavLink, useNavigate } from 'react-router'

import Box from './Box';
import { getOrganizationApplianceUplinkStatuses } from '../utils/api';
import UplinkStatusChart from './UplinkStatusChart';


function UplinkStatus( { org }) 
{
  const navigate = useNavigate();
  const [uplinkStatus1, setUplinkStatus] = useState({})
  const [charData, setCharData] = useState([])
  
  const [uplinkCount, setUplinkCount] = useState(0)
  const [activeUplinkCount, setactiveUplinkCount] = useState(0)
  
        
  useEffect(() => {
    getOrganizationApplianceUplinkStatuses(org.id)
      .then((data) => {
        if (data.ok && Array.isArray(data.networks)) {
          setUplinkStatus(data.networks);
        } else {
          setUplinkStatus([]);
        }
      })
      .catch((error) => console.error(error.message));
  }, [org]);



  useEffect(() => {
    if (!Array.isArray(uplinkStatus1) || uplinkStatus1.length < 1) {
      return;
    }

    const uplinkCount = uplinkStatus1.reduce((acc, obj) => acc + obj.uplinkCount, 0);
    const activeUplinkCount = uplinkStatus1.reduce((acc, obj) => acc + obj.activeUplinkCount, 0);

    setUplinkCount(uplinkCount);
    setactiveUplinkCount(activeUplinkCount);

    const dataItems = [
      { name: "uplinkCount", value: uplinkCount },
      { name: "activeUplinkCount", value: uplinkCount - activeUplinkCount }
    ];

    setCharData(dataItems);
  }, [uplinkStatus1]);  


  /*
    useEffect(() => {
        const fetchUplinks = async () => {
          console.info("verificando cambios")
             getOrganizationApplianceUplinkStatuses(org.id)
            .then((data) => {
                // mando error en true cuando la api no tiene perfil para ver el cliente
                if (!data.error)
                {
                 //console.log("redesrecibidas", data)
                  setUplinkStatus(data)
                } 
                  
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
            

            } )
            
            .catch((error) => console.error(error.message, 1))
        };

        fetchUplinks(); // primera carga

        const interval = setInterval(fetchUplinks, 20000); // cada 60 segundos
        
        return () => clearInterval(interval); // limpieza
    }, []);
    */

  return (
      <>
        
          {uplinkStatus1 && Object.keys(uplinkStatus1).length > 0 ? (
            
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
          ) : <>No hay datos</>
        }

    </>
  )
}

export default UplinkStatus
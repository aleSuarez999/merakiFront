import React, { useEffect, useState } from 'react';
import Box from './Box';
import UplinkStatusChart from './UplinkStatusChart';
import { getOrganizationApplianceUplinkStatuses } from '../utils/api';

function UplinkStatus({ org }) {
  const [uplinkStatus1, setUplinkStatus] = useState([]);
  const [charData, setCharData] = useState([]);
  const [uplinkCount, setUplinkCount] = useState(0);
  const [activeUplinkCount, setActiveUplinkCount] = useState(0);

  const fetchUplinks = async () => {
    const data = await getOrganizationApplianceUplinkStatuses(org.id);
    if (data.ok && Array.isArray(data.networks)) {
      setUplinkStatus(data.networks);
    } else {
      setUplinkStatus([]);
    }
  };

  useEffect(() => {
    fetchUplinks(); // primera carga

    const interval = setInterval(fetchUplinks, 20000); // cada 20 segundos

    return () => clearInterval(interval); // limpieza al desmontar
  }, [org]);

  useEffect(() => {
    if (!Array.isArray(uplinkStatus1) || uplinkStatus1.length < 1) return;

    const uplinkCount = uplinkStatus1.reduce((acc, obj) => acc + obj.uplinkCount, 0);
    const activeUplinkCount = uplinkStatus1.reduce((acc, obj) => acc + obj.activeUplinkCount, 0);

    setUplinkCount(uplinkCount);
    setActiveUplinkCount(activeUplinkCount);

    const dataItems = [
      { name: 'Uplinks', value: uplinkCount },
      { name: 'Failed', value: uplinkCount - activeUplinkCount }
    ];

    setCharData(dataItems);
  }, [uplinkStatus1]);

  return (
    <>
      {uplinkStatus1.length > 0 ? (
        <>
          <Box>
            <UplinkStatusChart data={charData} />
          </Box>
          <Box className="w-100">
            <ul className="orgStatus d-flex">
              <li className="jcsb d-flex">
                <span>Uplinks:</span> <span>{uplinkCount}</span>
              </li>

            { (uplinkCount - activeUplinkCount) > 0 && (
              <li className={`jcsb d-flex ${(uplinkCount - activeUplinkCount) > 0 ? 'red-alert' : ''}`}>
                <span>Failed:</span> <span>{uplinkCount - activeUplinkCount}</span>
              </li>
                   
               )}

 

            </ul>
          </Box>
        </>
      ) : (
        <><br></br>No informacion de uplinks</>
      )}
    </>
  );
}

export default UplinkStatus;
``
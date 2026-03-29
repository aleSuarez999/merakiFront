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
      { name: 'Uplinks', value: activeUplinkCount },
      { name: 'Failed', value: uplinkCount - activeUplinkCount }
    ];

    setCharData(dataItems);
  }, [uplinkStatus1]);

// ── Logica de alerta de ultimo uplink ─────────────────────────────────────
  // Sitios con doble vinculo (uplinkCount >= 2) donde solo queda uno activo.
  // Se evalua por red individual para no mezclar sitios distintos dentro de la org.
  const sitiosEnRiesgo = uplinkStatus1.filter(
    net => net.uplinkCount >= 2 && net.activeUplinkCount === 1
  );
  const hayAlertaUltimoUplink = sitiosEnRiesgo.length > 0;

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
                <span>Wan:{uplinkCount}</span>
              </li>

            { (uplinkCount - activeUplinkCount) > 0 && (
              <li className="jcsb d-flex red-alert">
                <span>Fail:{uplinkCount - activeUplinkCount}</span>
              </li>
                   
               )}

           {/* Alerta: sitio con doble vinculo y solo uno activo */}
              {hayAlertaUltimoUplink && (
                <li className="jcsb d-flex uplink-last-warning">
                  <span>⚠ Risk</span>
                  <span>{sitiosEnRiesgo.length}</span>
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
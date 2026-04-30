import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from './Box';
import UplinkStatusChart from './UplinkStatusChart';
import DeviceTypeStatus from './DeviceTypeStatus';
import axiosInstance, { getOrganizationApplianceUplinkStatuses, getVpnStatus } from '../utils/api';

const isUpDevice = (s) => { const v = (s || '').toLowerCase(); return v === 'online' || v === 'alerting'; }

function UplinkStatus({ org }) {
  const navigate = useNavigate();
  const [uplinkStatus1, setUplinkStatus] = useState([]);
  const [charData, setCharData] = useState([]);
  const [uplinkCount, setUplinkCount] = useState(0);
  const [activeUplinkCount, setActiveUplinkCount] = useState(0);
  const [vpnDownCount, setVpnDownCount] = useState(0);
  const [showDevices, setShowDevices] = useState(false);
  const [devTotal, setDevTotal]         = useState(null);
  const [devDown,  setDevDown]          = useState(0);
  const [managedUplinks, setManaged]    = useState(0);

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
    const interval = setInterval(fetchUplinks, 60000); // cada 20 segundos
    return () => clearInterval(interval); // limpieza al desmontar
  }, [org]);

  // ── Device inventory + incidentes suspendidos ────────────────────────────────
  useEffect(() => {
    if (!org?.id) return;
    Promise.all([
      axiosInstance.get(`/portal/inventory?orgId=${org.id}`),
      axiosInstance.get(`/incidents/report?orgId=${org.id}&days=7`).catch(() => ({ data: {} })),
    ]).then(([invR, incR]) => {
      const devs    = invR.data?.devices    || [];
      const openInc = incR.data?.recentOpen || [];

      // devices suspendidos → no cuentan como caídos
      const suspSet = new Set(
        openInc.filter(i => i.workStatus === 'suspended').map(i => i.deviceSerial).filter(Boolean)
      );
      const down = devs.filter(d => !isUpDevice(d.status) && !suspSet.has(d.serial)).length;
      setDevTotal(devs.length - suspSet.size);
      setDevDown(down);

      // uplinks con incidente gestionado (in_progress o suspended) → amarillo
      const managed = openInc.filter(
        i => i.incidentType === 'UPLINK_DOWN' &&
             (i.workStatus === 'in_progress' || i.workStatus === 'suspended')
      ).length;
      setManaged(managed);
    }).catch(() => {});
  }, [org]);

  // ── VPN status: fetch una vez por org (cron refresca cada 10 min) ──────────
  useEffect(() => {
    if (!org?.id) return;
    getVpnStatus(org.id).then(d => {
      setVpnDownCount(d?.summary?.downPeers || 0);
    });
  }, [org]);

  useEffect(() => {
    if (!Array.isArray(uplinkStatus1) || uplinkStatus1.length < 1) return;

    const uplinkCount      = uplinkStatus1.reduce((acc, obj) => acc + obj.uplinkCount, 0);
    const activeUplinkCount = uplinkStatus1.reduce((acc, obj) => acc + obj.activeUplinkCount, 0);

    setUplinkCount(uplinkCount);
    setActiveUplinkCount(activeUplinkCount);

    const totalFailed  = uplinkCount - activeUplinkCount;
    const managed      = Math.min(managedUplinks, totalFailed);
    const activeFailed = totalFailed - managed;

    const dataItems = [
      { name: 'Up',      value: activeUplinkCount, color: '#24c024ff' },
      { name: 'Managed', value: managed,            color: '#e0de55ff' },
      { name: 'Failed',  value: activeFailed,       color: '#b9473fff' },
    ].filter(item => item.value > 0);

    setCharData(dataItems);
  }, [uplinkStatus1, managedUplinks]);

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
        showDevices ? (
          <Box className="w-100">
            <div
              onClick={(e) => { e.stopPropagation(); setShowDevices(false); }}
              style={{ fontSize: '0.72rem', cursor: 'pointer', marginBottom: '0.25rem', opacity: 0.7 }}
              title="Volver a uplinks"
            >
              ← 📡 WAN
            </div>
            <DeviceTypeStatus orgId={org.id} />
          </Box>
        ) : (
          <>
            <Box>
              <UplinkStatusChart data={charData} />
            </Box>
            <Box className="w-100">
              <ul className="orgStatus d-flex">
                {devTotal !== null && (() => {
                  const color = devDown === 0 ? 'inherit'
                              : devDown === devTotal ? '#ef4444'
                              : '#e0de55';
                  return (
                    <li
                      className="jcsb d-flex"
                      onClick={(e) => { e.stopPropagation(); setShowDevices(true); }}
                      style={{ cursor: 'pointer', color }}
                      title="Ver dispositivos"
                    >
                      <span>Devs:{devTotal}</span>
                    </li>
                  );
                })()}

                <li className="jcsb d-flex">
                  <span>Wan:{uplinkCount}</span>
                </li>

                {(() => {
                  const totalFailed  = uplinkCount - activeUplinkCount;
                  const managed      = Math.min(managedUplinks, totalFailed);
                  const activeFailed = totalFailed - managed;
                  return (<>
                    {activeFailed > 0 && (
                      <li className="jcsb d-flex red-alert">
                        <span>Fail:{activeFailed}</span>
                      </li>
                    )}
                    {managed > 0 && (
                      <li className="jcsb d-flex" style={{ color: '#e0de55' }}>
                        <span>Mgmt:{managed}</span>
                      </li>
                    )}
                  </>);
                })()}

                {hayAlertaUltimoUplink && (
                  <li className="jcsb d-flex uplink-last-warning">
                    <span>⚠ Risk</span>
                    <span>{sitiosEnRiesgo.length}</span>
                  </li>
                )}

                {vpnDownCount > 0 && (
                  <li
                    className="jcsb d-flex uplink-vpn-warning"
                    onClick={(e) => {
                      e.stopPropagation();
                      localStorage.setItem('vpn_last_org', org.id);
                      navigate('/reports/vpn');
                    }}
                    style={{ cursor: 'pointer' }}
                    title="Ver detalle VPN"
                  >
                    <span>⚠ VPN</span>
                    <span>{vpnDownCount}↓</span>
                  </li>
                )}
              </ul>
            </Box>
          </>
        )
      ) : (
        <DeviceTypeStatus orgId={org.id} />
      )}
    </>
  );
}

export default UplinkStatus;
``
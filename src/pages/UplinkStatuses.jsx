import { useContext, useEffect, useState } from 'react'
import { NavLink, useParams } from 'react-router'
import { getOrganizationApplianceUplinkStatusesAll } from '../utils/api'
import Box from '../components/Box'
import Context from '../context/Context'
import IpWhoisTooltip from '../components/IpWhoisTooltip'

// Construye la URL directa al portal de Meraki para una red.
export default function UplinkStatuses() {

  const orgs = useContext(Context)
  const [loading, setLoading]  = useState(true)
  const [uplinks, setUplinks]  = useState([])
  const [orgActual, setOrgActual] = useState([])

  const { orgId } = useParams();
  
  useEffect(() => {
    const fetchUplinks = async () => {
      const res = await getOrganizationApplianceUplinkStatusesAll(orgId);
      if (res.ok) {
        const tempOrg = orgs.find((org) => String(org.id) === String(orgId))
        setOrgActual(tempOrg)

        const sorted = res.networks.sort((a, b) => {
          const aLastUplink = a.uplinkCount >= 2 && a.activeUplinkCount === 1;
          const bLastUplink = b.uplinkCount >= 2 && b.activeUplinkCount === 1;
          if (bLastUplink !== aLastUplink) return bLastUplink - aLastUplink;
          const aFailed = a.uplinks.some(u => u.status === 'failed');
          const bFailed = b.uplinks.some(u => u.status === 'failed');
          return bFailed - aFailed;
        });

        setUplinks(sorted);
        setLoading(false);
      }
    };

    fetchUplinks();
    console.log("recargando")
    const interval = setInterval(fetchUplinks, 20000);
    return () => clearInterval(interval);

  }, [orgId]);

  if (loading) return <p>Cargando uplinks...</p>;

  const sitiosEnRiesgo = uplinks.filter(
    net => net.uplinkCount >= 2 && net.activeUplinkCount === 1
  );

  return (
    <Box className="uplink-container">
      <h2>Uplinks por red - Org: {orgActual?.name}</h2>

      {/* ── Banner de alerta global ───────────────────────────────────────── */}
      {sitiosEnRiesgo.length > 0 && (
        <div className="uplink-last-banner">
          <span className="uplink-last-banner__icon">⚠</span>
          <div className="uplink-last-banner__text">
            <strong>
              {sitiosEnRiesgo.length} sitio{sitiosEnRiesgo.length > 1 ? 's' : ''} con último uplink activo
            </strong>
            <p>
              Si cae el vínculo restante el sitio quedará <strong>sin conectividad</strong>.
              Revisar con urgencia.
            </p>
            <ul className="uplink-last-banner__list">
              {sitiosEnRiesgo.map((net, i) => (
                <li key={i}>
                  <a
                    href=""
                    target="_blank"
                    rel="noreferrer"
                    className="uplink-meraki-link"
                  >
                    <strong>{net.name}</strong> ↗
                  </a>
                  {' — '}
                  {net.uplinks
                    .filter(u => u.status === 'active' || u.status === 'ready')
                    .map(u => `${u.interface} (${u.ip || 'sin IP'})`)
                    .join(', ')
                  }
                  {' activo · '}
                  {net.uplinks
                    .filter(u => u.status === 'failed' || (u.ip?.trim() && u.status === 'not connected'))
                    .map(u => u.interface)
                    .join(', ')
                  }
                  {' caído'}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* ── Lista de sitios ───────────────────────────────────────────────── */}
      {uplinks.map((net, index) => {

        const esUltimoUplink = net.uplinkCount >= 2 && net.activeUplinkCount === 1;

        return (
          <Box
            key={index}
            className={`uplink-site ${esUltimoUplink ? 'uplink-site--last-uplink' : ''}`}
          >
            <div className="uplink-site__header">
              <h5 className="uplink-site__name">
                <a
                  href=""
                  target="_blank"
                  rel="noreferrer"
                  className="uplink-meraki-link"
                  title="Abrir en portal Meraki"
                >
                  {net.name} ↗
                </a>
                {esUltimoUplink && (
                  <span className="uplink-site__badge uplink-site__badge--warning">
                    ⚠ Último uplink
                  </span>
                )}
              </h5>

              <div className="uplink-site__links">
                <NavLink to={`/networks/${net.networkId}/vlans`}>Vlans</NavLink>
                {' - '}
                <NavLink to={`/networks/${net.networkId}/wireless/ssids`}>SSids</NavLink>
              </div>
            </div>

            <p className="uplink-site__serial">Serial: {net.serial}</p>
            <p className="uplink-site__count">
              Uplinks activos: {net.activeUplinkCount} / {net.uplinkCount}
            </p>

            {esUltimoUplink && (
              <p className="uplink-site__warning-msg">
                Si cae el vínculo activo, el sitio quedará <strong>sin conectividad</strong>.
                Revisión urgente recomendada.
              </p>
            )}

            <ul>
              {net.uplinks.map((uplink, i) => (
                <li
                  key={i}
                  className={
                    uplink.status === 'failed' ||
                    (uplink.ip?.trim() && uplink.status === 'not connected')
                      ? 'down'
                      : uplink.status === 'active'
                      ? 'active'
                      : 'unknown'
                  }
                >
                  <span className="uplink-row">
                    <span className="uplink-row__iface">{uplink.interface}:</span>
                    <span className="uplink-row__status">{uplink.status}</span>
                    <span className="uplink-row__label">IP:</span>
                    {/* IP privada con WHOIS tooltip */}
                    {uplink.ip
                      ? <IpWhoisTooltip ip={uplink.ip} />
                      : <span>—</span>
                    }
                    <span className="uplink-row__label">Pública:</span>
                    {/* IP pública también con WHOIS tooltip */}
                    {uplink.publicIp
                      ? <IpWhoisTooltip ip={uplink.publicIp} />
                      : <span>—</span>
                    }
                  </span>
                </li>
              ))}
            </ul>
          </Box>
        );
      })}
    </Box>
  );
}

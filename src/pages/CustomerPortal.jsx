import { useEffect, useState, useCallback } from 'react'
import { NavLink, useSearchParams } from 'react-router'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Cell
} from 'recharts'
import Text from '../components/Text'
import {
  getPortalOrgs,
  getPortalStatusMap,
  getPortalPathControl,
  getPortalUsage,
  getPortalInventory,
} from '../utils/api'

// ── Paleta ────────────────────────────────────────────────────────────────────
const C = {
  accent:    '#00d4ff',
  secondary: '#3b82f6',
  success:   '#10b981',
  warning:   '#f59e0b',
  error:     '#ef4444',
  muted:     '#64748b',
  orange:    '#f97316',
}

// Criticality mapping — misma lógica que UplinkStatus.jsx:
//   high   = todos los WAN de un sitio caídos  (Fail)  → Crítico
//   medium = sitio con doble WAN y queda uno   (Risk)  → Risk
//   ok     = todos los WAN activos              (OK)   → Normal
const CRITICALITY_CFG = {
  high:   { color: C.error,   label: '🔴 Crítico', bg: 'rgba(239,68,68,0.08)',   pulse: true  },
  medium: { color: C.warning, label: '⚠ Risk',     bg: 'rgba(245,158,11,0.07)', pulse: true  },
  ok:     { color: C.success, label: '✔ Normal',   bg: 'rgba(16,185,129,0.06)', pulse: false },
}

const HEALTH_CFG = {
  down:     { color: C.error,   label: '↓ Down'       },
  degraded: { color: C.warning, label: '⚠ Degraded'   },
  good:     { color: C.success, label: '✔ Good'        },
  // ready = standby por redundancia, not connected = sin configurar → no es down
  standby:  { color: C.muted,   label: '◌ Standby'    },
}

const STATUS_COLOR = {
  online:  C.success,
  offline: C.error,
  alerting:C.warning,
  dormant: C.muted,
  unknown: C.muted,
}

const PRODUCT_ICONS = {
  appliance:        '🔒',
  switch:           '🔀',
  wireless:         '📶',
  camera:           '📷',
  cellularGateway:  '📡',
}

const PERIOD_OPTS = [7, 14, 30, 60, 90]
const LS_ORG   = 'portal_last_org'
const LS_NET   = 'portal_last_net'
const LS_THEME = 'portal_theme'

// ── Paletas ───────────────────────────────────────────────────────────────────
const PALETTES = {
  dark: {
    name: '🌙 Oscura',
    bg:         '#080d14',
    surface:    '#0d1520',
    card:       '#111d2e',
    elevated:   '#1a2940',
    text:       '#e2e8f0',
    textMuted:  '#64748b',
    border:     'rgba(255,255,255,0.07)',
    borderAccent:'rgba(0,212,255,0.3)',
    shadow:     '0 4px 24px rgba(0,0,0,0.5)',
  },
  light: {
    name: '☀️ Clara',
    bg:         '#f0f4f8',
    surface:    '#ffffff',
    card:       '#ffffff',
    elevated:   '#f8fafc',
    text:       '#1e293b',
    textMuted:  '#64748b',
    border:     'rgba(0,0,0,0.1)',
    borderAccent:'rgba(0,120,200,0.35)',
    shadow:     '0 2px 12px rgba(0,0,0,0.08)',
  },
}

const fmtDate = d => d ? new Date(d).toLocaleString('en-GB', {
  day: '2-digit', month: '2-digit', year: '2-digit',
  hour: '2-digit', minute: '2-digit',
}) : '—'

// ── Spinner ───────────────────────────────────────────────────────────────────
function Spinner({ text = 'Cargando…' }) {
  return (
    <div className="inc__loading">
      <span className="inc__spinner" />
      {text}
    </div>
  )
}

// ── Tooltip recharts ──────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="inc__tooltip">
      {label && <p className="inc__tooltip-label">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || C.accent }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  )
}

// ── Badge de estado ───────────────────────────────────────────────────────────
function StatusBadge({ status, small = false }) {
  const color = STATUS_COLOR[status] || C.muted
  return (
    <span className="inc__badge" style={{
      background: color + '22', color, border: `1px solid ${color}44`,
      fontSize: small ? '0.6rem' : '0.68rem',
    }}>
      {status || 'unknown'}
    </span>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 1: STATUS MAP
// ══════════════════════════════════════════════════════════════════════════════

// ── Celda WAN — mismo patrón que UplinkStatus.jsx ────────────────────────────
function WanCell({ wan }) {
  if (!wan || wan.total === 0) return <span style={{ color: C.muted, fontSize: '0.72rem' }}>—</span>
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontFamily: 'monospace', fontSize: '0.75rem' }}>
      <span style={{ color: C.muted }}>Wan:{wan.total}</span>
      {wan.failed > 0 && (
        <span className="inc__badge" style={{
          background: 'rgba(239,68,68,0.15)', color: C.error,
          border: `1px solid ${C.error}44`, fontWeight: 700,
        }}>Fail:{wan.failed}</span>
      )}
      {wan.atRisk && !wan.failed && (
        <span className="inc__badge uplink-last-warning" style={{
          background: 'rgba(245,158,11,0.15)', color: C.warning,
          border: `1px solid ${C.warning}44`, fontWeight: 700,
        }}>⚠ Risk</span>
      )}
      {wan.failed === 0 && !wan.atRisk && (
        <span style={{ color: C.success, fontSize: '0.7rem' }}>✔</span>
      )}
    </span>
  )
}

// ── Correlación WAN + incidente — nota contextual ────────────────────────────
// Si hay un UPLINK_DOWN activo y además la WAN está failed → probable causa
function CorrelationNote({ wan, incidents }) {
  const hasUplinkDown = (incidents || []).some(i => i.incidentType === 'UPLINK_DOWN')
  const hasWanFailed  = wan?.failed > 0

  if (hasUplinkDown && hasWanFailed) {
    return (
      <span title="Incidente de UPLINK_DOWN activo coincide con WAN caída" style={{
        fontSize: '0.62rem', color: C.warning,
        background: 'rgba(245,158,11,0.1)',
        border: `1px solid ${C.warning}22`,
        borderRadius: 4, padding: '0.1rem 0.4rem',
        fontFamily: 'monospace', whiteSpace: 'nowrap',
      }}>
        🔗 WAN→Inc
      </span>
    )
  }
  if (hasUplinkDown && !hasWanFailed) {
    return (
      <span title="Incidente registrado, WAN actualmente recuperada" style={{
        fontSize: '0.62rem', color: C.muted,
        fontFamily: 'monospace',
      }}>
        ↺ rec.
      </span>
    )
  }
  return null
}

// ── Detalle expandido de una red (sub-tabla debajo de la fila) ────────────────
function NetworkDetail({ net }) {
  const hasUplinks = net.wan.uplinks?.length > 0
  const hasVpn     = net.vpn.peers?.filter(p => p.reachability !== 'reachable').length > 0
  const hasInc     = net.incidents?.length > 0

  if (!hasUplinks && !hasVpn && !hasInc)
    return <p style={{ fontSize: '0.72rem', color: C.muted, padding: '0.5rem 0' }}>Sin alertas activas en esta red.</p>

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>

      {/* WAN Links */}
      {hasUplinks && (
        <div>
          <p className="vpn__peer-type-label" style={{ marginBottom: '0.35rem' }}>WAN Links</p>
          <table className="inc__table">
            <thead><tr><th>Iface</th><th>Estado</th><th>IP pública</th><th>Lat.</th><th>Loss</th></tr></thead>
            <tbody>
              {net.wan.uplinks.map((u, i) => {
                const isPassive = u.status === 'ready' || u.status === 'not connected' || !u.ip
                const isFailed  = u.status === 'failed'
                return (
                  <tr key={i} style={{
                    opacity: isPassive ? 0.55 : 1,
                    borderLeft: isFailed ? `3px solid ${C.error}` : isPassive ? `3px solid ${C.muted}` : `3px solid ${C.success}`,
                  }}>
                    <td className="inc__td-mono">{u.interface}</td>
                    <td>
                      <StatusBadge status={u.status} small />
                      {isPassive && <span style={{ fontSize: '0.58rem', color: C.muted, marginLeft: '0.25rem' }}>standby</span>}
                    </td>
                    <td className="inc__td-mono" style={{ color: isPassive ? C.muted : 'inherit', fontSize: '0.7rem' }}>
                      {u.publicIp || u.ip || '—'}
                    </td>
                    <td className="inc__td-mono" style={{
                      color: isPassive ? C.muted : u.latencyMs == null ? C.muted : u.latencyMs > 100 ? C.error : u.latencyMs > 50 ? C.warning : C.success
                    }}>
                      {isPassive ? '—' : u.latencyMs != null ? `${u.latencyMs}ms` : '—'}
                    </td>
                    <td className="inc__td-mono" style={{
                      color: isPassive ? C.muted : u.lossPercent == null ? C.muted : u.lossPercent > 5 ? C.error : u.lossPercent > 1 ? C.warning : C.success
                    }}>
                      {isPassive ? '—' : u.lossPercent != null ? `${u.lossPercent}%` : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* VPN peers caídos */}
      {hasVpn && (
        <div>
          <p className="vpn__peer-type-label" style={{ marginBottom: '0.35rem' }}>VPN Peers sin conectividad</p>
          <table className="inc__table">
            <thead><tr><th>Peer</th><th>Estado</th></tr></thead>
            <tbody>
              {net.vpn.peers.filter(p => p.reachability !== 'reachable').map((p, i) => (
                <tr key={i}>
                  <td className="inc__td-mono">{p.networkName || p.name || p.publicIp}</td>
                  <td>
                    <span className="inc__badge" style={{
                      background: 'rgba(239,68,68,0.15)', color: C.error, border: `1px solid ${C.error}44`
                    }}>unreachable</span>
                    {/* Correlación: VPN down + WAN down en la misma red */}
                    {net.wan?.failed > 0 && (
                      <span title="La caída WAN puede explicar la pérdida de VPN" style={{
                        fontSize: '0.58rem', color: C.warning, marginLeft: '0.4rem', fontFamily: 'monospace'
                      }}>← posible causa: WAN caída</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Incidentes activos */}
      {hasInc && (
        <div>
          <p className="vpn__peer-type-label" style={{ marginBottom: '0.35rem' }}>Incidentes activos</p>
          <table className="inc__table">
            <thead><tr><th>Tipo</th><th>Severidad</th><th>Detectado</th></tr></thead>
            <tbody>
              {net.incidents.map((inc, i) => (
                <tr key={i}>
                  <td><span className="inc__badge inc__badge--type" style={{ fontSize: '0.6rem' }}>{inc.incidentType}</span></td>
                  <td>
                    <span style={{
                      fontSize: '0.68rem', color: inc.severity === 'critical' ? C.error : inc.severity === 'high' ? C.orange : C.warning
                    }}>{inc.severity}</span>
                  </td>
                  <td className="inc__td-mono" style={{ fontSize: '0.68rem' }}>{fmtDate(inc.detectedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function StatusMapPanel({ orgId, networks, globalData, loading }) {
  const [expandedNet, setExpandedNet] = useState(null)
  const toggle = id => setExpandedNet(prev => prev === id ? null : id)

  if (loading) return <Spinner text="Cargando status map…" />

  // ── Vista global — tabla de organizaciones ────────────────────────────────
  if (!orgId && globalData) {
    const orgs = globalData.orgs || []
    return (
      <div>
        <div className="inc__hist-summary" style={{ marginBottom: '1rem' }}>
          <span className="inc__hist-kpi">Organizaciones <strong>{orgs.length}</strong></span>
          <span className="inc__hist-kpi" style={{ color: C.error }}>
            Con alertas <strong style={{ color: C.error }}>{orgs.filter(o => o.criticality !== 'ok').length}</strong>
          </span>
          <span className="inc__hist-kpi" style={{ color: C.success }}>
            Normales <strong style={{ color: C.success }}>{orgs.filter(o => o.criticality === 'ok').length}</strong>
          </span>
        </div>

        <div className="inc__table-wrap">
          <table className="inc__table portal__status-table">
            <thead>
              <tr>
                <th style={{ width: 28 }}></th>
                <th>Organización</th>
                <th>Redes</th>
                <th>Dispositivos</th>
                <th>WAN</th>
                <th>VPN</th>
                <th>Incidentes</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {orgs.map(org => {
                const cfg = CRITICALITY_CFG[org.criticality] || CRITICALITY_CFG.ok
                return (
                  <tr key={org.orgId} style={{ borderLeft: `3px solid ${cfg.color}` }}>
                    <td style={{ fontSize: '0.8rem' }}>
                      {org.criticality !== 'ok' ? (
                        <span style={{ color: cfg.color }} className={org.criticality !== 'ok' ? 'uplink-last-warning' : ''}>●</span>
                      ) : (
                        <span style={{ color: C.success }}>●</span>
                      )}
                    </td>
                    <td style={{ fontWeight: 600, color: C.accent, fontFamily: 'monospace', fontSize: '0.82rem' }}>
                      {org.orgName}
                    </td>
                    <td className="inc__td-mono">{org.networkCount}</td>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                        <span style={{ color: C.success }}>{org.devices.online}</span>
                        <span style={{ color: C.muted }}>/{org.devices.total}</span>
                        {org.devices.offline > 0 && <span style={{ color: C.error }}> ↓{org.devices.offline}</span>}
                      </span>
                    </td>
                    <td><WanCell wan={org.wan} /></td>
                    <td>
                      {org.vpn.down > 0
                        ? <span className="inc__badge" style={{ background: 'rgba(239,68,68,0.12)', color: C.error, border: `1px solid ${C.error}44`, fontSize: '0.65rem' }}>
                            🔒 {org.vpn.down} down
                          </span>
                        : <span style={{ color: C.muted, fontSize: '0.7rem' }}>—</span>
                      }
                    </td>
                    <td>
                      {org.openIncidents > 0
                        ? <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: C.warning }}>{org.openIncidents} abiertos</span>
                        : <span style={{ color: C.muted, fontSize: '0.7rem' }}>—</span>
                      }
                    </td>
                    <td>
                      <span style={{ color: cfg.color, fontSize: '0.72rem', fontWeight: 600 }}>{cfg.label}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: '0.65rem', color: C.muted, fontFamily: 'monospace', marginTop: '0.5rem' }}>
          Seleccioná una organización en el selector para ver el detalle por red.
        </p>
      </div>
    )
  }

  // ── Vista por org — tabla de redes ────────────────────────────────────────
  if (!networks || networks.length === 0)
    return <p className="inc__empty">Sin datos de redes para esta organización.</p>

  const highCount   = networks.filter(n => n.criticality === 'high').length
  const mediumCount = networks.filter(n => n.criticality === 'medium').length

  return (
    <div>
      {/* Resumen discreto */}
      <div className="inc__hist-summary" style={{ marginBottom: '0.75rem' }}>
        <span className="inc__hist-kpi">Total redes <strong>{networks.length}</strong></span>
        {highCount > 0 && (
          <span className="inc__hist-kpi" style={{ color: C.error }}>
            Con alertas <strong style={{ color: C.error }}>{highCount}</strong>
          </span>
        )}
        {mediumCount > 0 && (
          <span className="inc__hist-kpi" style={{ color: C.warning }}>
            En riesgo <strong style={{ color: C.warning }}>{mediumCount}</strong>
          </span>
        )}
        <span className="inc__hist-kpi" style={{ color: C.success }}>
          Normales <strong style={{ color: C.success }}>{networks.filter(n => n.criticality === 'ok').length}</strong>
        </span>
        <span style={{ marginLeft: 'auto', fontSize: '0.65rem', color: C.muted, fontFamily: 'monospace' }}>
          ▸ clic en una fila para ver detalle
        </span>
      </div>

      <div className="inc__table-wrap">
        <table className="inc__table portal__status-table">
          <thead>
            <tr>
              <th style={{ width: 28 }}></th>
              <th>Red</th>
              <th>Tipo</th>
              <th>Dispositivos</th>
              <th>WAN</th>
              <th>VPN</th>
              <th>Incidente</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {networks.map(net => {
              const cfg     = CRITICALITY_CFG[net.criticality] || CRITICALITY_CFG.ok
              const isOpen  = expandedNet === net.networkId
              const hasAlert = net.criticality !== 'ok'

              return (
                <>
                  <tr
                    key={net.networkId}
                    onClick={() => toggle(net.networkId)}
                    style={{
                      cursor: 'pointer',
                      borderLeft: `3px solid ${cfg.color}`,
                      background: isOpen ? 'rgba(255,255,255,0.03)' : undefined,
                    }}
                    className="portal__status-row"
                  >
                    {/* Toggle */}
                    <td style={{ color: C.muted, fontSize: '0.7rem', textAlign: 'center' }}>
                      {isOpen ? '▾' : '▸'}
                    </td>

                    {/* Red */}
                    <td style={{ fontWeight: hasAlert ? 600 : 400, fontFamily: 'monospace', fontSize: '0.82rem' }}>
                      {net.networkName}
                    </td>

                    {/* Tipo */}
                    <td style={{ fontSize: '0.7rem', color: C.muted }}>
                      {(net.productTypes || []).map(pt => PRODUCT_ICONS[pt] || pt).join(' ')}
                      {net.vpnMode && <span style={{ marginLeft: '0.3rem', fontSize: '0.65rem' }}>VPN:{net.vpnMode}</span>}
                    </td>

                    {/* Dispositivos — solo mostrar si hay problema */}
                    <td>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                        <span style={{ color: net.devices.offline > 0 ? C.error : C.success }}>{net.devices.online}</span>
                        <span style={{ color: C.muted }}>/{net.devices.total}</span>
                        {net.devices.offline > 0 && (
                          <span style={{ color: C.error, marginLeft: '0.3rem' }}>↓{net.devices.offline}</span>
                        )}
                      </span>
                    </td>

                    {/* WAN */}
                    <td><WanCell wan={net.wan} /></td>

                    {/* VPN — solo peers caídos, y correlación con WAN */}
                    <td>
                      {net.vpn.down > 0 ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                          <span className="inc__badge" style={{
                            background: 'rgba(239,68,68,0.12)', color: C.error,
                            border: `1px solid ${C.error}44`, fontSize: '0.65rem',
                          }}>
                            {net.vpn.down} peer{net.vpn.down > 1 ? 's' : ''} ↓
                          </span>
                          {/* Correlación: VPN down porque WAN está caída */}
                          {net.wan?.failed > 0 && (
                            <span title="La caída WAN puede ser causa de la pérdida VPN" style={{
                              fontSize: '0.6rem', color: C.warning, fontFamily: 'monospace'
                            }}>← WAN</span>
                          )}
                        </span>
                      ) : (
                        <span style={{ color: C.muted, fontSize: '0.7rem' }}>—</span>
                      )}
                    </td>

                    {/* Incidente — tipo + correlación */}
                    <td>
                      {net.incidents?.length > 0 ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap' }}>
                          <span className="inc__badge inc__badge--type" style={{ fontSize: '0.6rem' }}>
                            {net.incidents[0].incidentType.replace('_', ' ')}
                            {net.incidents.length > 1 && ` +${net.incidents.length - 1}`}
                          </span>
                          <CorrelationNote wan={net.wan} incidents={net.incidents} />
                        </span>
                      ) : (
                        <span style={{ color: C.muted, fontSize: '0.7rem' }}>—</span>
                      )}
                    </td>

                    {/* Estado global de la red */}
                    <td>
                      <span style={{
                        color: cfg.color, fontSize: '0.72rem', fontWeight: hasAlert ? 700 : 400,
                        fontStyle: !hasAlert ? 'normal' : undefined,
                      }}>
                        {cfg.label}
                      </span>
                    </td>
                  </tr>

                  {/* Detalle expandido inline */}
                  {isOpen && (
                    <tr key={`detail-${net.networkId}`}>
                      <td></td>
                      <td colSpan={7} style={{ padding: '0.75rem 0.5rem 0.75rem 0' }}>
                        <div style={{
                          background: 'rgba(0,0,0,0.15)',
                          borderRadius: 6,
                          padding: '0.75rem 1rem',
                          borderTop: `1px solid ${cfg.color}33`,
                          animation: 'inc-expand 0.18s ease',
                        }}>
                          <NetworkDetail net={net} />
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 2: PATH CONTROL
// ══════════════════════════════════════════════════════════════════════════════
function PathControlPanel({ orgId, networkId, loading, data }) {
  if (loading) return <Spinner text="Cargando path control…" />
  if (!data)   return <p className="inc__empty">Sin datos de path control.</p>

  const { sites } = data
  if (!sites?.length) return <p className="inc__empty">Sin uplinks registrados para esta organización.</p>

  return (
    <div className="inc__panel">
      <Text as="h3" className="inc__panel-title">
        Path Control — Latencia y pérdida de paquetes
        <span className="inc__badge inc__badge--count" style={{ marginLeft: '0.5rem' }}>{sites.length} sitios</span>
      </Text>

      <div className="inc__hist-summary" style={{ marginBottom: '0.75rem' }}>
        <span className="inc__hist-kpi" style={{ color: C.error }}>
          Down <strong style={{ color: C.error }}>{sites.filter(s => s.worstHealth === 'down').length}</strong>
        </span>
        <span className="inc__hist-kpi" style={{ color: C.warning }}>
          Degradado <strong style={{ color: C.warning }}>{sites.filter(s => s.worstHealth === 'degraded').length}</strong>
        </span>
        <span className="inc__hist-kpi" style={{ color: C.success }}>
          OK <strong style={{ color: C.success }}>{sites.filter(s => s.worstHealth === 'good').length}</strong>
        </span>
        <span className="inc__hist-kpi" style={{ color: C.muted }}>
          Standby <strong style={{ color: C.muted }}>{sites.filter(s => s.worstHealth === 'standby').length}</strong>
        </span>
        <span style={{ fontSize: '0.65rem', color: C.muted, marginLeft: 'auto' }}>
          Snapshot: {fmtDate(data.updatedAt)} · ready/not connected = standby normal
        </span>
      </div>

      <div className="inc__table-wrap">
        <table className="inc__table">
          <thead>
            <tr>
              <th>Red / Sitio</th>
              <th>Interface</th>
              <th>Estado</th>
              <th>IP Pública</th>
              <th>Latencia</th>
              <th>Pérdida</th>
              <th>Health</th>
            </tr>
          </thead>
          <tbody>
            {sites.map((site, si) =>
              site.links.map((link, li) => {
                const hcfg = HEALTH_CFG[link.health] || HEALTH_CFG.standby
                // Standby y not-configured: fila atenuada, sin colores de alerta
                const isPassive = link.isStandby || link.isNotConfigured
                return (
                  <tr key={`${si}-${li}`} style={{
                    borderLeft: li === 0 ? `3px solid ${hcfg.color}` : '3px solid transparent',
                    opacity: isPassive ? 0.6 : 1,
                  }}>
                    {li === 0 && (
                      <td className="inc__td-mono" rowSpan={site.links.length}
                        style={{ fontWeight: 600, color: C.accent, verticalAlign: 'top' }}>
                        {site.networkName}
                      </td>
                    )}
                    <td className="inc__td-mono">{link.interface}</td>
                    <td><StatusBadge status={link.status} small /></td>
                    <td className="inc__td-mono" style={{ color: isPassive ? C.muted : 'inherit' }}>
                      {link.publicIp || link.ip || '—'}
                    </td>
                    {/* Latencia: solo colorear si el link es activo */}
                    <td className="inc__td-mono" style={{
                      color: isPassive ? C.muted
                           : link.latencyMs == null ? C.muted
                           : link.latencyMs > 100   ? C.error
                           : link.latencyMs > 50    ? C.warning
                           : C.success
                    }}>
                      {isPassive ? '—' : link.latencyMs != null ? `${link.latencyMs} ms` : '—'}
                    </td>
                    {/* Pérdida: solo colorear si el link es activo */}
                    <td className="inc__td-mono" style={{
                      color: isPassive ? C.muted
                           : link.lossPercent == null ? C.muted
                           : link.lossPercent > 5     ? C.error
                           : link.lossPercent > 1     ? C.warning
                           : C.success
                    }}>
                      {isPassive ? '—' : link.lossPercent != null ? `${link.lossPercent}%` : '—'}
                    </td>
                    <td>
                      <span style={{ color: hcfg.color, fontSize: '0.72rem', fontWeight: 600,
                                     fontStyle: isPassive ? 'italic' : 'normal' }}>
                        {hcfg.label}
                      </span>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 3: USAGE REPORT
// ══════════════════════════════════════════════════════════════════════════════
function UsagePanel({ loading, data }) {
  if (loading) return <Spinner text="Cargando usage report…" />
  if (!data)   return <p className="inc__empty">Sin datos de uso.</p>
  if (data.message) return <p className="inc__empty">{data.message}</p>

  return (
    <div>
      <div style={{ fontSize: '0.65rem', color: C.muted, marginBottom: '0.75rem', fontFamily: 'monospace' }}>
        Datos de las últimas 24h · Capturado: {fmtDate(data.capturedAt)}
      </div>

      <div className="inc__charts-row">
        {/* Top devices chart */}
        <div className="inc__chart-panel inc__chart-panel--wide">
          <Text as="h3" className="inc__panel-title">Top Devices por uso (KB)</Text>
          {data.topDevices?.length === 0
            ? <p className="inc__empty">Sin datos</p>
            : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data.topDevices?.slice(0, 10)} layout="vertical"
                  margin={{ top: 4, right: 20, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" tick={{ fill: C.muted, fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" width={130}
                    tick={{ fill: C.muted, fontSize: 10 }}
                    tickFormatter={v => v?.length > 18 ? v.slice(0, 18) + '…' : v} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="usage.total" name="Total KB" fill={C.accent} radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )
          }
        </div>

        {/* Top clients chart */}
        <div className="inc__chart-panel inc__chart-panel--wide">
          <Text as="h3" className="inc__panel-title">Top Clientes por uso (KB)</Text>
          {data.topClients?.length === 0
            ? <p className="inc__empty">Sin datos</p>
            : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data.topClients?.slice(0, 10)} layout="vertical"
                  margin={{ top: 4, right: 20, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" tick={{ fill: C.muted, fontSize: 10 }} />
                  <YAxis type="category" dataKey="description" width={130}
                    tick={{ fill: C.muted, fontSize: 10 }}
                    tickFormatter={v => v?.length > 18 ? v.slice(0, 18) + '…' : v} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="usage.total" name="Total KB" fill={C.secondary} radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )
          }
        </div>
      </div>

      {/* Tabla top devices */}
      <div className="inc__panel" style={{ marginTop: '0.75rem' }}>
        <Text as="h3" className="inc__panel-title">Detalle — Top Devices</Text>
        <div className="inc__table-wrap">
          <table className="inc__table">
            <thead>
              <tr><th>#</th><th>Dispositivo</th><th>Red</th><th>Enviado</th><th>Recibido</th><th>Total</th></tr>
            </thead>
            <tbody>
              {(data.topDevices || []).map((d, i) => (
                <tr key={i}>
                  <td className="inc__td-mono" style={{ color: C.muted }}>{i + 1}</td>
                  <td className="inc__td-mono">{d.name || d.serial}</td>
                  <td className="inc__td-mono">{d.networkName || '—'}</td>
                  <td className="inc__td-mono">{d.usage?.sentHuman}</td>
                  <td className="inc__td-mono">{d.usage?.recvHuman}</td>
                  <td>
                    <span className="inc__badge" style={{
                      background: 'rgba(0,212,255,0.1)', color: C.accent, border: `1px solid ${C.accent}44`
                    }}>
                      {d.usage?.totalHuman}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 4: DEVICE INVENTORY
// ══════════════════════════════════════════════════════════════════════════════
function InventoryPanel({ orgId, networkId, loading, data, onFilter }) {
  const [filterPT, setFilterPT]   = useState('')
  const [filterSt, setFilterSt]   = useState('')

  const applyFilter = (pt, st) => {
    setFilterPT(pt); setFilterSt(st)
    onFilter({ networkId, productType: pt || undefined, status: st || undefined })
  }

  if (loading) return <Spinner text="Cargando inventario…" />
  if (!data)   return <p className="inc__empty">Sin datos de inventario.</p>
  if (data.message) return <p className="inc__empty">{data.message}</p>

  const { summary, devices } = data

  return (
    <div>
      {/* KPIs por status */}
      <div className="inc__kpi-row" style={{ marginBottom: '1rem' }}>
        {Object.entries(summary?.byStatus || {}).filter(([, v]) => v > 0).map(([st, count]) => (
          <div key={st} className="inc__kpi-card" style={{ minWidth: 100, flex: '0 1 120px' }}>
            <span className="inc__kpi-label">{st}</span>
            <span className="inc__kpi-value" style={{ fontSize: '1.6rem', color: STATUS_COLOR[st] || C.muted }}>
              {count}
            </span>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="portal__filters">
        <select className="inc__org-select" value={filterPT}
          onChange={e => applyFilter(e.target.value, filterSt)}>
          <option value="">Todos los tipos</option>
          {Object.keys(summary?.byType || {}).map(pt => (
            <option key={pt} value={pt}>{PRODUCT_ICONS[pt] || ''} {pt} ({summary.byType[pt]})</option>
          ))}
        </select>
        <select className="inc__org-select" value={filterSt}
          onChange={e => applyFilter(filterPT, e.target.value)}>
          <option value="">Todos los estados</option>
          {['online', 'offline', 'alerting', 'dormant'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <span style={{ fontSize: '0.7rem', color: C.muted, alignSelf: 'center' }}>
          {devices.length} dispositivos · Snapshot: {fmtDate(data.capturedAt)}
        </span>
      </div>

      <div className="inc__table-wrap">
        <table className="inc__table">
          <thead>
            <tr>
              <th>Tipo</th><th>Nombre</th><th>Modelo</th><th>Serial</th>
              <th>Red</th><th>Status</th><th>IP LAN</th><th>Firmware</th><th>Último visto</th>
            </tr>
          </thead>
          <tbody>
            {devices.map((d, i) => (
              <tr key={i} style={d.status === 'offline' ? { background: 'rgba(239,68,68,0.04)' } : {}}>
                <td style={{ fontSize: '1rem' }}>{PRODUCT_ICONS[d.productType] || '📦'}</td>
                <td className="inc__td-mono" style={{ color: C.accent }}>{d.name || d.serial}</td>
                <td className="inc__td-mono">{d.model}</td>
                <td className="inc__td-mono" style={{ fontSize: '0.65rem' }}>{d.serial}</td>
                <td className="inc__td-mono">{d.networkName || '—'}</td>
                <td><StatusBadge status={d.status} small /></td>
                <td className="inc__td-mono">{d.lanIp || '—'}</td>
                <td className="inc__td-mono" style={{ fontSize: '0.65rem' }}>{d.firmware || '—'}</td>
                <td className="inc__td-mono">{d.lastSeenAt ? fmtDate(d.lastSeenAt) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════
export default function CustomerPortal() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [theme, setTheme] = useState(() => localStorage.getItem(LS_THEME) || 'dark')

  const palette = PALETTES[theme] || PALETTES.dark
  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem(LS_THEME, next)
  }

  const [orgs, setOrgs]               = useState([])
  const [networks, setNetworks]        = useState([])
  const [selectedOrg, setSelectedOrg]  = useState('')
  const [selectedNet, setSelectedNet]  = useState('')
  const [activeTab, setActiveTab]      = useState('status')

  // Datos por tab
  const [statusData, setStatusData]    = useState(null)
  const [pathData, setPathData]        = useState(null)
  const [usageData, setUsageData]      = useState(null)
  const [inventoryData, setInventoryData] = useState(null)

  // Loadings
  const [loadingStatus,    setLoadingStatus]    = useState(false)
  const [loadingPath,      setLoadingPath]      = useState(false)
  const [loadingUsage,     setLoadingUsage]     = useState(false)
  const [loadingInventory, setLoadingInventory] = useState(false)

  // ── Cargar orgs ────────────────────────────────────────────────────────────
  useEffect(() => {
    getPortalOrgs().then(list => {
      if (!list?.length) return
      setOrgs(list)
      const fromUrl = searchParams.get('orgId')
      const fromLs  = localStorage.getItem(LS_ORG)
      const target  = fromUrl || fromLs
      const found   = list.find(o => o.id === target)
      setSelectedOrg(found ? found.id : '')
    })
  }, [])

  useEffect(() => {
    if (selectedOrg) localStorage.setItem(LS_ORG, selectedOrg)
  }, [selectedOrg])

  // ── Cargar Status Map (global o por org) ──────────────────────────────────
  useEffect(() => {
    setLoadingStatus(true)
    getPortalStatusMap(selectedOrg || null)
      .then(d => {
        setStatusData(d)
        if (d?.networks) setNetworks(d.networks)
        else setNetworks([])
      })
      .finally(() => setLoadingStatus(false))
  }, [selectedOrg])

  // ── Cargar Path Control ───────────────────────────────────────────────────
  useEffect(() => {
    if (activeTab !== 'path' || !selectedOrg) return
    setLoadingPath(true)
    getPortalPathControl(selectedOrg, selectedNet || null)
      .then(d => setPathData(d))
      .finally(() => setLoadingPath(false))
  }, [activeTab, selectedOrg, selectedNet])

  // ── Cargar Usage ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (activeTab !== 'usage' || !selectedOrg) return
    setLoadingUsage(true)
    getPortalUsage(selectedOrg)
      .then(d => setUsageData(d))
      .finally(() => setLoadingUsage(false))
  }, [activeTab, selectedOrg])

  // ── Cargar Inventory ──────────────────────────────────────────────────────
  useEffect(() => {
    if (activeTab !== 'inventory' || !selectedOrg) return
    setLoadingInventory(true)
    getPortalInventory(selectedOrg, { networkId: selectedNet || undefined })
      .then(d => setInventoryData(d))
      .finally(() => setLoadingInventory(false))
  }, [activeTab, selectedOrg, selectedNet])

  const handleInventoryFilter = useCallback(filters => {
    if (!selectedOrg) return
    setLoadingInventory(true)
    getPortalInventory(selectedOrg, filters)
      .then(d => setInventoryData(d))
      .finally(() => setLoadingInventory(false))
  }, [selectedOrg])

  const orgName = orgs.find(o => o.id === selectedOrg)?.name || ''
  const netName = networks?.find?.(n => n.networkId === selectedNet)?.networkName || ''

  // Estilos inline que responden a la paleta seleccionada
  const portalStyle = {
    background:  palette.bg,
    color:       palette.text,
    minHeight:   '100vh',
    padding:     '1.5rem 1.25rem',
    fontFamily:  'var(--font-ui, Inter, system-ui, sans-serif)',
    transition:  'background 0.3s ease, color 0.3s ease',
  }

  const cardStyle = {
    background:  palette.card,
    border:      `1px solid ${palette.border}`,
    borderRadius: 8,
    padding:     '1rem 1.1rem',
    boxShadow:   palette.shadow,
    marginBottom: '0.75rem',
  }

  const tableHeaderStyle = {
    background: palette.elevated,
    color:      palette.textMuted,
  }

  return (
    <div style={portalStyle}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="inc__header" style={{ borderBottomColor: palette.border }}>
        <div className="inc__header-left">
          <Text as="h2" className="inc__title" style={{ color: theme === 'light' ? '#0369a1' : undefined }}>
            Customer Portal
          </Text>
          <Text as="p" className="inc__subtitle" style={{ color: palette.textMuted }}>
            Real-time status · Path Control · Usage · Device Inventory
            {selectedOrg
              ? ` — ${orgName}`
              : ' — Vista global de todas las organizaciones'
            }
          </Text>
        </div>
        <div className="inc__controls">
          {/* Toggle de tema */}
          <button
            onClick={toggleTheme}
            title="Cambiar tema claro/oscuro"
            style={{
              background:   palette.elevated,
              border:       `1px solid ${palette.borderAccent}`,
              borderRadius: 6,
              color:        palette.text,
              padding:      '0.3rem 0.8rem',
              fontSize:     '0.78rem',
              cursor:       'pointer',
              fontFamily:   'monospace',
              transition:   'all 0.2s ease',
            }}
          >
            {PALETTES[theme === 'dark' ? 'light' : 'dark'].name}
          </button>

          {/* Selector de org */}
          <div className="inc__org-selector">
            <label className="inc__period-label" style={{ color: palette.textMuted }}>Org:</label>
            <select className="inc__org-select" value={selectedOrg}
              style={{ background: palette.elevated, color: palette.text, borderColor: palette.borderAccent }}
              onChange={e => { setSelectedOrg(e.target.value); setSelectedNet('') }}>
              <option value="">— Global (todas) —</option>
              {orgs.map(o => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </div>

          {/* Selector de red */}
          {selectedOrg && networks?.length > 0 && (
            <div className="inc__org-selector">
              <label className="inc__period-label" style={{ color: palette.textMuted }}>Red:</label>
              <select className="inc__org-select" value={selectedNet}
                style={{ background: palette.elevated, color: palette.text, borderColor: palette.borderAccent }}
                onChange={e => setSelectedNet(e.target.value)}>
                <option value="">Todas las redes</option>
                {networks.map(n => (
                  <option key={n.networkId} value={n.networkId}>{n.networkName}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div className="inc__tabs">
        {[
          { id: 'status',    label: 'Status Map' },
          { id: 'path',      label: 'Path Control', disabled: !selectedOrg },
          { id: 'usage',     label: 'Usage Report', disabled: !selectedOrg },
          { id: 'inventory', label: 'Device Inventory', disabled: !selectedOrg },
        ].map(tab => (
          <button key={tab.id}
            className={`inc__tab${activeTab === tab.id ? ' inc__tab--active' : ''}${tab.disabled ? ' inc__tab--disabled' : ''}`}
            onClick={() => !tab.disabled && setActiveTab(tab.id)}
            title={tab.disabled ? 'Seleccioná una organización primero' : ''}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Panels ───────────────────────────────────────────────────────── */}
      <div style={{ ...cardStyle, borderRadius: '0 8px 8px 8px' }}>
        {activeTab === 'status' && (
          <StatusMapPanel
            orgId={selectedOrg}
            networks={selectedOrg
              ? (selectedNet
                  ? networks?.filter(n => n.networkId === selectedNet)
                  : networks)
              : null}
            globalData={!selectedOrg ? statusData : null}
            loading={loadingStatus}
          />
        )}
        {activeTab === 'path' && (
          <PathControlPanel
            orgId={selectedOrg}
            networkId={selectedNet}
            loading={loadingPath}
            data={pathData}
          />
        )}
        {activeTab === 'usage' && (
          <UsagePanel loading={loadingUsage} data={usageData} />
        )}
        {activeTab === 'inventory' && (
          <InventoryPanel
            orgId={selectedOrg}
            networkId={selectedNet}
            loading={loadingInventory}
            data={inventoryData}
            onFilter={handleInventoryFilter}
          />
        )}
      </div>

      <div className="inc__footer-note" style={{ color: palette.textMuted, borderTopColor: palette.border }}>
        Customer Portal · Meraki Partner Certification ·
        {selectedOrg ? ` ${orgName}` : ' Vista global'}{netName ? ` · ${netName}` : ''}
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell
} from 'recharts'
import Text from '../components/Text'
import {
  getVpnOrgs,
  getVpnEventNetworks,
  getVpnEventsRecent,
  getVpnTunnelAnalysis,
  getVpnEventStats,
} from '../utils/api'

// ── Paleta ────────────────────────────────────────────────────────────────────
const COLOR_ACCENT    = '#00d4ff'
const COLOR_SECONDARY = '#3b82f6'
const COLOR_SUCCESS   = '#10b981'
const COLOR_WARNING   = '#f59e0b'
const COLOR_ERROR     = '#ef4444'
const COLOR_MUTED     = '#64748b'

const RISK_CFG = {
  high:   { color: COLOR_ERROR,     label: '🔴 Alto'   },
  medium: { color: COLOR_WARNING,   label: '🟡 Medio'  },
  low:    { color: COLOR_SECONDARY, label: '🔵 Bajo'   },
  stable: { color: COLOR_SUCCESS,   label: '✔ Estable' },
}

const HOURS_OPTIONS  = [6, 12, 24, 48, 72]
const DAYS_OPTIONS   = [
  { value: 1, label: '24h'    },
  { value: 3, label: '3 días' },
  { value: 7, label: '7 días' },
  { value: 14, label: '14 días'},
  { value: 30, label: '1 mes' },
]

const LS_KEY_ORG = 'vpnevt_last_org'
const LS_KEY_NET = 'vpnevt_last_net'

const fmtDate = d => d ? new Date(d).toLocaleString('en-GB', {
  day: '2-digit', month: '2-digit', year: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit',
}) : '—'

// ── Tooltip recharts ──────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="inc__tooltip">
      {label && <p className="inc__tooltip-label">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || COLOR_ACCENT }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  )
}

// ── Panel: Event Log (tabla raw estilo Meraki) ────────────────────────────────
function EventLogPanel({ orgId, networkId, hours, onHoursChange }) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!orgId) return
    setLoading(true)
    getVpnEventsRecent(orgId, networkId, hours)
      .then(d => setData(d))
      .finally(() => setLoading(false))
  }, [orgId, networkId, hours])

  return (
    <div className="inc__panel">
      <div className="inc__hist-controls">
        <Text as="h3" className="inc__panel-title" style={{ margin: 0 }}>
          Event Log — VPN Connectivity
          {data && (
            <span className="inc__badge inc__badge--count" style={{ marginLeft: '0.5rem' }}>
              {data.total}
            </span>
          )}
        </Text>
        <div className="inc__hist-period">
          <span className="inc__period-label">Últimas:</span>
          {HOURS_OPTIONS.map(h => (
            <button key={h}
              className={`inc__period-btn${hours === h ? ' inc__period-btn--active' : ''}`}
              onClick={() => onHoursChange(h)}
            >
              {h}h
            </button>
          ))}
        </div>
      </div>

      {loading && <div className="inc__loading"><span className="inc__spinner" /> Cargando eventos…</div>}

      {!loading && data && (
        data.events.length === 0
          ? <p className="inc__empty">Sin eventos VPN en este período. El cron recolecta cada hora — volvé en un rato.</p>
          : (
            <div className="inc__table-wrap">
              <table className="inc__table">
                <thead>
                  <tr>
                    <th>Fecha/Hora</th>
                    <th>Red</th>
                    <th>Categoría</th>
                    <th>Tipo evento</th>
                    <th>Peer</th>
                    <th>Estado</th>
                    <th>Descripción</th>
                  </tr>
                </thead>
                <tbody>
                  {data.events.map((ev, i) => {
                    const isDown = ev.connectivity === false
                    const isUp   = ev.connectivity === true
                    return (
                      <tr key={i} style={
                        isDown ? { borderLeft: `3px solid ${COLOR_ERROR}`,   background: 'rgba(239,68,68,0.04)' }
                       : isUp  ? { borderLeft: `3px solid ${COLOR_SUCCESS}`, background: 'rgba(16,185,129,0.04)' }
                       : {}
                      }>
                        <td className="inc__td-mono" style={{ whiteSpace: 'nowrap' }}>
                          {fmtDate(ev.occurredAt)}
                        </td>
                        <td className="inc__td-mono" style={{ maxWidth: 160 }}>
                          <span title={ev.networkName} style={{
                            display: 'block', overflow: 'hidden',
                            textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 155
                          }}>
                            {ev.networkName || ev.networkId}
                          </span>
                        </td>
                        <td className="inc__td-mono" style={{ fontSize: '0.7rem' }}>
                          {ev.category || '—'}
                        </td>
                        <td>
                          <span className="inc__badge inc__badge--type" style={{ fontSize: '0.6rem' }}>
                            {(ev.eventType || '').replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="inc__td-mono">{ev.peerContact || '—'}</td>
                        <td>
                          {isDown && <span className="inc__badge" style={{ background: 'rgba(239,68,68,0.15)', color: COLOR_ERROR,   border: `1px solid ${COLOR_ERROR}44`   }}>↓ disconnected</span>}
                          {isUp   && <span className="inc__badge" style={{ background: 'rgba(16,185,129,0.15)', color: COLOR_SUCCESS, border: `1px solid ${COLOR_SUCCESS}44` }}>↑ connected</span>}
                          {ev.connectivity === null && <span style={{ color: COLOR_MUTED, fontSize: '0.7rem' }}>—</span>}
                        </td>
                        <td className="inc__td-mono" style={{ fontSize: '0.68rem', color: COLOR_MUTED, maxWidth: 220 }}>
                          <span title={ev.description}>{ev.description || '—'}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )
      )}
    </div>
  )
}

// ── Panel: Análisis de tunnels ────────────────────────────────────────────────
function TunnelAnalysisPanel({ orgId, networkId, days, onDaysChange }) {
  const [data, setData]         = useState(null)
  const [loading, setLoading]   = useState(false)
  const [expanded, setExpanded] = useState({})
  const toggle = k => setExpanded(p => ({ ...p, [k]: !p[k] }))

  useEffect(() => {
    if (!orgId) return
    setLoading(true)
    getVpnTunnelAnalysis(orgId, days, networkId)
      .then(d => setData(d))
      .finally(() => setLoading(false))
  }, [orgId, networkId, days])

  return (
    <div className="inc__panel">
      <div className="inc__hist-controls">
        <Text as="h3" className="inc__panel-title" style={{ margin: 0 }}>
          Análisis de Tunnels
          {data && (
            <span className="inc__badge inc__badge--count" style={{ marginLeft: '0.5rem' }}>
              {data.summary?.totalTunnels}
            </span>
          )}
        </Text>
        <div className="inc__hist-period">
          {DAYS_OPTIONS.map(opt => (
            <button key={opt.value}
              className={`inc__period-btn${days === opt.value ? ' inc__period-btn--active' : ''}`}
              onClick={() => onDaysChange(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {loading && <div className="inc__loading"><span className="inc__spinner" /> Analizando tunnels…</div>}

      {!loading && data && (
        <>
          {/* Mini KPIs */}
          <div className="inc__hist-summary">
            <span className="inc__hist-kpi">Tunnels con caídas <strong>{data.summary?.totalTunnels}</strong></span>
            <span className="inc__hist-kpi" style={{ color: COLOR_ERROR }}>
              Alto riesgo <strong style={{ color: COLOR_ERROR }}>{data.summary?.highRisk}</strong>
            </span>
            <span className="inc__hist-kpi" style={{ color: COLOR_WARNING }}>
              Riesgo medio <strong style={{ color: COLOR_WARNING }}>{data.summary?.mediumRisk}</strong>
            </span>
            {data.summary?.currentlyDown > 0 && (
              <span className="inc__hist-kpi" style={{ color: COLOR_ERROR, fontWeight: 700 }}>
                ⚠ Down ahora <strong style={{ color: COLOR_ERROR }}>{data.summary?.currentlyDown}</strong>
              </span>
            )}
            <span style={{ marginLeft: 'auto', fontSize: '0.68rem', color: COLOR_MUTED }}>
              ▸ clic para ver episodios
            </span>
          </div>

          {data.tunnels.length === 0
            ? <p className="inc__empty">Sin caídas de tunnels registradas en este período.</p>
            : (
              <div className="inc__table-wrap">
                <table className="inc__table">
                  <thead>
                    <tr>
                      <th style={{ width: 24 }}></th>
                      <th>Red</th>
                      <th>Peer (IP:puerto)</th>
                      <th>Caídas</th>
                      <th>Down total</th>
                      <th>Down promedio</th>
                      <th>Estado actual</th>
                      <th>Riesgo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.tunnels.map((t, ti) => {
                      const risk    = RISK_CFG[t.riskLevel] || RISK_CFG.stable
                      const isOpen  = expanded[ti]
                      return (
                        <>
                          <tr key={ti}
                            onClick={() => toggle(ti)}
                            className="inc__recurrence-row"
                            style={{ cursor: 'pointer', borderLeft: `3px solid ${risk.color}` }}
                          >
                            <td style={{ color: COLOR_MUTED, fontSize: '0.7rem' }}>{isOpen ? '▾' : '▸'}</td>
                            <td className="inc__td-mono">{t.networkName}</td>
                            <td className="inc__td-mono">{t.peerContact}</td>
                            <td>
                              <span className="inc__badge" style={{
                                background: risk.color + '22', color: risk.color,
                                border: `1px solid ${risk.color}55`
                              }}>
                                {t.downCount} {t.downCount === 1 ? 'caída' : 'caídas'}
                              </span>
                            </td>
                            <td className="inc__td-mono">{t.totalDownHuman}</td>
                            <td className="inc__td-mono">{t.avgDownHuman}</td>
                            <td>
                              {t.currentlyDown
                                ? <span className="inc__badge" style={{ background: 'rgba(239,68,68,0.15)', color: COLOR_ERROR, border: `1px solid ${COLOR_ERROR}44` }}>
                                    ↓ DOWN desde {fmtDate(t.downSince)}
                                  </span>
                                : <span className="inc__badge" style={{ background: 'rgba(16,185,129,0.12)', color: COLOR_SUCCESS, border: `1px solid ${COLOR_SUCCESS}44` }}>
                                    ✔ UP
                                  </span>
                              }
                            </td>
                            <td style={{ fontSize: '0.72rem', color: risk.color, fontWeight: 600 }}>
                              {risk.label}
                            </td>
                          </tr>

                          {isOpen && t.episodes.length > 0 && (
                            <tr key={`ep-${ti}`} className="inc__recurrence-episodes-row">
                              <td colSpan={8} style={{ padding: 0 }}>
                                <div className="inc__recurrence-episodes">
                                  <table className="inc__table inc__table--inner">
                                    <thead>
                                      <tr>
                                        <th>#</th>
                                        <th>Caída</th>
                                        <th>Recuperación</th>
                                        <th>Duración</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {t.episodes.map((ep, ei) => (
                                        <tr key={ei}>
                                          <td className="inc__td-mono" style={{ color: COLOR_MUTED }}>
                                            {ei + 1}
                                          </td>
                                          <td className="inc__td-mono" style={{ color: COLOR_ERROR }}>
                                            {fmtDate(ep.downAt)}
                                          </td>
                                          <td className="inc__td-mono" style={{ color: COLOR_SUCCESS }}>
                                            {fmtDate(ep.upAt)}
                                          </td>
                                          <td>
                                            <span className="inc__badge" style={{
                                              background: ep.durationMin > 60 ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                                              color:      ep.durationMin > 60 ? COLOR_ERROR : COLOR_WARNING,
                                              border:     `1px solid ${ep.durationMin > 60 ? COLOR_ERROR : COLOR_WARNING}44`
                                            }}>
                                              {ep.durationHuman}
                                            </span>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
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
            )
          }
        </>
      )}
    </div>
  )
}

// ── Panel: Estadísticas / gráficos ────────────────────────────────────────────
function StatsPanel({ orgId, days, onDaysChange }) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!orgId) return
    setLoading(true)
    getVpnEventStats(orgId, days)
      .then(d => setData(d))
      .finally(() => setLoading(false))
  }, [orgId, days])

  return (
    <div className="inc__panel">
      <div className="inc__hist-controls">
        <Text as="h3" className="inc__panel-title" style={{ margin: 0 }}>
          Estadísticas VPN
        </Text>
        <div className="inc__hist-period">
          {DAYS_OPTIONS.map(opt => (
            <button key={opt.value}
              className={`inc__period-btn${days === opt.value ? ' inc__period-btn--active' : ''}`}
              onClick={() => onDaysChange(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {loading && <div className="inc__loading"><span className="inc__spinner" /> Cargando estadísticas…</div>}

      {!loading && data && (
        <div className="inc__charts-row" style={{ marginTop: '0.75rem' }}>
          {/* Caídas por día */}
          <div className="inc__chart-panel inc__chart-panel--wide">
            <Text as="h3" className="inc__panel-title">Eventos VPN por día</Text>
            {data.byDay.length === 0
              ? <p className="inc__empty">Sin datos aún — el cron recolecta cada hora.</p>
              : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.byDay} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" tick={{ fill: COLOR_MUTED, fontSize: 10 }} tickFormatter={v => v.slice(5)} />
                    <YAxis tick={{ fill: COLOR_MUTED, fontSize: 10 }} allowDecimals={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="downs" name="Caídas"       fill={COLOR_ERROR}   radius={[3,3,0,0]} stackId="a" />
                    <Bar dataKey="ups"   name="Recuperaciones" fill={COLOR_SUCCESS} radius={[3,3,0,0]} stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              )
            }
          </div>

          {/* Top redes */}
          <div className="inc__chart-panel">
            <Text as="h3" className="inc__panel-title">Top redes — caídas</Text>
            {data.topNetworks.length === 0
              ? <p className="inc__empty">Sin datos.</p>
              : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.topNetworks} layout="vertical"
                    margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis type="number" tick={{ fill: COLOR_MUTED, fontSize: 10 }} allowDecimals={false} />
                    <YAxis type="category" dataKey="networkName" width={140}
                      tick={{ fill: COLOR_MUTED, fontSize: 10 }}
                      tickFormatter={v => v.length > 20 ? v.slice(0, 20) + '…' : v}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="downEvents" name="Caídas" fill={COLOR_ERROR} radius={[0,3,3,0]} />
                  </BarChart>
                </ResponsiveContainer>
              )
            }
          </div>
        </div>
      )}
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function VpnEventLog() {
  const [orgs, setOrgs]           = useState([])
  const [selectedOrg, setSelectedOrg] = useState('')
  const [networks, setNetworks]   = useState([])
  const [selectedNet, setSelectedNet] = useState('')
  const [activeTab, setActiveTab] = useState('log')   // log | tunnels | stats
  const [hours, setHours]         = useState(24)
  const [analysisDays, setAnalysisDays] = useState(7)
  const [statsDays, setStatsDays] = useState(7)

  // Cargar orgs
  useEffect(() => {
    getVpnOrgs().then(list => {
      if (!list?.length) return
      setOrgs(list)
      const last  = localStorage.getItem(LS_KEY_ORG)
      const found = list.find(o => o.id === last)
      setSelectedOrg(found ? found.id : list[0].id)
    })
  }, [])

  useEffect(() => {
    if (selectedOrg) localStorage.setItem(LS_KEY_ORG, selectedOrg)
  }, [selectedOrg])

  // Cargar redes con eventos cuando cambia la org
  useEffect(() => {
    if (!selectedOrg) return
    setSelectedNet('')
    getVpnEventNetworks(selectedOrg).then(list => {
      setNetworks(list || [])
      const last  = localStorage.getItem(LS_KEY_NET)
      const found = (list || []).find(n => n.id === last)
      if (found) setSelectedNet(found.id)
    })
  }, [selectedOrg])

  useEffect(() => {
    if (selectedNet) localStorage.setItem(LS_KEY_NET, selectedNet)
  }, [selectedNet])

  const orgName = orgs.find(o => o.id === selectedOrg)?.name || ''

  return (
    <div className="inc__dashboard">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="inc__header">
        <div className="inc__header-left">
          <Text as="h2" className="inc__title">VPN Event Log</Text>
          <Text as="p" className="inc__subtitle">
            Log histórico de eventos VPN — cambios de conectividad de tunnels · recolección cada hora
          </Text>
        </div>
        <div className="inc__controls">
          {/* Selector de organización */}
          {orgs.length > 0 && (
            <div className="inc__org-selector">
              <label className="inc__period-label">Org:</label>
              <select className="inc__org-select" value={selectedOrg}
                onChange={e => setSelectedOrg(e.target.value)}>
                {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
          )}
          {/* Selector de red (opcional — todas si no se selecciona) */}
          {networks.length > 0 && (
            <div className="inc__org-selector">
              <label className="inc__period-label">Red:</label>
              <select className="inc__org-select" value={selectedNet}
                onChange={e => setSelectedNet(e.target.value)}>
                <option value="">Todas</option>
                {networks.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div className="inc__tabs">
        <button className={`inc__tab${activeTab === 'log' ? ' inc__tab--active' : ''}`}
          onClick={() => setActiveTab('log')}>
          Event Log
        </button>
        <button className={`inc__tab${activeTab === 'tunnels' ? ' inc__tab--active' : ''}`}
          onClick={() => setActiveTab('tunnels')}>
          Análisis de Tunnels
        </button>
        <button className={`inc__tab${activeTab === 'stats' ? ' inc__tab--active' : ''}`}
          onClick={() => setActiveTab('stats')}>
          Estadísticas
        </button>
      </div>

      {activeTab === 'log' && (
        <EventLogPanel
          orgId={selectedOrg}
          networkId={selectedNet || null}
          hours={hours}
          onHoursChange={setHours}
        />
      )}
      {activeTab === 'tunnels' && (
        <TunnelAnalysisPanel
          orgId={selectedOrg}
          networkId={selectedNet || null}
          days={analysisDays}
          onDaysChange={setAnalysisDays}
        />
      )}
      {activeTab === 'stats' && (
        <StatsPanel
          orgId={selectedOrg}
          days={statsDays}
          onDaysChange={setStatsDays}
        />
      )}

      <div className="inc__footer-note">
        VPN Events · {orgName}{selectedNet ? ` · ${networks.find(n=>n.id===selectedNet)?.name}` : ' · Todas las redes'} · Recolectado desde /networks/events
      </div>
    </div>
  )
}

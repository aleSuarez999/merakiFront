import { useEffect, useState, useCallback } from 'react'
import Text from '../components/Text'
import {
  getVpnOrgs,
  getVpnStatus,
  getVpnOpenIncidents,
  updateVpnIncidentStatus,
  getVpnRecurrence,
} from '../utils/api'

// ── Paleta (misma del proyecto) ───────────────────────────────────────────────
const COLOR_ACCENT    = '#00d4ff'
const COLOR_SECONDARY = '#3b82f6'
const COLOR_SUCCESS   = '#10b981'
const COLOR_WARNING   = '#f59e0b'
const COLOR_ERROR     = '#ef4444'
const COLOR_MUTED     = '#64748b'

const WORK_STATUS_CFG = {
  active:      { label: 'Active',      color: COLOR_ERROR,   bg: 'rgba(239,68,68,0.10)'  },
  in_progress: { label: 'In Progress', color: COLOR_WARNING, bg: 'rgba(245,158,11,0.12)' },
  resolved:    { label: 'Resolved',    color: COLOR_SUCCESS, bg: 'rgba(16,185,129,0.10)' },
}

const RECUR_PERIOD_OPTIONS = [
  { value: 7,  label: '1 sem'  },
  { value: 14, label: '2 sem'  },
  { value: 30, label: '1 mes'  },
  { value: 60, label: '2 meses'},
]

const LS_VPN_ORG = 'vpn_last_org'

const fmtDate = d => new Date(d).toLocaleString('en-GB', {
  day: '2-digit', month: '2-digit', year: '2-digit',
  hour: '2-digit', minute: '2-digit',
})

// ── Badge de reachability ─────────────────────────────────────────────────────
function ReachBadge({ value }) {
  const ok = value === 'reachable'
  return (
    <span className="inc__badge" style={{
      background: ok ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
      color:      ok ? COLOR_SUCCESS : COLOR_ERROR,
      border:     `1px solid ${ok ? COLOR_SUCCESS : COLOR_ERROR}44`,
    }}>
      {ok ? '✔ reachable' : '✖ unreachable'}
    </span>
  )
}

// ── KPI mini ──────────────────────────────────────────────────────────────────
function KpiMini({ label, value, color }) {
  return (
    <div className="inc__kpi-card" style={{ minWidth: 110, flex: '0 1 130px' }}>
      <span className="inc__kpi-label">{label}</span>
      <span className="inc__kpi-value" style={{ fontSize: '1.6rem', color: color || 'inherit' }}>
        {value}
      </span>
    </div>
  )
}

// ── Panel: estado actual ──────────────────────────────────────────────────────
function VpnStatusPanel({ data, loading }) {
  const [expanded, setExpanded] = useState({})
  const toggle = id => setExpanded(p => ({ ...p, [id]: !p[id] }))

  if (loading)
    return <div className="inc__loading"><span className="inc__spinner" /> Cargando estado VPN…</div>
  if (!data || !data.networks)
    return <p className="inc__empty">Sin datos de VPN. El cron aún no capturó un snapshot para esta organización.</p>

  const { summary, networks, capturedAt } = data

  return (
    <div className="inc__panel">
      {/* KPIs */}
      <div className="inc__kpi-row" style={{ marginBottom: '1rem' }}>
        <KpiMini label="Peers totales" value={summary?.totalPeers} />
        <KpiMini label="Up"   value={summary?.upPeers}   color={COLOR_SUCCESS} />
        <KpiMini label="Down" value={summary?.downPeers} color={summary?.downPeers > 0 ? COLOR_ERROR : COLOR_MUTED} />
      </div>

      {networks.length === 0
        ? <p className="inc__empty">No hay redes con VPN configurada.</p>
        : networks.map(net => {
            const allPeers = [...(net.merakiPeers || []), ...(net.thirdPartyPeers || [])]
            const downCount = allPeers.filter(p => p.reachability !== 'reachable').length
            const isOpen    = expanded[net.networkId]

            return (
              <div key={net.networkId} className="vpn__network-card">
                {/* Header de red */}
                <div
                  className="vpn__network-header"
                  onClick={() => toggle(net.networkId)}
                  style={{ borderLeft: `3px solid ${downCount > 0 ? COLOR_ERROR : COLOR_SUCCESS}` }}
                >
                  <span className="vpn__network-name">{net.networkName || net.networkId}</span>
                  <span className="vpn__network-meta">
                    <span className="inc__badge" style={{
                      background: net.vpnMode === 'hub' ? 'rgba(0,212,255,0.12)' : 'rgba(59,130,246,0.12)',
                      color:      net.vpnMode === 'hub' ? COLOR_ACCENT : COLOR_SECONDARY,
                      border:     `1px solid ${net.vpnMode === 'hub' ? COLOR_ACCENT : COLOR_SECONDARY}44`,
                    }}>
                      {net.vpnMode || 'none'}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: COLOR_MUTED, marginLeft: '0.5rem' }}>
                      {allPeers.length} peers
                    </span>
                    {downCount > 0 && (
                      <span style={{ fontSize: '0.7rem', color: COLOR_ERROR, marginLeft: '0.5rem', fontWeight: 700 }}>
                        ⚠ {downCount} down
                      </span>
                    )}
                    <span style={{ color: COLOR_MUTED, marginLeft: '0.75rem', fontSize: '0.7rem' }}>
                      {isOpen ? '▾' : '▸'}
                    </span>
                  </span>
                </div>

                {/* Peers (expandible) */}
                {isOpen && (
                  <div className="vpn__peers-wrap">
                    {/* Meraki peers */}
                    {(net.merakiPeers || []).length > 0 && (
                      <>
                        <p className="vpn__peer-type-label">Meraki peers</p>
                        <table className="inc__table">
                          <thead>
                            <tr>
                              <th>Red destino</th>
                              <th>Estado</th>
                              <th>Prioridad</th>
                            </tr>
                          </thead>
                          <tbody>
                            {net.merakiPeers.map((p, i) => (
                              <tr key={i}>
                                <td className="inc__td-mono">{p.networkName || p.networkId}</td>
                                <td><ReachBadge value={p.reachability} /></td>
                                <td className="inc__td-mono">{p.priority ?? '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </>
                    )}

                    {/* Third-party peers */}
                    {(net.thirdPartyPeers || []).length > 0 && (
                      <>
                        <p className="vpn__peer-type-label" style={{ marginTop: '0.5rem' }}>Third-party peers</p>
                        <table className="inc__table">
                          <thead>
                            <tr>
                              <th>Nombre</th>
                              <th>IP pública</th>
                              <th>Estado</th>
                            </tr>
                          </thead>
                          <tbody>
                            {net.thirdPartyPeers.map((p, i) => (
                              <tr key={i}>
                                <td className="inc__td-mono">{p.name || '—'}</td>
                                <td className="inc__td-mono">{p.publicIp || '—'}</td>
                                <td><ReachBadge value={p.reachability} /></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </>
                    )}

                    {allPeers.length === 0 && (
                      <p className="inc__empty" style={{ padding: '0.5rem 0' }}>Sin peers configurados.</p>
                    )}
                  </div>
                )}
              </div>
            )
          })
      }

      {capturedAt && (
        <div className="inc__footer-note" style={{ marginTop: '0.75rem' }}>
          Snapshot capturado: {fmtDate(capturedAt)} · Actualizado cada 10 min por el cron
        </div>
      )}
    </div>
  )
}

// ── Fila editable de incidente VPN abierto ───────────────────────────────────
function VpnIncidentRow({ inc, onSave }) {
  const [ws, setWs]       = useState(inc.workStatus || 'active')
  const [claim, setClaim] = useState(inc.claimNumber || '')
  const [notes, setNotes] = useState(inc.resolutionNotes || '')
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty]   = useState(false)

  const mk = (setter) => v => { setter(v); setDirty(true) }

  const handleSave = async () => {
    setSaving(true)
    await onSave(inc._id, { workStatus: ws, claimNumber: claim, resolutionNotes: notes })
    setSaving(false)
    setDirty(false)
  }

  const cfg = WORK_STATUS_CFG[ws] || WORK_STATUS_CFG.active
  const rowStyle = ws === 'in_progress'
    ? { background: 'rgba(245,158,11,0.07)', borderLeft: `3px solid ${COLOR_WARNING}` }
    : {}

  return (
    <tr style={rowStyle}>
      <td className="inc__td-mono">{inc.networkName || inc.networkId || '—'}</td>
      <td>
        <span className="inc__badge" style={{
          background: inc.peerType === 'meraki' ? 'rgba(0,212,255,0.12)' : 'rgba(59,130,246,0.12)',
          color:      inc.peerType === 'meraki' ? COLOR_ACCENT : COLOR_SECONDARY,
          border:     `1px solid ${inc.peerType === 'meraki' ? COLOR_ACCENT : COLOR_SECONDARY}44`,
        }}>
          {inc.peerType}
        </span>
      </td>
      <td className="inc__td-mono">{inc.peerName || '—'}</td>
      <td className="inc__td-mono">{inc.peerPublicIp || '—'}</td>
      <td className="inc__td-mono">{fmtDate(inc.detectedAt)}</td>
      <td>
        <select
          className="inc__ws-select"
          value={ws}
          onChange={e => mk(setWs)(e.target.value)}
          style={{ color: cfg.color, borderColor: cfg.color + '88', background: cfg.bg }}
        >
          <option value="active">Active</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>
      </td>
      <td>
        <input className="inc__claim-input" type="text" placeholder="Nro reclamo"
          value={claim} onChange={e => mk(setClaim)(e.target.value)} />
      </td>
      <td>
        <input className="inc__claim-input inc__claim-input--wide" type="text" placeholder="Motivo"
          value={notes} onChange={e => mk(setNotes)(e.target.value)} />
      </td>
      <td>
        <button
          className={`inc__save-btn${dirty ? ' inc__save-btn--dirty' : ''}`}
          onClick={handleSave} disabled={!dirty || saving} title="Guardar"
        >
          {saving ? '…' : '✔'}
        </button>
      </td>
    </tr>
  )
}

// ── Panel: incidentes abiertos ────────────────────────────────────────────────
function VpnIncidentsPanel({ incidents, loading, onSave }) {
  if (loading)
    return <div className="inc__loading"><span className="inc__spinner" /> Cargando incidentes VPN…</div>

  return (
    <div className="inc__panel">
      <Text as="h3" className="inc__panel-title">
        VPN Incidents — Open
        <span className="inc__badge inc__badge--count" style={{ marginLeft: '0.5rem' }}>{incidents.length}</span>
      </Text>
      {incidents.length === 0
        ? <p className="inc__empty">No hay incidentes VPN abiertos para esta organización.</p>
        : (
          <div className="inc__table-wrap">
            <table className="inc__table">
              <thead>
                <tr>
                  <th>Red origen</th><th>Tipo peer</th><th>Peer</th>
                  <th>IP pública</th><th>Detectado</th>
                  <th>Status</th><th>Claim #</th><th>Motivo</th><th></th>
                </tr>
              </thead>
              <tbody>
                {incidents.map(i => <VpnIncidentRow key={i._id} inc={i} onSave={onSave} />)}
              </tbody>
            </table>
          </div>
        )
      }
    </div>
  )
}

// ── Panel: reincidencias VPN ──────────────────────────────────────────────────
function VpnRecurrencePanel({ data, loading, recurDays, onRecurDaysChange }) {
  const [expandedPeer, setExpandedPeer] = useState({})
  const toggle = k => setExpandedPeer(p => ({ ...p, [k]: !p[k] }))

  if (loading)
    return <div className="inc__loading"><span className="inc__spinner" /> Cargando reincidencias VPN…</div>
  if (!data)
    return <p className="inc__empty">No data</p>

  const { summary, peers } = data

  return (
    <div className="inc__panel">
      <div className="inc__hist-controls">
        <Text as="h3" className="inc__panel-title" style={{ margin: 0 }}>
          VPN — Reincidencias auto-recuperadas
          <span className="inc__badge inc__badge--count" style={{ marginLeft: '0.5rem' }}>{summary.totalEpisodes}</span>
        </Text>
        <div className="inc__hist-period">
          {RECUR_PERIOD_OPTIONS.map(opt => (
            <button key={opt.value}
              className={`inc__period-btn${recurDays === opt.value ? ' inc__period-btn--active' : ''}`}
              onClick={() => onRecurDaysChange(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="inc__hist-summary">
        <span className="inc__hist-kpi">Peers afectados <strong>{summary.totalPeers}</strong></span>
        <span className="inc__hist-kpi inc__hist-kpi--open">Episodios <strong>{summary.totalEpisodes}</strong></span>
        {summary.mostUnstable !== '—' && (
          <span className="inc__hist-kpi" style={{ color: COLOR_WARNING }}>
            Más inestable: <strong style={{ color: COLOR_WARNING }}>{summary.mostUnstable}</strong>
          </span>
        )}
        <span style={{ marginLeft: 'auto', fontSize: '0.68rem', color: COLOR_MUTED }}>
          ▸ clic para ver episodios
        </span>
      </div>

      {peers.length === 0
        ? <p className="inc__empty">Sin reincidencias VPN en este período.</p>
        : (
          <div className="inc__table-wrap">
            <table className="inc__table">
              <thead>
                <tr>
                  <th style={{ width: 28 }}></th>
                  <th>Peer</th>
                  <th>Tipo</th>
                  <th>IP pública</th>
                  <th>Episodios</th>
                  <th>Downtime total</th>
                  <th>Downtime promedio</th>
                  <th>Riesgo</th>
                </tr>
              </thead>
              <tbody>
                {peers.map((peer, pi) => {
                  const riskColor = peer.count >= 5 ? COLOR_ERROR : peer.count >= 3 ? COLOR_WARNING : COLOR_MUTED
                  const isOpen    = expandedPeer[peer.peerKey]
                  return (
                    <>
                      <tr key={peer.peerKey}
                        onClick={() => toggle(peer.peerKey)}
                        style={{ cursor: 'pointer', borderLeft: `3px solid ${riskColor}` }}
                        className="inc__recurrence-row"
                      >
                        <td style={{ color: COLOR_MUTED, fontSize: '0.7rem' }}>{isOpen ? '▾' : '▸'}</td>
                        <td style={{ color: COLOR_ACCENT, fontFamily: 'monospace', fontSize: '0.8rem' }}>
                          {peer.peerName}
                        </td>
                        <td>
                          <span className="inc__badge" style={{
                            background: peer.peerType === 'meraki' ? 'rgba(0,212,255,0.12)' : 'rgba(59,130,246,0.12)',
                            color:      peer.peerType === 'meraki' ? COLOR_ACCENT : COLOR_SECONDARY,
                            border:     `1px solid ${peer.peerType === 'meraki' ? COLOR_ACCENT : COLOR_SECONDARY}44`,
                          }}>
                            {peer.peerType}
                          </span>
                        </td>
                        <td className="inc__td-mono">{peer.peerPublicIp || '—'}</td>
                        <td>
                          <span className="inc__badge" style={{
                            background: riskColor + '22', color: riskColor, border: `1px solid ${riskColor}55`
                          }}>
                            {peer.count} {peer.count === 1 ? 'caída' : 'caídas'}
                          </span>
                        </td>
                        <td className="inc__td-mono">{peer.totalDowntimeHuman}</td>
                        <td className="inc__td-mono">{peer.avgDowntimeHuman}</td>
                        <td style={{ fontSize: '0.68rem', color: riskColor, fontWeight: 600 }}>
                          {peer.count >= 5 ? '🔴 Alto' : peer.count >= 3 ? '🟡 Medio' : '⚪ Bajo'}
                        </td>
                      </tr>

                      {isOpen && (
                        <tr className="inc__recurrence-episodes-row" key={`ep-${peer.peerKey}`}>
                          <td colSpan={8} style={{ padding: 0 }}>
                            <div className="inc__recurrence-episodes">
                              <table className="inc__table inc__table--inner">
                                <thead>
                                  <tr>
                                    <th>Red origen</th>
                                    <th>Caída</th>
                                    <th>Recuperación</th>
                                    <th>Duración</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {peer.episodes.map((ep, ei) => (
                                    <tr key={ei}>
                                      <td className="inc__td-mono">{ep.networkName || ep.networkId}</td>
                                      <td className="inc__td-mono">{fmtDate(ep.detectedAt)}</td>
                                      <td className="inc__td-mono">{ep.resolvedAt ? fmtDate(ep.resolvedAt) : '—'}</td>
                                      <td>
                                        <span className="inc__badge" style={{
                                          background: ep.downtimeMinutes > 60 ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                                          color:      ep.downtimeMinutes > 60 ? COLOR_ERROR : COLOR_WARNING,
                                          border:     `1px solid ${ep.downtimeMinutes > 60 ? COLOR_ERROR : COLOR_WARNING}44`
                                        }}>
                                          {ep.downtimeHuman}
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
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function VpnDashboard() {
  const [orgs, setOrgs]           = useState([])
  const [selectedOrg, setSelectedOrg] = useState('')
  const [activeTab, setActiveTab] = useState('status')  // status | incidents | recurrence
  const [statusData, setStatusData]     = useState(null)
  const [incidents, setIncidents]       = useState([])
  const [recurData, setRecurData]       = useState(null)
  const [recurDays, setRecurDays]       = useState(30)
  const [loadingStatus,    setLoadingStatus]    = useState(false)
  const [loadingIncidents, setLoadingIncidents] = useState(false)
  const [loadingRecur,     setLoadingRecur]     = useState(false)

  // Cargar orgs
  useEffect(() => {
    getVpnOrgs().then(list => {
      if (!list?.length) return
      setOrgs(list)
      const last  = localStorage.getItem(LS_VPN_ORG)
      const found = list.find(o => o.id === last)
      setSelectedOrg(found ? found.id : list[0].id)
    })
  }, [])

  useEffect(() => {
    if (selectedOrg) localStorage.setItem(LS_VPN_ORG, selectedOrg)
  }, [selectedOrg])

  // Cargar status al montar o cambiar org
  useEffect(() => {
    if (!selectedOrg) return
    setLoadingStatus(true)
    getVpnStatus(selectedOrg)
      .then(d => setStatusData(d))
      .finally(() => setLoadingStatus(false))
  }, [selectedOrg])

  // Cargar incidentes abiertos
  useEffect(() => {
    if (activeTab !== 'incidents' || !selectedOrg) return
    setLoadingIncidents(true)
    getVpnOpenIncidents(selectedOrg)
      .then(list => setIncidents(list || []))
      .finally(() => setLoadingIncidents(false))
  }, [activeTab, selectedOrg])

  // Cargar reincidencias
  useEffect(() => {
    if (activeTab !== 'recurrence' || !selectedOrg) return
    setLoadingRecur(true)
    getVpnRecurrence(selectedOrg, recurDays)
      .then(d => setRecurData(d || null))
      .finally(() => setLoadingRecur(false))
  }, [activeTab, selectedOrg, recurDays])

  // Guardar incidente VPN
  const handleSaveIncident = useCallback(async (id, updates) => {
    const updated = await updateVpnIncidentStatus(id, updates)
    if (!updated) return
    if (updates.workStatus === 'resolved') {
      setIncidents(prev => prev.filter(i => i._id !== id))
    } else {
      setIncidents(prev => prev.map(i =>
        i._id === id ? { ...i, ...updates } : i
      ))
    }
  }, [])

  const orgName = orgs.find(o => o.id === selectedOrg)?.name || ''
  const downCount = statusData?.summary?.downPeers || 0

  return (
    <div className="inc__dashboard">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="inc__header">
        <div className="inc__header-left">
          <Text as="h2" className="inc__title">VPN Status</Text>
          <Text as="p" className="inc__subtitle">
            Estado de tunnels VPN — peers Meraki y third-party · detección automática de caídas
          </Text>
        </div>
        <div className="inc__controls">
          {orgs.length > 0 && (
            <div className="inc__org-selector">
              <label className="inc__period-label">Organization:</label>
              <select className="inc__org-select" value={selectedOrg}
                onChange={e => setSelectedOrg(e.target.value)}>
                {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
          )}
          {downCount > 0 && (
            <span style={{
              background: 'rgba(239,68,68,0.15)', color: COLOR_ERROR,
              border: `1px solid ${COLOR_ERROR}44`,
              borderRadius: 6, padding: '0.3rem 0.8rem',
              fontSize: '0.78rem', fontWeight: 700, fontFamily: 'monospace',
            }}>
              ⚠ {downCount} peer{downCount > 1 ? 's' : ''} down
            </span>
          )}
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div className="inc__tabs">
        <button
          className={`inc__tab${activeTab === 'status' ? ' inc__tab--active' : ''}`}
          onClick={() => setActiveTab('status')}
        >
          Estado actual
          {downCount > 0 && (
            <span className="inc__badge" style={{
              marginLeft: '0.4rem', background: 'rgba(239,68,68,0.2)',
              color: COLOR_ERROR, border: `1px solid ${COLOR_ERROR}44`
            }}>
              {downCount} ↓
            </span>
          )}
        </button>
        <button
          className={`inc__tab${activeTab === 'incidents' ? ' inc__tab--active' : ''}`}
          onClick={() => setActiveTab('incidents')}
        >
          Incidentes abiertos
        </button>
        <button
          className={`inc__tab${activeTab === 'recurrence' ? ' inc__tab--active' : ''}`}
          onClick={() => setActiveTab('recurrence')}
        >
          Reincidencias
        </button>
      </div>

      {activeTab === 'status' && (
        <VpnStatusPanel data={statusData} loading={loadingStatus} />
      )}
      {activeTab === 'incidents' && (
        <VpnIncidentsPanel
          incidents={incidents}
          loading={loadingIncidents}
          onSave={handleSaveIncident}
        />
      )}
      {activeTab === 'recurrence' && (
        <VpnRecurrencePanel
          data={recurData}
          loading={loadingRecur}
          recurDays={recurDays}
          onRecurDaysChange={d => setRecurDays(d)}
        />
      )}

      <div className="inc__footer-note">
        VPN data · {orgName} · Snapshot cada 10 min
      </div>
    </div>
  )
}

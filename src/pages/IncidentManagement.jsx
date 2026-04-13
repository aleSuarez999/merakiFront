import { useEffect, useState, useCallback } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend
} from 'recharts'
import {
  getIncidentReport,
  getIncidentOrgs,
  updateIncidentWorkStatus,
  getResolvedIncidentsReport,
  getIncidentHistory,
  getRecurrenceReport
} from '../utils/api'
import Text from '../components/Text'

// ── Paleta del proyecto ───────────────────────────────────────────────────────
const COLOR_ACCENT    = '#00d4ff'
const COLOR_SECONDARY = '#3b82f6'
const COLOR_SUCCESS   = '#10b981'
const COLOR_WARNING   = '#f59e0b'
const COLOR_ERROR     = '#ef4444'
const COLOR_MUTED     = '#64748b'

const SEVERITY_COLORS = {
  critical: COLOR_ERROR,
  high:     '#f97316',
  medium:   COLOR_WARNING,
  low:      COLOR_SUCCESS,
}

const WORK_STATUS_CFG = {
  active:      { label: 'Active',      color: COLOR_ERROR,   bg: 'rgba(239,68,68,0.10)'  },
  in_progress: { label: 'In Progress', color: COLOR_WARNING, bg: 'rgba(245,158,11,0.12)' },
  resolved:    { label: 'Resolved',    color: COLOR_SUCCESS, bg: 'rgba(16,185,129,0.10)' },
}

const TYPE_COLORS        = [COLOR_ACCENT, COLOR_SECONDARY, COLOR_SUCCESS, COLOR_WARNING, COLOR_ERROR, '#8b5cf6', '#ec4899']
const PERIOD_OPTIONS     = [7, 14, 30, 60, 90]
const HISTORY_PERIOD_OPTIONS = [
  { value: 7,  label: '1 semana'  },
  { value: 14, label: '2 semanas' },
  { value: 30, label: '1 mes'     },
]
const LS_ORG_KEY = 'inc_mgmnt_last_org'

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtDate = d => new Date(d).toLocaleString('en-GB', {
  day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit'
})

function formatDuration(minutes) {
  if (!minutes || minutes <= 0) return '0m'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ label, value, unit = '', accent = false, sub = '' }) {
  return (
    <div className={`inc__kpi-card${accent ? ' inc__kpi-card--accent' : ''}`}>
      <span className="inc__kpi-label">{label}</span>
      <span className="inc__kpi-value">
        {value}<span className="inc__kpi-unit">{unit}</span>
      </span>
      {sub && <span className="inc__kpi-sub">{sub}</span>}
    </div>
  )
}

// ── Availability badge ────────────────────────────────────────────────────────
function AvailabilityBadge({ value }) {
  const color = value >= 99.9 ? COLOR_SUCCESS : value >= 99 ? COLOR_WARNING : COLOR_ERROR
  return (
    <div className="inc__avail-badge" style={{ borderColor: color }}>
      <span className="inc__avail-value" style={{ color }}>{value}%</span>
      <span className="inc__avail-label">Service Availability</span>
      <span className="inc__avail-sub" style={{ color }}>
        {value >= 99.9 ? '✔ Target met' : value >= 99 ? '⚠ Near threshold' : '✖ Below SLA'}
      </span>
    </div>
  )
}

// ── Custom Tooltip recharts ───────────────────────────────────────────────────
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

// ── Fila editable — Open Incidents tab ───────────────────────────────────────
function OpenIncidentRow({ inc, onSave }) {
  const [ws, setWs]       = useState(inc.workStatus || 'active')
  const [claim, setClaim] = useState(inc.claimNumber || '')
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty]   = useState(false)

  const handleWsChange    = v => { setWs(v);    setDirty(true) }
  const handleClaimChange = v => { setClaim(v); setDirty(true) }

  const handleSave = async () => {
    setSaving(true)
    await onSave(inc._id, { workStatus: ws, claimNumber: claim })
    setSaving(false)
    setDirty(false)
  }

  const cfg      = WORK_STATUS_CFG[ws] || WORK_STATUS_CFG.active
  const rowStyle = ws === 'in_progress'
    ? { background: 'rgba(245,158,11,0.07)', borderLeft: `3px solid ${COLOR_WARNING}` }
    : {}

  return (
    <tr style={rowStyle}>
      <td><span className="inc__badge inc__badge--type">{inc.incidentType}</span></td>
      <td>
        <span className="inc__badge" style={{
          background: (SEVERITY_COLORS[inc.severity] || COLOR_MUTED) + '22',
          color: SEVERITY_COLORS[inc.severity] || COLOR_MUTED,
          border: `1px solid ${SEVERITY_COLORS[inc.severity] || COLOR_MUTED}44`
        }}>
          {inc.severity}
        </span>
      </td>
      <td className="inc__td-mono">{inc.networkName || inc.networkId || '—'}</td>
      <td className="inc__td-mono">{inc.deviceSerial || '—'}</td>
      <td className="inc__td-mono">{fmtDate(inc.detectedAt)}</td>
      <td>
        <select
          className="inc__ws-select"
          value={ws}
          onChange={e => handleWsChange(e.target.value)}
          style={{ color: cfg.color, borderColor: cfg.color + '88', background: cfg.bg }}
        >
          <option value="active">Active</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>
      </td>
      <td>
        <input
          className="inc__claim-input"
          type="text"
          placeholder="Nro reclamo"
          value={claim}
          onChange={e => handleClaimChange(e.target.value)}
        />
      </td>
      <td>
        <button
          className={`inc__save-btn${dirty ? ' inc__save-btn--dirty' : ''}`}
          onClick={handleSave}
          disabled={!dirty || saving}
          title="Guardar cambios"
        >
          {saving ? '…' : '✔'}
        </button>
      </td>
    </tr>
  )
}

// ── Tabla Open Incidents ──────────────────────────────────────────────────────
function OpenIncidentsTable({ rows, onSave }) {
  if (!rows || rows.length === 0)
    return <p className="inc__empty">No open incidents for this organization</p>
  return (
    <div className="inc__table-wrap">
      <table className="inc__table">
        <thead>
          <tr>
            <th>Type</th><th>Severity</th><th>Network</th><th>Device</th>
            <th>Detected</th><th>Status</th><th>Claim #</th><th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => <OpenIncidentRow key={r._id} inc={r} onSave={onSave} />)}
        </tbody>
      </table>
    </div>
  )
}

// ── Fila editable — History tab ───────────────────────────────────────────────
function HistoryIncidentRow({ inc, onSave }) {
  const [claim, setClaim]   = useState(inc.claimNumber || '')
  const [notes, setNotes]   = useState(inc.resolutionNotes || '')
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty]   = useState(false)
  const [expanded, setExpanded] = useState(false)   // despliega inputs inline

  const handleSave = async () => {
    setSaving(true)
    await onSave(inc._id, { claimNumber: claim, resolutionNotes: notes })
    setSaving(false)
    setDirty(false)
    setExpanded(false)
  }

  const wsCfg    = WORK_STATUS_CFG[inc.workStatus] || WORK_STATUS_CFG.active
  const isOpen   = inc.status === 'open'
  const resolvedTs = inc.manualResolvedAt || inc.resolvedAt
  const rowStyle = isOpen
    ? { borderLeft: `3px solid ${wsCfg.color}` }
    : { opacity: 0.82 }

  return (
    <>
      <tr style={rowStyle}>
        {/* Estado */}
        <td>
          <span className="inc__badge" style={{
            background: wsCfg.bg,
            color: wsCfg.color,
            border: `1px solid ${wsCfg.color}55`
          }}>
            {isOpen ? wsCfg.label : 'Resolved'}
          </span>
        </td>

        {/* Tipo */}
        <td><span className="inc__badge inc__badge--type">{inc.incidentType}</span></td>

        {/* Severidad */}
        <td>
          <span className="inc__badge" style={{
            background: (SEVERITY_COLORS[inc.severity] || COLOR_MUTED) + '22',
            color: SEVERITY_COLORS[inc.severity] || COLOR_MUTED,
            border: `1px solid ${SEVERITY_COLORS[inc.severity] || COLOR_MUTED}44`
          }}>
            {inc.severity}
          </span>
        </td>

        {/* Red */}
        <td className="inc__td-mono">{inc.networkName || inc.networkId || '—'}</td>

        {/* Device */}
        <td className="inc__td-mono">{inc.deviceSerial || '—'}</td>

        {/* Detectado */}
        <td className="inc__td-mono">{fmtDate(inc.detectedAt)}</td>

        {/* Resuelto */}
        <td className="inc__td-mono">
          {resolvedTs
            ? fmtDate(resolvedTs)
            : <span style={{ color: COLOR_ERROR, fontSize: '0.7rem' }}>Still open</span>
          }
        </td>

        {/* Downtime */}
        <td>
          {inc.downtimeHuman
            ? (
              <span className="inc__badge" style={{
                background: inc.downtimeMinutes > 60 ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                color:      inc.downtimeMinutes > 60 ? COLOR_ERROR : COLOR_WARNING,
                border:     `1px solid ${inc.downtimeMinutes > 60 ? COLOR_ERROR : COLOR_WARNING}44`
              }}>
                {inc.downtimeHuman}
              </span>
            )
            : <span style={{ color: COLOR_ERROR, fontSize: '0.7rem' }}>ongoing</span>
          }
        </td>

        {/* Claim # — inline, solo lectura hasta expandir */}
        <td className="inc__td-mono">
          {expanded
            ? (
              <input
                className="inc__claim-input"
                type="text"
                placeholder="Nro reclamo"
                value={claim}
                onChange={e => { setClaim(e.target.value); setDirty(true) }}
                autoFocus
              />
            )
            : (
              <span style={{ color: claim ? COLOR_ACCENT : COLOR_MUTED }}>
                {claim || '—'}
              </span>
            )
          }
        </td>

        {/* Motivo resolución — solo lectura hasta expandir */}
        <td className="inc__td-mono" style={{ maxWidth: 180 }}>
          {expanded
            ? (
              <input
                className="inc__claim-input inc__claim-input--wide"
                type="text"
                placeholder="Motivo resolución"
                value={notes}
                onChange={e => { setNotes(e.target.value); setDirty(true) }}
              />
            )
            : (
              <span
                style={{ color: notes ? COLOR_MUTED : 'rgba(100,116,139,0.45)',
                         fontSize: '0.7rem',
                         whiteSpace: 'nowrap', overflow: 'hidden',
                         display: 'block', maxWidth: 160, textOverflow: 'ellipsis' }}
                title={notes || ''}
              >
                {notes || '—'}
              </span>
            )
          }
        </td>

        {/* Acciones */}
        <td style={{ whiteSpace: 'nowrap' }}>
          {expanded
            ? (
              <>
                <button
                  className={`inc__save-btn${dirty ? ' inc__save-btn--dirty' : ''}`}
                  onClick={handleSave}
                  disabled={!dirty || saving}
                  title="Guardar"
                  style={{ marginRight: '0.3rem' }}
                >
                  {saving ? '…' : '✔'}
                </button>
                <button
                  className="inc__save-btn"
                  onClick={() => { setExpanded(false); setDirty(false); setClaim(inc.claimNumber || ''); setNotes(inc.resolutionNotes || '') }}
                  title="Cancelar"
                >
                  ✕
                </button>
              </>
            )
            : (
              <button
                className="inc__edit-btn"
                onClick={() => setExpanded(true)}
                title="Editar claim y motivo"
              >
                ✎
              </button>
            )
          }
        </td>
      </tr>
    </>
  )
}

// ── Tabla History ─────────────────────────────────────────────────────────────
function HistoryTable({ data, loading, histDays, onHistDaysChange, onSave }) {
  if (loading)
    return <div className="inc__loading"><span className="inc__spinner" /> Loading history…</div>
  if (!data)
    return <p className="inc__empty">No data</p>

  const { summary, incidents } = data

  return (
    <div className="inc__panel">
      <div className="inc__hist-controls">
        <Text as="h3" className="inc__panel-title" style={{ margin: 0 }}>
          Incidents History
          <span className="inc__badge inc__badge--count" style={{ marginLeft: '0.5rem' }}>{summary.total}</span>
        </Text>
        <div className="inc__hist-period">
          {HISTORY_PERIOD_OPTIONS.map(opt => (
            <button
              key={opt.value}
              className={`inc__period-btn${histDays === opt.value ? ' inc__period-btn--active' : ''}`}
              onClick={() => onHistDaysChange(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="inc__hist-summary">
        <span className="inc__hist-kpi">Total <strong>{summary.total}</strong></span>
        <span className="inc__hist-kpi inc__hist-kpi--open">Open <strong>{summary.open}</strong></span>
        <span className="inc__hist-kpi inc__hist-kpi--resolved">Resolved <strong>{summary.resolved}</strong></span>
        <span className="inc__hist-kpi" style={{ marginLeft: 'auto', fontSize: '0.68rem', color: COLOR_MUTED }}>
          ✎ clic para editar claim y motivo
        </span>
      </div>

      {incidents.length === 0
        ? <p className="inc__empty">No incidents in this period</p>
        : (
          <div className="inc__table-wrap">
            <table className="inc__table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Type</th>
                  <th>Severity</th>
                  <th>Network</th>
                  <th>Device</th>
                  <th>Detected</th>
                  <th>Resolved</th>
                  <th>Downtime</th>
                  <th>Claim #</th>
                  <th>Motivo resolución</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {incidents.map((r, i) => (
                  <HistoryIncidentRow key={r._id || i} inc={r} onSave={onSave} />
                ))}
              </tbody>
            </table>
          </div>
        )
      }
    </div>
  )
}

// ── Tabla Resolved Report ─────────────────────────────────────────────────────
function ResolvedReportTable({ data }) {
  if (!data) return null
  const { summary, incidents } = data

  return (
    <div className="inc__panel">
      <Text as="h3" className="inc__panel-title">
        Resolved Incidents Report
        <span className="inc__badge inc__badge--count">{summary.total}</span>
      </Text>
      <div className="inc__kpi-row" style={{ marginBottom: '1rem' }}>
        <KpiCard label="Total Resolved"  value={summary.total}              accent />
        <KpiCard label="Total Downtime"  value={summary.totalDowntimeHuman} />
        <KpiCard label="Avg Downtime"    value={summary.avgDowntimeHuman}   sub="per incident" />
        <KpiCard label="Max Downtime"    value={summary.maxDowntimeHuman}   sub="single incident" />
      </div>

      {incidents.length === 0
        ? <p className="inc__empty">No resolved incidents in this period</p>
        : (
          <div className="inc__table-wrap">
            <table className="inc__table">
              <thead>
                <tr>
                  <th>Type</th><th>Network</th><th>Device</th>
                  <th>Detected</th><th>Resolved (manual)</th>
                  <th>Downtime</th><th>Claim #</th>
                </tr>
              </thead>
              <tbody>
                {incidents.map((r, i) => (
                  <tr key={i}>
                    <td><span className="inc__badge inc__badge--type">{r.incidentType}</span></td>
                    <td className="inc__td-mono">{r.networkName || r.networkId || '—'}</td>
                    <td className="inc__td-mono">{r.deviceSerial || '—'}</td>
                    <td className="inc__td-mono">{fmtDate(r.detectedAt)}</td>
                    <td className="inc__td-mono">{r.manualResolvedAt ? fmtDate(r.manualResolvedAt) : '—'}</td>
                    <td>
                      <span className="inc__badge" style={{
                        background: r.downtimeMinutes > 60 ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                        color:      r.downtimeMinutes > 60 ? COLOR_ERROR : COLOR_WARNING,
                        border:     `1px solid ${r.downtimeMinutes > 60 ? COLOR_ERROR : COLOR_WARNING}44`
                      }}>
                        {r.downtimeHuman}
                      </span>
                    </td>
                    <td className="inc__td-mono">{r.claimNumber || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }
    </div>
  )
}


// ── Tabla Reincidencias ───────────────────────────────────────────────────────
const RECURRENCE_PERIOD_OPTIONS = [
  { value: 7,  label: '1 semana'  },
  { value: 14, label: '2 semanas' },
  { value: 30, label: '1 mes'     },
  { value: 60, label: '2 meses'   },
]

function RecurrenceEpisodes({ episodes }) {
  return (
    <tr className="inc__recurrence-episodes-row">
      <td colSpan={6} style={{ padding: 0 }}>
        <div className="inc__recurrence-episodes">
          <table className="inc__table inc__table--inner">
            <thead>
              <tr>
                <th>Device</th>
                <th>Uplink</th>
                <th>Caída</th>
                <th>Recuperación</th>
                <th>Duración</th>
              </tr>
            </thead>
            <tbody>
              {episodes.map((ep, i) => (
                <tr key={i}>
                  <td className="inc__td-mono">{ep.deviceSerial || '—'}</td>
                  <td className="inc__td-mono">{ep.uplinkInterface || '—'}</td>
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
  )
}

function RecurrenceNetworkRow({ net }) {
  const [open, setOpen] = useState(false)

  const riskColor = net.count >= 5 ? COLOR_ERROR
                  : net.count >= 3 ? COLOR_WARNING
                  : COLOR_MUTED

  return (
    <>
      <tr
        className="inc__recurrence-row"
        onClick={() => setOpen(v => !v)}
        style={{ cursor: 'pointer', borderLeft: `3px solid ${riskColor}` }}
      >
        {/* Expand toggle */}
        <td style={{ width: 28, color: COLOR_MUTED, fontSize: '0.7rem' }}>
          {open ? '▾' : '▸'}
        </td>

        {/* Red */}
        <td>
          <span style={{ color: COLOR_ACCENT, fontFamily: 'var(--font-mono, monospace)', fontSize: '0.8rem' }}>
            {net.networkName}
          </span>
        </td>

        {/* Episodios */}
        <td>
          <span className="inc__badge" style={{
            background: riskColor + '22',
            color:      riskColor,
            border:     `1px solid ${riskColor}55`,
            fontSize:   '0.78rem',
            padding:    '0.2rem 0.65rem',
          }}>
            {net.count} {net.count === 1 ? 'caída' : 'caídas'}
          </span>
        </td>

        {/* Downtime total */}
        <td className="inc__td-mono">{net.totalDowntimeHuman}</td>

        {/* Downtime promedio */}
        <td className="inc__td-mono">{net.avgDowntimeHuman}</td>

        {/* Riesgo */}
        <td>
          <span style={{ fontSize: '0.68rem', color: riskColor, fontWeight: 600 }}>
            {net.count >= 5 ? '🔴 Alto' : net.count >= 3 ? '🟡 Medio' : '⚪ Bajo'}
          </span>
        </td>
      </tr>

      {open && <RecurrenceEpisodes episodes={net.episodes} />}
    </>
  )
}

function RecurrenceTable({ data, loading, recurDays, onRecurDaysChange }) {
  if (loading)
    return <div className="inc__loading"><span className="inc__spinner" /> Cargando reincidencias…</div>
  if (!data)
    return <p className="inc__empty">No data</p>

  const { summary, networks } = data

  return (
    <div className="inc__panel">
      {/* Header con selector de período */}
      <div className="inc__hist-controls">
        <Text as="h3" className="inc__panel-title" style={{ margin: 0 }}>
          Reincidencias — auto-recuperadas sin intervención
          <span className="inc__badge inc__badge--count" style={{ marginLeft: '0.5rem' }}>
            {summary.totalEpisodes}
          </span>
        </Text>
        <div className="inc__hist-period">
          {RECURRENCE_PERIOD_OPTIONS.map(opt => (
            <button
              key={opt.value}
              className={`inc__period-btn${recurDays === opt.value ? ' inc__period-btn--active' : ''}`}
              onClick={() => onRecurDaysChange(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mini KPIs */}
      <div className="inc__hist-summary">
        <span className="inc__hist-kpi">
          Redes afectadas <strong>{summary.totalNetworks}</strong>
        </span>
        <span className="inc__hist-kpi inc__hist-kpi--open">
          Total episodios <strong>{summary.totalEpisodes}</strong>
        </span>
        {summary.mostUnstable && summary.mostUnstable !== '—' && (
          <span className="inc__hist-kpi" style={{ color: COLOR_WARNING }}>
            Más inestable: <strong style={{ color: COLOR_WARNING }}>{summary.mostUnstable}</strong>
          </span>
        )}
        <span className="inc__hist-kpi" style={{ marginLeft: 'auto', fontSize: '0.68rem', color: COLOR_MUTED }}>
          ▸ clic en la fila para ver episodios
        </span>
      </div>

      {networks.length === 0
        ? <p className="inc__empty">No se registraron reincidencias automáticas en este período</p>
        : (
          <div className="inc__table-wrap">
            <table className="inc__table">
              <thead>
                <tr>
                  <th style={{ width: 28 }}></th>
                  <th>Red</th>
                  <th>Episodios</th>
                  <th>Downtime total</th>
                  <th>Downtime promedio</th>
                  <th>Riesgo</th>
                </tr>
              </thead>
              <tbody>
                {networks.map((net, i) => (
                  <RecurrenceNetworkRow key={net.networkId || i} net={net} />
                ))}
              </tbody>
            </table>
          </div>
        )
      }
    </div>
  )
}

// ── Selector de organización ──────────────────────────────────────────────────
function OrgSelector({ orgs, value, onChange }) {
  return (
    <div className="inc__org-selector">
      <label className="inc__period-label">Organization:</label>
      <select
        className="inc__org-select"
        value={value}
        onChange={e => onChange(e.target.value)}
      >
        {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
      </select>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function IncidentManagement() {
  const [orgs, setOrgs]               = useState([])
  const [selectedOrg, setSelectedOrg] = useState('')
  const [data, setData]               = useState(null)
  const [resolvedData, setResolvedData]   = useState(null)
  const [histData, setHistData]           = useState(null)
  const [loading, setLoading]             = useState(false)
  const [loadingResolved, setLoadingResolved] = useState(false)
  const [loadingHist, setLoadingHist]     = useState(false)
  const [error, setError]                 = useState(null)
  const [days, setDays]                   = useState(30)
  const [histDays, setHistDays]           = useState(7)
  const [activeTab, setActiveTab]         = useState('open')  // 'open' | 'history' | 'recurrence' | 'resolved'
  const [recurDays, setRecurDays]         = useState(30)
  const [recurData, setRecurData]         = useState(null)
  const [loadingRecur, setLoadingRecur]   = useState(false)

  // ── Cargar orgs ────────────────────────────────────────────────────────────
  useEffect(() => {
    getIncidentOrgs().then(list => {
      if (!list || list.length === 0) return
      setOrgs(list)
      const last  = localStorage.getItem(LS_ORG_KEY)
      const found = list.find(o => o.id === last)
      setSelectedOrg(found ? found.id : list[0].id)
    })
  }, [])

  useEffect(() => {
    if (selectedOrg) localStorage.setItem(LS_ORG_KEY, selectedOrg)
  }, [selectedOrg])

  // ── Cargar reporte principal ───────────────────────────────────────────────
  useEffect(() => {
    if (!selectedOrg) return
    setLoading(true)
    setError(null)
    getIncidentReport(selectedOrg, days)
      .then(resp => { if (resp) setData(resp); else setError('Could not load incident data.') })
      .catch(() => setError('Connection error.'))
      .finally(() => setLoading(false))
  }, [selectedOrg, days])

  // ── Cargar resolved cuando se activa esa pestaña ──────────────────────────
  useEffect(() => {
    if (activeTab !== 'resolved' || !selectedOrg) return
    setLoadingResolved(true)
    getResolvedIncidentsReport(selectedOrg, days)
      .then(resp => setResolvedData(resp || null))
      .finally(() => setLoadingResolved(false))
  }, [activeTab, selectedOrg, days])

  // ── Cargar reincidencias cuando se activa esa pestaña o cambia período ─────
  useEffect(() => {
    if (activeTab !== 'recurrence' || !selectedOrg) return
    setLoadingRecur(true)
    getRecurrenceReport(selectedOrg, recurDays)
      .then(resp => setRecurData(resp || null))
      .finally(() => setLoadingRecur(false))
  }, [activeTab, selectedOrg, recurDays])

  // ── Cargar historial cuando se activa esa pestaña o cambia período ────────
  useEffect(() => {
    if (activeTab !== 'history' || !selectedOrg) return
    setLoadingHist(true)
    getIncidentHistory(selectedOrg, histDays)
      .then(resp => setHistData(resp || null))
      .finally(() => setLoadingHist(false))
  }, [activeTab, selectedOrg, histDays])

  // ── Guardar desde Open Incidents (workStatus + claim) ─────────────────────
  const handleSaveOpenIncident = useCallback(async (id, updates) => {
    const updated = await updateIncidentWorkStatus(id, updates)
    if (!updated) return
    if (updates.workStatus === 'resolved') {
      setData(prev => prev ? {
        ...prev,
        recentOpen: prev.recentOpen.filter(i => i._id !== id),
        kpis: { ...prev.kpis, openIncidents: Math.max(0, prev.kpis.openIncidents - 1) }
      } : prev)
    } else {
      setData(prev => prev ? {
        ...prev,
        recentOpen: prev.recentOpen.map(i =>
          i._id === id
            ? { ...i,
                workStatus:  updates.workStatus  ?? i.workStatus,
                claimNumber: updates.claimNumber ?? i.claimNumber }
            : i
        )
      } : prev)
    }
  }, [])

  // ── Guardar desde History (claim + resolutionNotes) ───────────────────────
  const handleSaveHistoryIncident = useCallback(async (id, updates) => {
    const updated = await updateIncidentWorkStatus(id, updates)
    if (!updated) return
    // Actualizar el dato en histData sin recargar
    setHistData(prev => {
      if (!prev) return prev
      return {
        ...prev,
        incidents: prev.incidents.map(i =>
          i._id === id
            ? { ...i,
                claimNumber:     updates.claimNumber     ?? i.claimNumber,
                resolutionNotes: updates.resolutionNotes ?? i.resolutionNotes }
            : i
        )
      }
    })
  }, [])

  const orgName = orgs.find(o => o.id === selectedOrg)?.name || ''

  return (
    <div className="inc__dashboard">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="inc__header">
        <div className="inc__header-left">
          <Text as="h2" className="inc__title">Incident Management</Text>
          <Text as="p" className="inc__subtitle">
            Service Availability &amp; Incident reporting — infrastructure, network and managed device level
          </Text>
        </div>
        <div className="inc__controls">
          {orgs.length > 0 && (
            <OrgSelector orgs={orgs} value={selectedOrg} onChange={setSelectedOrg} />
          )}
          <div className="inc__period-selector">
            <span className="inc__period-label">Period:</span>
            {PERIOD_OPTIONS.map(d => (
              <button
                key={d}
                className={`inc__period-btn${days === d ? ' inc__period-btn--active' : ''}`}
                onClick={() => setDays(d)}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Loading / Error ───────────────────────────────────────────────── */}
      {loading && (
        <div className="inc__loading">
          <span className="inc__spinner" />
          Loading incident data for <strong style={{ color: COLOR_ACCENT, marginLeft: '0.3rem' }}>{orgName}</strong>…
        </div>
      )}
      {error && <div className="inc__error">{error}</div>}

      {/* ── Dashboard ────────────────────────────────────────────────────── */}
      {!loading && data && (
        <>
          {/* KPIs */}
          <div className="inc__kpi-row">
            <KpiCard label="Total Incidents" value={data.kpis.totalIncidents} accent />
            <KpiCard label="Open"            value={data.kpis.openIncidents} />
            <KpiCard label="Resolved"        value={data.kpis.resolvedIncidents} />
            <KpiCard label="Avg MTTR"        value={data.kpis.avgMTTR} unit=" min" sub="Mean Time To Restore" />
            <AvailabilityBadge value={data.kpis.availability} />
          </div>

          {/* Charts row 1 */}
          <div className="inc__charts-row">
            <div className="inc__chart-panel inc__chart-panel--wide">
              <Text as="h3" className="inc__panel-title">Incident Timeline — last {days} days</Text>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={data.timeline} margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fill: COLOR_MUTED, fontSize: 10 }} tickFormatter={v => v.slice(5)} />
                  <YAxis tick={{ fill: COLOR_MUTED, fontSize: 10 }} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '0.75rem', color: COLOR_MUTED }} />
                  <Line type="monotone" dataKey="total"    stroke={COLOR_ACCENT}  strokeWidth={2}   dot={false} name="Total" />
                  <Line type="monotone" dataKey="resolved" stroke={COLOR_SUCCESS} strokeWidth={1.5} dot={false} name="Resolved" />
                  <Line type="monotone" dataKey="open"     stroke={COLOR_ERROR}   strokeWidth={1.5} dot={false} name="Open" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="inc__chart-panel">
              <Text as="h3" className="inc__panel-title">By Type</Text>
              {data.byType.length === 0 ? <p className="inc__empty">No data</p> : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={data.byType} dataKey="value" nameKey="name"
                      cx="50%" cy="50%" outerRadius={80}
                      label={({ name, percent }) => `${name.replace('_', ' ')} ${(percent * 100).toFixed(0)}%`}
                      labelLine={{ stroke: COLOR_MUTED }}
                    >
                      {data.byType.map((_, i) => <Cell key={i} fill={TYPE_COLORS[i % TYPE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Charts row 2 */}
          <div className="inc__charts-row">
            <div className="inc__chart-panel">
              <Text as="h3" className="inc__panel-title">By Severity</Text>
              {data.bySeverity.length === 0 ? <p className="inc__empty">No data</p> : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={data.bySeverity} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" tick={{ fill: COLOR_MUTED, fontSize: 11 }} />
                    <YAxis tick={{ fill: COLOR_MUTED, fontSize: 11 }} allowDecimals={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="value" name="Incidents" radius={[4, 4, 0, 0]}>
                      {data.bySeverity.map((entry, i) => (
                        <Cell key={i} fill={SEVERITY_COLORS[entry.name] || COLOR_MUTED} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="inc__chart-panel inc__chart-panel--wide">
              <Text as="h3" className="inc__panel-title">Top Affected Networks</Text>
              {data.topNetworks.length === 0 ? <p className="inc__empty">No data</p> : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={data.topNetworks} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis type="number" tick={{ fill: COLOR_MUTED, fontSize: 10 }} allowDecimals={false} />
                    <YAxis type="category" dataKey="networkName" width={160}
                      tick={{ fill: COLOR_MUTED, fontSize: 10 }}
                      tickFormatter={v => v.length > 22 ? v.slice(0, 22) + '…' : v}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="count" name="Incidents" fill={COLOR_SECONDARY} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* ── Tabs ──────────────────────────────────────────────────────── */}
          <div className="inc__tabs">
            <button
              className={`inc__tab${activeTab === 'open' ? ' inc__tab--active' : ''}`}
              onClick={() => setActiveTab('open')}
            >
              Open Incidents
              <span className="inc__badge inc__badge--count" style={{ marginLeft: '0.5rem' }}>
                {data.kpis.openIncidents}
              </span>
            </button>
            <button
              className={`inc__tab${activeTab === 'history' ? ' inc__tab--active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              History
            </button>
            <button
              className={`inc__tab${activeTab === 'recurrence' ? ' inc__tab--active' : ''}`}
              onClick={() => setActiveTab('recurrence')}
            >
              Reincidencias
            </button>
            <button
              className={`inc__tab${activeTab === 'resolved' ? ' inc__tab--active' : ''}`}
              onClick={() => setActiveTab('resolved')}
            >
              Resolved Report
            </button>
          </div>

          {/* ── Panel Open ───────────────────────────────────────────────── */}
          {activeTab === 'open' && (
            <div className="inc__panel">
              <Text as="h3" className="inc__panel-title">Open Incidents — {orgName}</Text>
              <p className="inc__table-hint">
                Ordená por estado: <strong style={{ color: COLOR_ERROR }}>Active</strong> primero, luego{' '}
                <strong style={{ color: COLOR_WARNING }}>In Progress</strong>. Al marcar como{' '}
                <strong style={{ color: COLOR_SUCCESS }}>Resolved</strong> el incidente se guarda con timestamp
                y pasa al reporte histórico.
              </p>
              <OpenIncidentsTable rows={data.recentOpen} onSave={handleSaveOpenIncident} />
            </div>
          )}

          {/* ── Panel History ─────────────────────────────────────────────── */}
          {activeTab === 'history' && (
            <HistoryTable
              data={histData}
              loading={loadingHist}
              histDays={histDays}
              onHistDaysChange={d => setHistDays(d)}
              onSave={handleSaveHistoryIncident}
            />
          )}

          {/* ── Panel Reincidencias ───────────────────────────────────────── */}
          {activeTab === 'recurrence' && (
            <RecurrenceTable
              data={recurData}
              loading={loadingRecur}
              recurDays={recurDays}
              onRecurDaysChange={d => setRecurDays(d)}
            />
          )}

          {/* ── Panel Resolved ────────────────────────────────────────────── */}
          {activeTab === 'resolved' && (
            loadingResolved
              ? <div className="inc__loading"><span className="inc__spinner" /> Loading resolved report…</div>
              : <ResolvedReportTable data={resolvedData} />
          )}

          {/* Footer */}
          <div className="inc__footer-note">
            Data from MongoDB · {orgName} · Period: last {days} days · Since {new Date(data.period.since).toLocaleDateString('en-GB')}
          </div>
        </>
      )}
    </div>
  )
}
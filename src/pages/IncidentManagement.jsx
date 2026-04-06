import { useEffect, useState } from 'react'
import { getIncidentReport } from '../utils/api'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend
} from 'recharts'

import Text from '../components/Text'

// ── Colores alineados con la paleta del proyecto ──────────────────────────────
const COLOR_ACCENT   = '#00d4ff'
const COLOR_SECONDARY= '#3b82f6'
const COLOR_SUCCESS  = '#10b981'
const COLOR_WARNING  = '#f59e0b'
const COLOR_ERROR    = '#ef4444'
const COLOR_MUTED    = '#64748b'

const SEVERITY_COLORS = {
  critical : COLOR_ERROR,
  high     : '#f97316',
  medium   : COLOR_WARNING,
  low      : COLOR_SUCCESS,
}

const TYPE_COLORS = [
  COLOR_ACCENT, COLOR_SECONDARY, COLOR_SUCCESS,
  COLOR_WARNING, COLOR_ERROR, '#8b5cf6', '#ec4899'
]

const PERIOD_OPTIONS = [7, 14, 30, 60, 90]

// ── KPI Card ─────────────────────────────────────────────────────────────────
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

// ── Availability gauge visual simple ─────────────────────────────────────────
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

// ── Tabla incidentes abiertos ─────────────────────────────────────────────────
function RecentOpenTable({ rows }) {
  if (!rows || rows.length === 0)
    return <p className="inc__empty">No open incidents</p>

  return (
    <div className="inc__table-wrap">
      <table className="inc__table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Severity</th>
            <th>Network</th>
            <th>Device</th>
            <th>Detected</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td><span className="inc__badge inc__badge--type">{r.incidentType}</span></td>
              <td>
                <span
                  className="inc__badge"
                  style={{ background: (SEVERITY_COLORS[r.severity] || COLOR_MUTED) + '22',
                           color: SEVERITY_COLORS[r.severity] || COLOR_MUTED,
                           border: `1px solid ${SEVERITY_COLORS[r.severity] || COLOR_MUTED}44` }}
                >
                  {r.severity}
                </span>
              </td>
              <td className="inc__td-mono">{r.networkId || '—'}</td>
              <td className="inc__td-mono">{r.deviceSerial || '—'}</td>
              <td className="inc__td-mono">
                {new Date(r.detectedAt).toLocaleString('en-GB', {
                  day: '2-digit', month: '2-digit', year: '2-digit',
                  hour: '2-digit', minute: '2-digit'
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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

// ── Página principal ──────────────────────────────────────────────────────────
export default function IncidentManagement() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [days, setDays]       = useState(30)

  useEffect(() => {
    setLoading(true)
    setError(null)
    getIncidentReport(days)
      .then(resp => {
        if (resp) setData(resp)
        else setError('Could not load incident data.')
      })
      .catch(() => setError('Connection error.'))
      .finally(() => setLoading(false))
  }, [days])

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

      {/* ── Loading / Error ──────────────────────────────────────────────────── */}
      {loading && (
        <div className="inc__loading">
          <span className="inc__spinner" />
          Loading incident data…
        </div>
      )}
      {error && <div className="inc__error">{error}</div>}

      {/* ── Dashboard ────────────────────────────────────────────────────────── */}
      {!loading && data && (
        <>
          {/* KPIs row */}
          <div className="inc__kpi-row">
            <KpiCard
              label="Total Incidents"
              value={data.kpis.totalIncidents}
              accent
            />
            <KpiCard
              label="Open"
              value={data.kpis.openIncidents}
              unit=""
            />
            <KpiCard
              label="Resolved"
              value={data.kpis.resolvedIncidents}
            />
            <KpiCard
              label="Avg MTTR"
              value={data.kpis.avgMTTR}
              unit=" min"
              sub="Mean Time To Restore"
            />
            <AvailabilityBadge value={data.kpis.availability} />
          </div>

          {/* Charts row 1: Timeline + By Type */}
          <div className="inc__charts-row">

            {/* Timeline */}
            <div className="inc__chart-panel inc__chart-panel--wide">
              <Text as="h3" className="inc__panel-title">Incident Timeline (last {days} days)</Text>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={data.timeline} margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: COLOR_MUTED, fontSize: 10 }}
                    tickFormatter={v => v.slice(5)} // MM-DD
                  />
                  <YAxis tick={{ fill: COLOR_MUTED, fontSize: 10 }} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '0.75rem', color: COLOR_MUTED }} />
                  <Line type="monotone" dataKey="total"    stroke={COLOR_ACCENT}    strokeWidth={2} dot={false} name="Total" />
                  <Line type="monotone" dataKey="resolved" stroke={COLOR_SUCCESS}   strokeWidth={1.5} dot={false} name="Resolved" />
                  <Line type="monotone" dataKey="open"     stroke={COLOR_ERROR}     strokeWidth={1.5} dot={false} name="Open" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* By Type pie */}
            <div className="inc__chart-panel">
              <Text as="h3" className="inc__panel-title">By Type</Text>
              {data.byType.length === 0
                ? <p className="inc__empty">No data</p>
                : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={data.byType}
                        dataKey="value"
                        nameKey="name"
                        cx="50%" cy="50%"
                        outerRadius={80}
                        label={({ name, percent }) =>
                          `${name.replace('_', ' ')} ${(percent * 100).toFixed(0)}%`
                        }
                        labelLine={{ stroke: COLOR_MUTED }}
                      >
                        {data.byType.map((_, i) => (
                          <Cell key={i} fill={TYPE_COLORS[i % TYPE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                )
              }
            </div>
          </div>

          {/* Charts row 2: By Severity + Top Networks */}
          <div className="inc__charts-row">

            {/* By Severity bar */}
            <div className="inc__chart-panel">
              <Text as="h3" className="inc__panel-title">By Severity</Text>
              {data.bySeverity.length === 0
                ? <p className="inc__empty">No data</p>
                : (
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
                )
              }
            </div>

            {/* Top Networks bar */}
            <div className="inc__chart-panel inc__chart-panel--wide">
              <Text as="h3" className="inc__panel-title">Top Affected Networks</Text>
              {data.topNetworks.length === 0
                ? <p className="inc__empty">No data</p>
                : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart
                      data={data.topNetworks}
                      layout="vertical"
                      margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis type="number" tick={{ fill: COLOR_MUTED, fontSize: 10 }} allowDecimals={false} />
                      <YAxis
                        type="category"
                        dataKey="networkId"
                        width={140}
                        tick={{ fill: COLOR_MUTED, fontSize: 10 }}
                        tickFormatter={v => v.length > 18 ? v.slice(0, 18) + '…' : v}
                      />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="count" name="Incidents" fill={COLOR_SECONDARY} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )
              }
            </div>
          </div>

          {/* Open incidents table */}
          <div className="inc__panel">
            <Text as="h3" className="inc__panel-title">
              Open Incidents
              <span className="inc__badge inc__badge--count">{data.kpis.openIncidents}</span>
            </Text>
            <RecentOpenTable rows={data.recentOpen} />
          </div>

          {/* Footer info */}
          <div className="inc__footer-note">
            Data from MongoDB · Period: last {days} days · Since{' '}
            {new Date(data.period.since).toLocaleDateString('en-GB')}
          </div>
        </>
      )}
    </div>
  )
}

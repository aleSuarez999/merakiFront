import { useEffect, useMemo, useState } from 'react'
import { Cell, Pie, PieChart, Tooltip } from 'recharts'
import Box from './Box'
import axiosInstance from '../utils/api'

const ICONS         = { MX: '🛡️', MS: '🔀', MR: '📡', MG: '📶' }
const COLOR_UP        = '#24c024ff'
const COLOR_DOWN      = '#b9473fff'
const COLOR_SUSPENDED = '#9ca3af'

const isUpStatus = (status) => {
  if (!status) return false
  const s = String(status).toLowerCase()
  return s === 'online' || s === 'alerting'
}

const getTypeFromModel = (model) => {
  const m = (model || '').toUpperCase().trim()
  if (m.startsWith('MX')) return 'MX'
  if (m.startsWith('MS')) return 'MS'
  if (m.startsWith('MR')) return 'MR'
  if (m.startsWith('MG')) return 'MG'
  return null
}

const FILL = { UP: COLOR_UP, DOWN: COLOR_DOWN, SUSPENDED: COLOR_SUSPENDED }

function DeviceTypeMiniChart({ label, up, down, suspended, onClick }) {
  const chartData = [
    up        > 0 ? { name: 'UP',        value: up        } : null,
    down      > 0 ? { name: 'DOWN',      value: down      } : null,
    suspended > 0 ? { name: 'SUSPENDED', value: suspended } : null,
  ].filter(Boolean)

  return (
    <Box
      onClick={(e) => { e.stopPropagation(); onClick?.() }}
      style={{ textAlign: 'center', minWidth: 72, cursor: 'pointer' }}
      title={`Ver dispositivos ${label}`}
    >
      <PieChart width={80} height={80}>
        <Pie data={chartData} dataKey="value" cx="50%" cy="50%">
          {chartData.map(entry => (
            <Cell key={entry.name} fill={FILL[entry.name]} />
          ))}
        </Pie>
        <Tooltip formatter={(v, n) => [v, n === 'UP' ? 'Online' : n === 'DOWN' ? 'Offline' : 'Suspendido']} />
      </PieChart>
      <div style={{ fontSize: '0.72rem', lineHeight: 1.4 }}>
        <span>{ICONS[label]}{label}</span><br />
        <span style={{ color: COLOR_UP }}>{up}↑</span>
        {down      > 0 && <span style={{ color: COLOR_DOWN,      marginLeft: '0.25rem' }}>{down}↓</span>}
        {suspended > 0 && <span style={{ color: COLOR_SUSPENDED, marginLeft: '0.25rem' }}>{suspended}⏸</span>}
      </div>
    </Box>
  )
}

const STATUS_COLOR = { online: COLOR_UP, alerting: '#e0de55', dormant: '#aaa', offline: COLOR_DOWN, unknown: '#666' }

function DeviceList({ devices, type, suspendedSerials, onBack }) {
  const filtered = devices
    .filter(d => getTypeFromModel(d.model || d.productType) === type)
    .sort((a, b) => {
      const isSuspA = suspendedSerials.has(a.serial)
      const isSuspB = suspendedSerials.has(b.serial)
      const order = { offline: 0, alerting: 1, dormant: 2, online: 3, unknown: 4 }
      if (isSuspA !== isSuspB) return isSuspA ? 1 : -1  // suspendidos al final
      return (order[a.status] ?? 4) - (order[b.status] ?? 4)
    })

  return (
    <Box className="w-100">
      <div
        onClick={(e) => { e.stopPropagation(); onBack() }}
        style={{ fontSize: '0.72rem', cursor: 'pointer', marginBottom: '0.35rem', opacity: 0.7 }}
        title="Volver a los gráficos"
      >
        ← {ICONS[type]}{type} ({filtered.length})
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: 160, overflowY: 'auto' }}>
        {filtered.map(d => {
          const isSusp = suspendedSerials.has(d.serial)
          return (
            <li
              key={d.serial}
              style={{ display: 'flex', gap: '0.3rem', fontSize: '0.7rem', padding: '0.1rem 0', alignItems: 'center', opacity: isSusp ? 0.6 : 1 }}
            >
              <span style={{ color: isSusp ? COLOR_SUSPENDED : (STATUS_COLOR[d.status] ?? '#666') }}>
                {isSusp ? '⏸' : (d.status === 'online' || d.status === 'alerting' ? '●' : '●')}
              </span>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {d.name || d.serial}
              </span>
              {d.networkName && (
                <span style={{ opacity: 0.55, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 80 }}>
                  {d.networkName}
                </span>
              )}
            </li>
          )
        })}
      </ul>
    </Box>
  )
}

export default function DeviceTypeStatus({ orgId }) {
  const [loading, setLoading]           = useState(true)
  const [devices, setDevices]           = useState([])
  const [suspendedSerials, setSuspended] = useState(new Set())
  const [error, setError]               = useState(null)
  const [selectedType, setSelected]     = useState(null)

  const fetchInventory = async () => {
    setLoading(true)
    setError(null)
    try {
      const [invResp, incResp] = await Promise.all([
        axiosInstance.get(`/portal/inventory?orgId=${orgId}`),
        axiosInstance.get(`/incidents/report?orgId=${orgId}&days=7`).catch(() => ({ data: {} })),
      ])

      const list = invResp.data?.devices
      setDevices(Array.isArray(list) ? list : [])

      const openIncidents = incResp.data?.recentOpen || []
      const suspSet = new Set(
        openIncidents
          .filter(i => i.workStatus === 'suspended')
          .map(i => i.deviceSerial)
          .filter(Boolean)
      )
      setSuspended(suspSet)
    } catch (e) {
      console.error('DeviceTypeStatus:', e.message)
      setDevices([])
      setError('Sin datos de dispositivos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!orgId) return
    fetchInventory()
    const interval = setInterval(fetchInventory, 60000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId])

  const summary = useMemo(() => {
    const base = {
      MX: { up: 0, down: 0, suspended: 0 },
      MS: { up: 0, down: 0, suspended: 0 },
      MR: { up: 0, down: 0, suspended: 0 },
      MG: { up: 0, down: 0, suspended: 0 },
    }
    for (const d of devices) {
      const type = getTypeFromModel(d.model || d.productType)
      if (!type) continue
      if (suspendedSerials.has(d.serial)) {
        base[type].suspended++
      } else if (isUpStatus(d.status)) {
        base[type].up++
      } else {
        base[type].down++
      }
    }
    return base
  }, [devices, suspendedSerials])

  if (loading) return <Box className="w-100"><span style={{ opacity: 0.5, fontSize: '0.8rem' }}>Cargando...</span></Box>
  if (error)   return <Box className="w-100"><span style={{ opacity: 0.5, fontSize: '0.8rem' }}>{error}</span></Box>

  const types = ['MX', 'MS', 'MR', 'MG'].filter(t => summary[t].up + summary[t].down + summary[t].suspended > 0)
  if (types.length === 0) return <Box className="w-100"><span style={{ opacity: 0.5, fontSize: '0.8rem' }}>Sin dispositivos</span></Box>

  if (selectedType) {
    return (
      <DeviceList
        devices={devices}
        type={selectedType}
        suspendedSerials={suspendedSerials}
        onBack={() => setSelected(null)}
      />
    )
  }

  return (
    <Box className="d-flex" style={{ flexWrap: 'wrap', gap: '0.25rem', justifyContent: 'center', width: '100%' }}>
      {types.map(t => (
        <DeviceTypeMiniChart
          key={t}
          label={t}
          up={summary[t].up}
          down={summary[t].down}
          suspended={summary[t].suspended}
          onClick={() => setSelected(t)}
        />
      ))}
    </Box>
  )
}

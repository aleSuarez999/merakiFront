import { useEffect, useMemo, useState } from 'react'
import Box from './Box'
import axiosInstance from '../utils/api'

const isUpStatus = (status) => {
  if (!status) return false
  const s = String(status).toLowerCase()
  return s === 'online' || s === 'alerting'
}

const getTypeFromModel = (model) => {
  const m = (model || '').toUpperCase().trim()
  if (m.startsWith('MR')) return 'MR'
  if (m.startsWith('MS')) return 'MS'
  if (m.startsWith('MG')) return 'MG'
  if (m.startsWith('MX')) return 'MX'
  return 'OT'
}

export default function DeviceTypeStatus({ orgId }) {
  const [loading, setLoading] = useState(true)
  const [devices, setDevices] = useState([])
  const [error, setError] = useState(null)

  const fetchInventory = async () => {
    setLoading(true)
    setError(null)

    try {
      const resp = await axiosInstance.get(`/portal/inventory?orgId=${orgId}`)
      const list = resp.data?.devices
      setDevices(Array.isArray(list) ? list : [])
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
    const base = { MX: { up: 0, down: 0 }, MS: { up: 0, down: 0 }, MR: { up: 0, down: 0 }, MG: { up: 0, down: 0 } }
    for (const d of devices) {
      const type = getTypeFromModel(d.model || d.productType)
      if (!base[type]) continue
      isUpStatus(d.status) ? base[type].up++ : base[type].down++
    }
    return base
  }, [devices])

  if (loading) return <Box className="w-100"><span style={{ opacity: 0.5, fontSize: '0.8rem' }}>Cargando...</span></Box>
  if (error)   return <Box className="w-100"><span style={{ opacity: 0.5, fontSize: '0.8rem' }}>{error}</span></Box>

  const hasAny = Object.values(summary).some(v => v.up + v.down > 0)
  if (!hasAny) return <Box className="w-100"><span style={{ opacity: 0.5, fontSize: '0.8rem' }}>Sin dispositivos</span></Box>

  return (
    <Box className="w-100">
      <ul className="orgStatus d-flex" style={{ gap: '0.5rem', flexWrap: 'wrap' }}>
        {['MX', 'MS', 'MR', 'MG'].map(t => {
            //{['MX', '🔀MS', '📡MR', '📶MG'].map(t => {
          const { up, down } = summary[t]
          const total = up + down
          if (total === 0) return null
          return (
            <li key={t} className="jcsb d-flex" style={{ gap: '0.3rem' }}>
              <span>{(t=="MR")?"📡":(t=="MS")?"🔀":(t=="MR")?"📡":"📶"}{t}</span>
              <span style={{ color: '#10b981' }}>{up}↑</span>
              {down > 0 && <span style={{ color: '#ef4444' }}>{down}↓</span>}
            </li>
          )
        })}
      </ul>
    </Box>
  )
}

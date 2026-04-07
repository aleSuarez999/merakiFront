// src/pages/CUEstadisticas.jsx
// ─── Integrado al layout del proyecto Meraki (sin aside propio) ────────────────
// ─── Filtros: fecha desde/hasta + búsqueda por cliente (nombre o CUIT) ─────────

import { useState, useEffect, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer,
} from "recharts";
import {
  getCUParque,
  getCUAltasDiarias,
  getCUAltasSemanales,
  getCUAltasMensuales,
  getCUClientesAcumulados,
  getCUClientesLista,
} from "../utils/api.cu";

// ─── Paleta (reutiliza las variables del proyecto) ────────────────────────────
const PIE_COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ec4899", "#06b6d4"];

// ─── Fecha default: último año ────────────────────────────────────────────────
const hoy = new Date();
const isoHoy = hoy.toISOString().split("T")[0];
const hace1Anio = new Date(hoy);
hace1Anio.setFullYear(hace1Anio.getFullYear() - 1);
const isoAnio = hace1Anio.toISOString().split("T")[0];

// ─── Tooltip personalizado ────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="cu-tooltip">
      <div className="cu-tooltip__label">{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || "#3b82f6", fontWeight: 600 }}>
          {p.value?.toLocaleString()} líneas
        </div>
      ))}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
function CUEstadisticas() {
  // ── Filtros ────────────────────────────────────────────────────────────────
  const [fechaDesde, setFechaDesde] = useState(isoAnio);
  const [fechaHasta, setFechaHasta] = useState(isoHoy);
  const [clienteInput, setClienteInput] = useState("");
  const [clienteSeleccionado, setClienteSeleccionado] = useState("");
  const [sugerencias, setSugerencias] = useState([]);

  // ── Tab activo ─────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("parque");

  // ── Datos ──────────────────────────────────────────────────────────────────
  const [parque, setParque]             = useState(null);
  const [altasDiarias, setAltasDiarias] = useState([]);
  const [altasSem, setAltasSem]         = useState([]);
  const [altasMen, setAltasMen]         = useState([]);
  const [clientes, setClientes]         = useState([]);
  const [loading, setLoading]           = useState(false);

  // ── Fetch principal ────────────────────────────────────────────────────────
  const filters = {
    fechaDesde,
    fechaHasta,
    cliente: clienteSeleccionado,
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [p, ad, as_, am, cl] = await Promise.all([
      getCUParque({ cliente: clienteSeleccionado }),
      getCUAltasDiarias(filters),
      getCUAltasSemanales(filters),
      getCUAltasMensuales(filters),
      getCUClientesAcumulados(filters),
    ]);
    setParque(p);
    setAltasDiarias(ad);
    setAltasSem(as_);
    setAltasMen(am);
    setClientes(cl);
    setLoading(false);
  }, [fechaDesde, fechaHasta, clienteSeleccionado]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Autocomplete cliente ───────────────────────────────────────────────────
  useEffect(() => {
    if (!clienteInput || clienteInput.length < 2) {
      setSugerencias([]);
      return;
    }
    const t = setTimeout(async () => {
      const lista = await getCUClientesLista(clienteInput);
      setSugerencias(lista);
    }, 300);
    return () => clearTimeout(t);
  }, [clienteInput]);

  const aplicarFiltros = () => {
    setClienteSeleccionado(clienteInput);
  };

  const limpiarFiltros = () => {
    setFechaDesde(isoAnio);
    setFechaHasta(isoHoy);
    setClienteInput("");
    setClienteSeleccionado("");
    setSugerencias([]);
  };

  // ── KPIs ───────────────────────────────────────────────────────────────────
  const totalLineas   = parque?.total ?? 0;
  const totalWebex    = parque?.porDispositivo?.find(d => d.name === "CiscoWebex")?.value ?? 0;
  const totalFisicos  = parque?.hwTable?.reduce((s, r) => s + Number(r.fisicos), 0) ?? 0;
  const totalClientes = clientes.length ? clientes.at(-1).cantidad_mes : 0;

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="cu-page">
      {/* ── Encabezado ───────────────────────────────────────────────────── */}
      <div className="cu-header">
        <div>
          <h2 className="cu-header__title">📞 CU Estadísticas</h2>
          <p className="cu-header__subtitle">Cisco BroadWorks · Parque de telefonía unificada</p>
        </div>
        <div className="cu-header__date">
          Última actualización:{" "}
          {new Date().toLocaleDateString("es-AR", {
            weekday: "short", day: "2-digit", month: "short", year: "numeric",
          })}
        </div>
      </div>

      {/* ── Panel de filtros ─────────────────────────────────────────────── */}
      <div className="cu-filters">
        <div className="cu-filters__group">
          <label className="cu-filters__label">Desde</label>
          <input
            type="date"
            className="cu-filters__input"
            value={fechaDesde}
            max={fechaHasta}
            onChange={(e) => setFechaDesde(e.target.value)}
          />
        </div>
        <div className="cu-filters__group">
          <label className="cu-filters__label">Hasta</label>
          <input
            type="date"
            className="cu-filters__input"
            value={fechaHasta}
            min={fechaDesde}
            max={isoHoy}
            onChange={(e) => setFechaHasta(e.target.value)}
          />
        </div>
        <div className="cu-filters__group cu-filters__group--autocomplete">
          <label className="cu-filters__label">Cliente (nombre o CUIT)</label>
          <div className="cu-autocomplete">
            <input
              type="text"
              className="cu-filters__input"
              placeholder="Buscar cliente..."
              value={clienteInput}
              onChange={(e) => {
                setClienteInput(e.target.value);
                if (!e.target.value) setClienteSeleccionado("");
              }}
            />
            {sugerencias.length > 0 && (
              <ul className="cu-autocomplete__list">
                {sugerencias.map((s, i) => (
                  <li
                    key={i}
                    className="cu-autocomplete__item"
                    onClick={() => {
                      setClienteInput(s.groupId);
                      setClienteSeleccionado(s.groupId);
                      setSugerencias([]);
                    }}
                  >
                    <strong>{s.groupId}</strong>
                    {s.serviceProvider && (
                      <span className="cu-autocomplete__sp"> · {s.serviceProvider}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="cu-filters__actions">
          <button className="cu-btn cu-btn--primary" onClick={aplicarFiltros} disabled={loading}>
            {loading ? "Cargando…" : "Aplicar"}
          </button>
          <button className="cu-btn cu-btn--secondary" onClick={limpiarFiltros}>
            Limpiar
          </button>
        </div>
      </div>

      {/* ── KPIs ──────────────────────────────────────────────────────────── */}
      <div className="cu-kpis">
        <KPICard label="Total Líneas"        value={totalLineas}   color="#3b82f6" />
        <KPICard label="Webex (PC + Mobile)" value={totalWebex}    color="#ec4899" />
        <KPICard label="Físicos"             value={totalFisicos}  color="#8b5cf6" />
        <KPICard label="Clientes Activos"    value={totalClientes} color="#10b981" />
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <div className="cu-tabs">
        {[
          { id: "parque",   label: "Parque Actual" },
          { id: "altas",    label: "Altas" },
          { id: "clientes", label: "Clientes" },
        ].map((t) => (
          <button
            key={t.id}
            className={`cu-tab ${activeTab === t.id ? "cu-tab--active" : ""}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && <div className="cu-loading">Cargando datos…</div>}

      {/* ══ TAB: PARQUE ═══════════════════════════════════════════════════ */}
      {!loading && activeTab === "parque" && (
        <div className="cu-grid cu-grid--2col">
          {/* Pie usuarios por dispositivo */}
          <CUCard title="Usuarios por Dispositivo">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={parque?.porDispositivo ?? []}
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={100}
                  paddingAngle={3} dataKey="value"
                >
                  {(parque?.porDispositivo ?? []).map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [v.toLocaleString(), "usuarios"]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CUCard>

          {/* Pie físicos */}
          <CUCard title="Dispositivos Físicos">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={parque?.hwTable ?? []}
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={100}
                  paddingAngle={3} dataKey="fisicos" nameKey="tipo"
                >
                  {(parque?.hwTable ?? []).map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [v.toLocaleString(), "unidades"]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CUCard>

          {/* Tabla hw */}
          <CUCard title="Resumen Hardware — Físicos vs Usuarios" fullWidth>
            <table className="cu-table">
              <thead>
                <tr>
                  {["Tipo", "Físicos", "Usuarios"].map((h) => (
                    <th key={h} className="cu-table__th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(parque?.hwTable ?? []).map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? "cu-table__row" : "cu-table__row cu-table__row--alt"}>
                    <td className="cu-table__td">{row.tipo}</td>
                    <td className="cu-table__td cu-table__td--purple">{Number(row.fisicos).toLocaleString()}</td>
                    <td className="cu-table__td cu-table__td--green">{Number(row.fisicos).toLocaleString()}</td>
                  </tr>
                ))}
                {parque?.hwTable?.length > 0 && (
                  <tr className="cu-table__row cu-table__row--total">
                    <td className="cu-table__td cu-table__td--bold">Total</td>
                    <td className="cu-table__td cu-table__td--bold cu-table__td--accent">{totalFisicos.toLocaleString()}</td>
                    <td className="cu-table__td cu-table__td--bold cu-table__td--accent">{totalFisicos.toLocaleString()}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </CUCard>
        </div>
      )}

      {/* ══ TAB: ALTAS ════════════════════════════════════════════════════ */}
      {!loading && activeTab === "altas" && (
        <div className="cu-grid cu-grid--1col">
          <CUCard title="Altas por Día">
            <ResponsiveContainer width="100%" height={270}>
              <BarChart data={altasDiarias} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #252d45)" />
                <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="cant" fill="#BC5679" radius={[4, 4, 0, 0]} name="Altas" />
              </BarChart>
            </ResponsiveContainer>
          </CUCard>

          <CUCard title="Crecimiento por Semana">
            <ResponsiveContainer width="100%" height={270}>
              <BarChart data={altasSem} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #252d45)" />
                <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="cant" fill="#C5A5CF" radius={[4, 4, 0, 0]} name="Líneas" />
              </BarChart>
            </ResponsiveContainer>
          </CUCard>

          <CUCard title="Altas Mensuales">
            <ResponsiveContainer width="100%" height={270}>
              <BarChart data={altasMen} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #252d45)" />
                <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="cant" fill="#AAF5AF" radius={[4, 4, 0, 0]} name="Altas" />
              </BarChart>
            </ResponsiveContainer>
          </CUCard>
        </div>
      )}

      {/* ══ TAB: CLIENTES ═════════════════════════════════════════════════ */}
      {!loading && activeTab === "clientes" && (
        <div className="cu-grid cu-grid--1col">
          <CUCard title="Clientes Acumulados por Mes">
            <ResponsiveContainer width="100%" height={310}>
              <LineChart data={clientes} margin={{ top: 4, right: 24, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #252d45)" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(v) => [v.toLocaleString(), "Clientes"]}
                  contentStyle={{ borderRadius: 8 }}
                />
                <Line
                  type="monotone" dataKey="cantidad_mes"
                  stroke="#06b6d4" strokeWidth={2.5}
                  dot={{ fill: "#06b6d4", r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Clientes"
                />
              </LineChart>
            </ResponsiveContainer>
          </CUCard>

          {/* Detalle mensual */}
          <CUCard title="Detalle Mensual">
            <table className="cu-table">
              <thead>
                <tr>
                  {["Mes", "Clientes Acumulados", "Variación"].map((h) => (
                    <th key={h} className="cu-table__th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clientes.map((row, i) => {
                  const prev = i > 0 ? clientes[i - 1].cantidad_mes : null;
                  const delta = prev !== null ? row.cantidad_mes - prev : null;
                  return (
                    <tr key={i} className={i % 2 === 0 ? "cu-table__row" : "cu-table__row cu-table__row--alt"}>
                      <td className="cu-table__td">{row.mes}</td>
                      <td className="cu-table__td cu-table__td--cyan">{row.cantidad_mes?.toLocaleString()}</td>
                      <td className="cu-table__td">
                        {delta !== null && (
                          <span style={{ color: delta >= 0 ? "#10b981" : "#ef4444", fontWeight: 600 }}>
                            {delta >= 0 ? "+" : ""}{delta}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CUCard>
        </div>
      )}
    </div>
  );
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function KPICard({ label, value, color }) {
  return (
    <div className="cu-kpi">
      <div className="cu-kpi__label">{label}</div>
      <div className="cu-kpi__value" style={{ color }}>{value?.toLocaleString()}</div>
    </div>
  );
}

function CUCard({ title, children, fullWidth }) {
  return (
    <div className={`cu-card ${fullWidth ? "cu-card--full" : ""}`}>
      {title && <div className="cu-card__title">{title}</div>}
      {children}
    </div>
  );
}

export default CUEstadisticas;

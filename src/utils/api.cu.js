// ─── CU Estadísticas — BroadWorks ─────────────────────────────────────────────
// Agregar estas funciones al final del archivo src/utils/api.js existente.
// axiosInstance ya está definido arriba en ese archivo.

/**
 * GET /api/cu/parque
 * Foto actual del parque de dispositivos.
 * @param {string} [cliente] - Filtra por nombre o CUIT/serviceProvider
 */
export const getCUParque = async ({ cliente } = {}) => {
  try {
    const params = new URLSearchParams();
    if (cliente) params.append("cliente", cliente);
    const resp = await axiosInstance.get(`/cu/parque?${params}`);
    return resp.data.ok ? resp.data : null;
  } catch (err) {
    console.error("getCUParque error:", err.message);
    return null;
  }
};

/**
 * GET /api/cu/altas/diarias
 * Altas por día.
 * @param {Object} [filters] - { fechaDesde: "YYYY-MM-DD", fechaHasta: "YYYY-MM-DD", cliente }
 */
export const getCUAltasDiarias = async (filters = {}) => {
  try {
    const params = buildCUParams(filters);
    const resp = await axiosInstance.get(`/cu/altas/diarias?${params}`);
    return resp.data.ok ? resp.data.data : [];
  } catch (err) {
    console.error("getCUAltasDiarias error:", err.message);
    return [];
  }
};

/**
 * GET /api/cu/altas/semanales
 */
export const getCUAltasSemanales = async (filters = {}) => {
  try {
    const params = buildCUParams(filters);
    const resp = await axiosInstance.get(`/cu/altas/semanales?${params}`);
    return resp.data.ok ? resp.data.data : [];
  } catch (err) {
    console.error("getCUAltasSemanales error:", err.message);
    return [];
  }
};

/**
 * GET /api/cu/altas/mensuales
 */
export const getCUAltasMensuales = async (filters = {}) => {
  try {
    const params = buildCUParams(filters);
    const resp = await axiosInstance.get(`/cu/altas/mensuales?${params}`);
    return resp.data.ok ? resp.data.data : [];
  } catch (err) {
    console.error("getCUAltasMensuales error:", err.message);
    return [];
  }
};

/**
 * GET /api/cu/clientes
 * Crecimiento de clientes acumulado por mes.
 */
export const getCUClientesAcumulados = async (filters = {}) => {
  try {
    const params = buildCUParams(filters);
    const resp = await axiosInstance.get(`/cu/clientes?${params}`);
    return resp.data.ok ? resp.data.data : [];
  } catch (err) {
    console.error("getCUClientesAcumulados error:", err.message);
    return [];
  }
};

/**
 * GET /api/cu/clientes/lista
 * Lista de clientes para autocomplete.
 * @param {string} q - Texto de búsqueda
 */
export const getCUClientesLista = async (q = "") => {
  try {
    const resp = await axiosInstance.get(`/cu/clientes/lista?q=${encodeURIComponent(q)}`);
    return resp.data.ok ? resp.data.data : [];
  } catch (err) {
    console.error("getCUClientesLista error:", err.message);
    return [];
  }
};

/** Util: construye URLSearchParams para filtros CU */
function buildCUParams({ fechaDesde, fechaHasta, cliente } = {}) {
  const p = new URLSearchParams();
  if (fechaDesde) p.append("fechaDesde", fechaDesde);
  if (fechaHasta) p.append("fechaHasta", fechaHasta);
  if (cliente)    p.append("cliente", cliente);
  return p;
}

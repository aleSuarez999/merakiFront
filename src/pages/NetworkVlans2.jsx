import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { getNetworkVlans, getOrgsSinFiltro, getNetworksByOrg, copyVlans } from '../utils/api';
import Box from '../components/Box';
import CardVlans from '../components/CardVlans';

export default function NetworkVlans2() {
  const [loading, setLoading] = useState(true);
  const [networkVlans, setnetworkVlans] = useState([]);
  const [viewAsList, setViewAsList] = useState(false);
  const { networkId } = useParams();

  const [organizations, setOrganizations] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState('');
  const [networks, setNetworks] = useState([]);
  const [selectedNetwork, setSelectedNetwork] = useState('');
  const [dstNetwork, setDstNetwork] = useState('');
  const [dstVlans, setDstVlans] = useState([]);

  // VLANs seleccionadas con datos editables
  const [selectedVlans, setSelectedVlans] = useState([]);

  useEffect(() => {
    const fetchVlans = async () => {
      const res = await getNetworkVlans(networkId);
      setnetworkVlans(res);
      setLoading(false);
    };
    fetchVlans();
  }, [networkId]);

  // al inicio se muestra el list de orgs

  useEffect(() => {
    
    if (selectedNetwork) {

      const fetchVlans = async () => {
      const res = await getNetworkVlans(selectedNetwork);
      setDstVlans(res);
      setLoading(false);
    };
    fetchVlans();
  }
    else{
      setDstVlans([])
    }
    
  }, [selectedNetwork])
  


  useEffect(() => {
    const fetchOrgs = async () => {
      const orgs = await getOrgsSinFiltro();
      // esto es para poder elegir el tecotest que filtro para los gráficos
      setOrganizations(orgs);
    };
    fetchOrgs();
  }, []);

  // por cada cambio en las orgs muestro las redes
  useEffect(() => {
    if (selectedOrg) {
      const fetchNetworks = async () => {
        const nets = await getNetworksByOrg(selectedOrg);
        setNetworks(nets);
      };
      fetchNetworks();
    } else {
      setNetworks([]);
    }
  }, [selectedOrg]);

  // Toggle selección

  const toggleVlanSelection = (vlan) => {
    setSelectedVlans((prev) => {
      const exists = prev.find((v) => v.id === vlan.id);
      if (exists) {
        // si existe la saco
        return prev.filter((v) => v.id !== vlan.id);
      } else {
        // si no existe la agrego,  toggle
        return [...prev, { ...vlan }]; // copiar datos originales
      }
    });
  };

  // Actualizar IP o Subnet en VLAN seleccionada
  const updateVlanField = (id, field, value) => {
    setSelectedVlans((prev) =>
      // si el id coincide coloco todos los actuales y reemplazo el campo field con el value, sino mando v el anterior
      prev.map((v) => (v.id === id ? { ...v, [field]: value } : v))
    );
  };

  // Enviar VLANs seleccionadas
  const handleSendSelectedVlans = async () => {
    if (!selectedNetwork || selectedVlans.length === 0) {
      alert('Selecciona una red destino y al menos una VLAN.');
      return;
    }
    try {
      // selectedVlans tiene appliance vlans asi en el json que viene de la misma api
      // pero con el agregado del cambio de las ip si fué necesario
      console.log("vlans a copiar", selectedVlans)
      await copyVlans(selectedVlans, selectedNetwork);
      alert('VLANs copiadas correctamente.');
    } catch (err) {
      alert('Error al copiar VLANs: ' + err.message);
    }
  };

  if (loading) return <p>Cargando vlans...</p>;

  return (
    <>
    
   
      <label style={{ marginBottom: '1rem', display: 'block' }}>
        <input
          type="checkbox"
          checked={viewAsList}
          onChange={() => setViewAsList(!viewAsList)}
        />
        {' '}Mostrar como lista
      </label>

      <div style={{ marginBottom: '1rem' }}>
        <label>Organización: </label>
        <select value={selectedOrg} onChange={(e) => setSelectedOrg(e.target.value)}>
          <option value="">Seleccione organización</option>
          {organizations.map(org => (
            <option key={org.id} value={org.id}>{org.name}</option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label>Red destino: </label>
        <select value={selectedNetwork} onChange={(e) => setSelectedNetwork(e.target.value)}>
          <option value="">Seleccione red</option>
          {networks.map(net => (
            <option key={net.id} value={net.id}>{net.name} - {net.id}</option>
          ))}
        </select>
      </div>
      {selectedNetwork && dstVlans.length > 0 && (
        <div style={{ marginTop: '1rem', padding: '10px', border: '1px solid #ccc', background: '#f9f9f9' }}>
          <h4>Resumen VLANs de la red seleccionada:</h4>
          <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
            {dstVlans.map((vlan) => (
              <li key={vlan.id} style={{ marginBottom: '5px' }}>
                {vlan.networkId} | <strong>ID:</strong> {vlan.id} | <strong>Nombre:</strong> {vlan.name} | <strong>IP:</strong> {vlan.applianceIp}
              </li>
            ))}
          </ul>
        </div>
      )}

      <button onClick={handleSendSelectedVlans}>Copiar VLANs seleccionadas desde {networkId}</button>

      {/* Vista VLANs actual */}
      {viewAsList ? (
        <Box className="vlan_container">
          <ul>
            {networkVlans.map((data) => {
              const isSelected = selectedVlans.some((v) => v.id === data.id);
              const selectedData = selectedVlans.find((v) => v.id === data.id);
              return (
                <li key={data.id} style={{ marginBottom: '1rem' }}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleVlanSelection(data)}
                  />{' '}
                  <h5>{data.name}</h5>
                  <div>
                    IP:{' '}
                    <input
                      type="text"
                      value={isSelected ? selectedData.applianceIp : data.applianceIp}
                      onChange={(e) => updateVlanField(data.id, 'applianceIp', e.target.value)}
                      disabled={!isSelected}
                    />
                  </div>
                  <div>
                    Subnet:{' '}
                    <input
                      type="text"
                      value={isSelected ? selectedData.subnet : data.subnet}
                      onChange={(e) => updateVlanField(data.id, 'subnet', e.target.value)}
                      disabled={!isSelected}
                    />
                  </div>
                  <div>VLAN ID: {data.id}</div>
                </li>
              );
            })}
          </ul>
        </Box>
      ) : (
        <Box className="org__grid">
          {networkVlans.map((data) => {
            const isSelected = selectedVlans.some((v) => v.id === data.id);
            const selectedData = selectedVlans.find((v) => v.id === data.id);
            return (
              <Box key={data.id} className="col-xs-12 col-sm-6 col-lg-3 col-xl-4 col-xxl-4">
                <div style={{ border: '1px solid #ccc', padding: '10px' }}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleVlanSelection(data)}
                  />
                  <CardVlans vlans={data} selectedData={selectedData} isSelected={isSelected} toggleVlanSelection={toggleVlanSelection} updateVlanField={updateVlanField} />

                </div>
              </Box>
            );
          })}
        </Box>
      )}
    </>
  );
}
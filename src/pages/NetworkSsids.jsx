import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { getNetworkSsids, getOrgs, getNetworksByOrg, copySsids } from '../utils/api';
import Box from '../components/Box';
import CardSsids from '../components/CardSsids';
import { jwtDecode } from 'jwt-decode';

// Obtiene el rol del JWT almacenado, igual que en Navbar.jsx
function getRoleFromToken() {
  try {
    const token = localStorage.getItem('jwt_token');
    if (!token) return '';
    const decoded = jwtDecode(token);
    return decoded.role || '';
  } catch {
    return '';
  }
}

export default function Networkssids() {
  const [loading, setLoading] = useState(true);
  const role = getRoleFromToken();
  const [networkSsids, setnetworkSsids] = useState([]);
  const [viewAsList, setViewAsList] = useState(false);
  const { networkId } = useParams();

  const [organizations, setOrganizations] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState('');
  const [networks, setNetworks] = useState([]);
  const [selectedNetwork, setSelectedNetwork] = useState('');
  const [dstNetwork, setDstNetwork] = useState('');
  const [dstSsids, setDstSsids] = useState([]);

  // SSIDs seleccionadas con datos editables
  const [selectedSsids, setSelectedSsids] = useState([]);

  useEffect(() => {
    console.log("networkId->", networkId)
    const fetchSsids = async () => {
      const res = await getNetworkSsids(networkId);
      console.log("datassid", res)
      if (res)
        setnetworkSsids(res.networks);
      setLoading(false);
    };
    fetchSsids();
  }, [networkId]);

  // al inicio se muestra el list de orgs

  useEffect(() => {
    // este es el destino donde se va a copiar el ssid
    if (selectedNetwork) {
      try {
        // se mete en try porque sino tiene wireless activo da error
        const fetchSsids = async () => {
        const res = await getNetworkSsids(selectedNetwork);
        //console.log("datassid2", res)
        if (res)
          setDstSsids(res.networks);
        setLoading(false);
        }
        fetchSsids();

      } catch (error) {
        console.log(error)
        setDstSsids([])  
      }
      
    
    
  }
    else{
      setDstSsids([])
    }
    
  }, [selectedNetwork])
  


  useEffect(() => {
    const fetchOrgs = async () => {
      const orgs = await getOrgs();
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

  const toggleSsidSelection = (ssid) => {
    setSelectedSsids((prev) => {
      const exists = prev.find((v) => v.name === ssid.name);
      if (exists) {
        // si existe la saco
        return prev.filter((v) => v.name !== ssid.name);
      } else {
        // si no existe la agrego,  toggle
        return [...prev, { ...ssid }]; // copiar datos originales
      }
    });
  };

  // Actualizar IP o Subnet en SSID seleccionada
  const updateSsidField = (number, field, value) => {
    setSelectedSsids((prev) =>
      // si el id coincide coloco todos los actuales y reemplazo el campo field con el value, sino mando v el anterior
      prev.map((v) => (v.number === number ? { ...v, [field]: value } : v))
    );
  };

  // Enviar SSIDs seleccionadas
  const handleSendSelectedSsids = async () => {
    if (!selectedNetwork || selectedSsids.length === 0) {
      alert('Selecciona una red destino y al menos una SSID.');
      return;
    }
    try {
      // selectedSsids tiene appliance ssids asi en el json que viene de la misma api
      // pero con el agregado del cambio de las ip si fué necesario
      console.log("ssids a copiar", selectedSsids)
      await copySsids(selectedSsids, selectedNetwork);
      alert('SSIDs copiadas correctamente.');
    } catch (err) {
      alert('Error al copiar SSIDs: ' + err.message);
    }
  };

  if (loading) return <p>Cargando ssids...</p>;

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
      {selectedNetwork && dstSsids.length > 0 && (
        <div style={{ border: '1px solid #ccc', borderRadius: "1rem", padding: "1rem" }}>
          <h4>Resumen SSIDs de la red seleccionada:</h4>
          <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
            {dstSsids.map((ssid) => ( 
              (ssid.enabled)&&
              <li key={ssid.name} style={{ marginBottom: '5px' }}>
                {(ssid.enabled)?"Activo | ":""}  <strong>Nro:</strong> {ssid.number} | <strong>Nombre:</strong> {ssid.name} | <strong>Vlan:</strong> {ssid.defaultVlanId}
              </li>
            ))}
          </ul>
        </div>
      )}

      {role === 'admin' && (
        <button onClick={handleSendSelectedSsids}>Copiar SSIDs seleccionadas desde {networkId}</button>
      )}

      {/* Vista SSIDs actual */}
        {(
        <Box className="org__grid">
          {(networkSsids && networkSsids.length > 0) && networkSsids.map((data) => {
            const isSelected = selectedSsids.some((v) => v.number === data.number);
            const selectedData = selectedSsids.find((v) => v.number === data.number);
            return (
              <Box key={data.name} className="col-xs-6 col-sm-3 col-lg-3 col-xl-2 col-xxl-2">
                <div  className='card__ssids__container'>
                  <input className='ssid__selector'
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSsidSelection(data)}
                  />
                  <CardSsids ssids={data} selectedData={selectedData} isSelected={isSelected} toggleSsidSelection={toggleSsidSelection} updateSsidField={updateSsidField} />

                </div>
              </Box>
            );
          })}
        </Box>
      )}
    </>
  );
}
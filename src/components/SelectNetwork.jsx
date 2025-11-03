import { useEffect, useState } from "react";
import Box from "./Box";
import { getNetworksByOrg, getOrgsSinFiltro } from "../utils/api";

function SelectNetwork() {

    const [organizations, setOrganizations] = useState([]);
    const [selectedOrg, setSelectedOrg] = useState('');
    const [networks, setNetworks] = useState([]);
    const [selectedNetwork, setSelectedNetwork] = useState('');
    const [dstNetwork, setDstNetwork] = useState('');
  
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




    return (

    <Box>
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
    </Box>
)
}
export default SelectNetwork

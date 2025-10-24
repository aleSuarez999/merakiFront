import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { getNetworkVlans } from '../utils/api';
import Box from '../components/Box';
import CardVlans from '../components/CardVlans';

export default function NetworkVlans() {
  const [loading, setLoading] = useState(true);
  const [networkVlans, setnetworkVlans] = useState([]);
  const [viewAsList, setViewAsList] = useState(false);
  const { networkId } = useParams();

  useEffect(() => {
    const fetchVlans = async () => {
      const res = await getNetworkVlans(networkId);
      setnetworkVlans(res);
      setLoading(false);
    };

    fetchVlans();
  }, [networkId]);

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

      {viewAsList ? (
        <Box className="vlan_container">
          <ul>
            {networkVlans && networkVlans.map((data, index) => (
              <li key={index} style={{ marginBottom: '1rem' }}>
                <h5>VlanName: - {data.name}</h5>
                <div>Ip: {data.applianceIp} / Net: {data.subnet}</div>
                <div>Vlan: {data.id}</div>
              </li>
            ))}
          </ul>
        </Box>
      ) : (
        <Box className="org__grid">
          {networkVlans && networkVlans.map((data) => (
            <Box
              key={`B${data.id}`}
              id={`B${data.id}`}
              className="col-xs-12 col-sm-6 col-lg-3 col-xl-4 col-xxl-4"
            >
              <CardVlans vlans={data} />
            </Box>
          ))}
        </Box>
      )}
    </>
  );
}

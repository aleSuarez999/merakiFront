export default function ApplianceStatus({ orgId }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(`/api/organizations/${orgId}/appliance/uplink/statuses`)
      .then(res => res.json())
      .then(json => setData(json.redes));
  }, [orgId]);

  return (
    <div>
      {data ? data.map((item, idx) => (
        <div key={idx}>
          <strong>{item.name}</strong> - Estado: {item.estado.map(e => e.status).join(', ')}
        </div>
      )) : 'Cargando...'}
    </div>
  );
}
import Box from './Box';

function CardSsids({ ssids, selectedData, isSelected, updateSsidField }) {
  return (
    <Box className="card__ssids__body">
      <Box key={ssids.number} className="ssid_container">
        <h5>Nro: {ssids.number} Nombre: - {ssids.name}</h5>
        <ul>
          <li>
            <input
              type="text"
              value={isSelected ? selectedData.defaultVlanId : ssids.defaultVlanId}
              onChange={(e) => updateSsidField(ssids.number, 'vlan', e.target.value)}
              disabled={!isSelected}
            />
          </li>
        </ul>
      </Box>
    </Box>
  );
}

export default CardSsids;
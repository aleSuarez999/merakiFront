import Box from './Box';
import Text from './Text';

function CardSsids({ ssids, selectedData, isSelected, updateSsidField }) {
  return (
    <Box className="card__ssids__body">
      <Box key={ssids.number} className="ssid_container">
        <div className='ssid__name'>
          <h5 >Nro: {ssids.number} Nombre: - {ssids.name}</h5>
        </div>
        <ul>
          <li>
            <Text as="span"> Vlan: </Text>
            <input className='ssid__vlan'
              type="text"
              value={isSelected ? selectedData.defaultVlanId : ssids.defaultVlanId}
              onChange={(e) => updateSsidField(ssids.number, 'defaultVlanId', e.target.value)}
              disabled={!isSelected}
            />
          </li>
        </ul>
      </Box>
    </Box>
  );
}

export default CardSsids;
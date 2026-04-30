import Text from './Text'
import { NavLink } from 'react-router'
import Box from './Box'
import UplinkStatus from './UplinkStatus'

function CardUplink({ org, onClick, onHasUplink }) {
  return (
    <Box className="card__body" onClick={onClick}>
      <NavLink to={`/UplinkStatuses/${org.id}`}>
        <Text as="p" className="card__title">{org.name}</Text>
      </NavLink>

      <Box className="d-flex card__status">
        <UplinkStatus
          org={org}
          onHasData={(hasData) => onHasUplink?.(org.id, hasData)}
        />
      </Box>
    </Box>
  )
}

export default CardUplink
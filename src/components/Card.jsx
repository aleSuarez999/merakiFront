import React, { useContext } from 'react'
import Text from './Text'
import { NavLink, useNavigate } from 'react-router'
import Context from '../context/Context';

import Box from './Box';

function Card({
    org,
    ...props

}) {

  const navigate = useNavigate();

  return (
      <>
         
          <Box className="card__body">
              <NavLink to={`/organizations/${org.orgId}`} >

              </NavLink>
              <Text as="p" className="card__title">{org.name}</Text>
              
              <Box className="d-flex counter__container jcc">
              
              </Box>
          </Box>
    </>
  )
}

export default Card
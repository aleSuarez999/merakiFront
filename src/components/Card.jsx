import React, { useContext } from 'react'
import Text from './Text'
import { NavLink, useNavigate } from 'react-router'
import MkContext from '../context/Context';

import Box from './Box';

function Card({
    id_,
    name,
    brand,
    image,
    img,
    category,
    amount,
    prod,
    ...props

}) {

  const navigate = useNavigate();

  return (
      <>
         
          <Box className="card__body">
              <NavLink to={`/organizations/${org.orgId}`} >

              </NavLink>
              <Text as="p" className="card__title">{name}</Text>
              <Text as="p" className="card__category">Categoria: {category}</Text> 
              <Text as="p" className="precio">{`$ ${amount}`}   </Text>
              <Box className="d-flex counter__container jcc">
              
              </Box>
          </Box>
    </>
  )
}

export default Card
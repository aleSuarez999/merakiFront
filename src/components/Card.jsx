import React, { useContext } from 'react'
import Text from './Text'
import { NavLink, useNavigate } from 'react-router'
import CartContext from '../context/CartContext';
import CounterAdd from './CounterAdd';
import Box from './Box';
import freeDelivery from '../assets/freeDelivery01.png';


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
  const {increment} = useContext(CartContext)
  //Verifico path console.log(img)
  return (
      <>
         
          <Box className="card__body">
             {(prod.freeDelivery) && <img src={freeDelivery} className='freeDelivery'/>}
              <NavLink to={`/products/${prod._id}`} >
                <img src={image ? image : img} className="card__img" alt="..." />
              
              </NavLink>
              <Text as="p" className="card__title">{name}</Text>
              <Text as="p" className="card__category">Categoria: {category}</Text> 
              <Text as="p" className="precio">{`$ ${amount}`}   </Text>
              <Box className="d-flex counter__container jcc">
                <CounterAdd prod={prod} />
                
              
              </Box>
          </Box>
    </>
  )
}

export default Card
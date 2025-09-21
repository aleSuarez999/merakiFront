import React, { useContext, useEffect, useState } from 'react'
import Text from './Text'
import Button from './Button'
import CartContext from '../context/CartContext'
import Box from './Box'

// contador del carrito modal
function Counter({prod, 
      color = "primary", 
      variant = "solid",
      onClick,
      ...props }) {

    const {cartModif, shoppCart} = useContext(CartContext)
    const [contador, setContador] = useState(0)

    const prodEncontrado = shoppCart.find(obj => obj.prod._id === prod._id)
    
    const increment = () => {
        setContador(contador + 1)
        cartModif(prod, contador + 1)
    }

    const decrement = () => {
        setContador(contador - 1)
        cartModif(prod, contador - 1)
    }
    
    useEffect(() => {
      setContador(prod.quantity)
    }, [shoppCart])
    

  return (
    <>
      <Box className="d-flex">
        <Button id="resta" label="-" onClick={decrement} disabled={contador === 0}  color={color} variant={variant} />
        <Text as="span" className="d-flex pr-2 pl-1 aic" > {contador}  </Text> 
        <Button label="+" id="suma" onClick={increment} color={color} variant={variant} />
      </Box>
  </>
  )
}

export default Counter
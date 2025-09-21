import React, { useContext, useEffect, useState } from 'react'
// contador  para agregar el producto al carrito y eliminarlo del mismo
import Button from './Button'
import CartContext from '../context/CartContext'
import Box from './Box'
import { faTrash, faTrashCan } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
// contador para el producto, agrega y se desactiva, permite eliminacion
function CounterAdd(prod) { // prod = { aa=xx, bb=xx, ...}
    const { cartModif , shoppCart  } = useContext(CartContext)
    const [contador, setContador] = useState(0)
    const [addMessage, setaddMessage] = useState("")
    const prodEncontrado = shoppCart.find(obj => obj.prod._id === prod.prod._id)  
    
    useEffect(() => {
      
     if (prodEncontrado?.quantity !== contador){
          setContador(prodEncontrado?.quantity || 0)
   
      }
     
    }, [shoppCart])
        
    useEffect(() => {
        if (!contador)
        {
          setaddMessage("")
        }
    }, [contador])
    

  const increment = () => {
        
          setContador(contador + 1)
          cartModif(prod, contador + 1)
          setaddMessage("Agregado al Carrito")
      }

  const deleteItem = () => {
          setContador(contador - contador)
          cartModif(prod, 0)
          setaddMessage("")
      }


  return (
    <>
      <Box >
      {
        (contador == 0) ? 
         <Button label="Agregar al Carrito" 
            id="suma"
              onClick={increment}
              disabled={contador > 0} 
          />
          :
           <span  className='cart-message d-flex  mt-1' >
            {addMessage}{(addMessage)
             && 
             (<span className='deleteItem ml-3'><FontAwesomeIcon role='button' icon={faTrashCan} onClick={deleteItem} /></span>)}</span>

        
      }
      </Box>
  </>
  )
}

export default CounterAdd
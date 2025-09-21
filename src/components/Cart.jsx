import React, { useContext, useEffect, useState } from 'react'
// inicio MP con la public key de prueba
import { initMercadoPago, Wallet } from '@mercadopago/sdk-react'




import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCartFlatbedSuitcase, faCartPlus, faShoppingCart } from '@fortawesome/free-solid-svg-icons'
import CartContext from '../context/CartContext'
import Modal from './Modal'
import Text from './Text'
import Counter from './Counter'
import Box from './Box'
import Button from './Button'
import { postCart } from '../utils/apiMongo'
import MensajeEnvio from '../components/MensajeEnvio'

function Cart() {
const [showModal, setShowModal] = useState(false)
const {shoppCart, resetCart} = useContext(CartContext)
const [cantidadTotal, setTotal] = useState(0)
const [shoppCartApi, setshoppCartApi] = useState(0)

// para el componente MensajeEnvio
const [mostrarMensaje, setMostrarMensaje] = useState(false)
const [enviado, setEnviado] = useState("")
const [msg, setMsg] = useState("")


  const okMessage = (estado) => {
    setEnviado(estado) // declaro si fue exito o no
    setMostrarMensaje(true) // muestro mensaje
  }
   
  const costoTotal = shoppCart.reduce( // acumulador, primer parametro acc acumula, prod es el objeto a sumarizar
    (acc, prod) => acc + prod.quantity * prod.prod.amount, 0 // 0  es el indice inicial
    // esto sería el subtotal por producto
  )
  
 useEffect(() => {
      if (mostrarMensaje) {
        // si true timeout para que desaparezca en 3 segundos
            const timer = setTimeout(() => setMostrarMensaje(false), 3000);
            return () => clearTimeout(timer); 
        }
    }, [mostrarMensaje])

    useEffect(() => {
      // cuando agregan o quitan elementos del carrito regenero subtotal
        setTotal ( shoppCart.reduce(
            (acc, prod) => acc + prod.quantity, 0)
        )
        
        setshoppCartApi( 
            {
              //creo un json cart con el array de productos
                cart: shoppCart.map( obj =>
                   ({
                     _id: obj.prod._id, 
                    quantity: obj.quantity}) ) 
            }
        )
       
    }, [shoppCart])

    const confirmCart = () => {
      console.info(shoppCartApi)
      try {

        postCart(shoppCartApi)
         .then( res => {
                  console.log("RES->", res)
                if (res.ok)
                {
                    // mensaje de unos segundos
                    setMsg("Compra enviada ok")
                    okMessage(true)
                    
                    resetCart()
                }
          })
      } catch (error) {
        console.error("ERROR AL PROCESAR CARRITO:", error)
        setMsg("Se ha producido un error al guardar los datos")
        okMessage(false)
      }
      
      
    }


  return (
   <>
      <div className='cart__container' >
        {
          (cantidadTotal > 0) && (<div className="cart__badge" role='button' onClick={() => setShowModal(true)}   >{cantidadTotal}</div>)
          }
          <FontAwesomeIcon icon={faShoppingCart} className='faShopping' color='cian'  size="xl"/>
      </div>
      
      <Modal showModal={showModal} closeModal={() => setShowModal(false)} >
       

        <div className=''>
          <div className='rotulo'>
            <Text as="span" >Producto</Text>
            <Text as="span"  className="">Cantidad</Text>

            <Text as="span"  > Precio x U</Text>
            <Text as="span" className="mr-4"  >Subtotal </Text>
          </div>
          {
            shoppCart.map(
              (obj) =>
                <div key={obj.prod.id} className='d-flex align-center  p-0 pb-0 pt-0 ml-2'>

                    <img src={obj.prod.img} className='modal-image mr-2' />
                   
                    <Text as="h4"  className="d-flex w-100 jcss ml-2"  >{obj.prod.name}</Text>
                    <Counter prod={obj}  className="d-flex jcfe ml-4 " color="secondary" variant="outline"  />
                    <Text as="span"   className="d-flex  w-100 jcsa"  > {`$ ${obj.prod.amount}`}</Text>
                    <Text as="span"   className="d-flex  w-100 jcsa "  > {`$ ${obj.prod.amount * obj.quantity}`} </Text>
                </div>
            )

          }
              <hr />
            
              <div>
                {(mostrarMensaje) && <MensajeEnvio enviado={enviado} msg={msg} />}
                  {(costoTotal > 0) ? (
                    <Box className="cart__summary">
                      <Text as="span"  className="d-flex" >Total: </Text> 
                      <Text as="span"  className="d-flex" > {`$ ${costoTotal}`} </Text> 
                    </Box>) : <Text className="d-flex jcc w-100" as="h4" > No hay productos en el carrito  </Text>}
                      
              </div>
        </div>
        <div className='confirm__container d-flex jcc'>
          {
            // se muestra solo si hay productos
             (costoTotal > 0) && (  <Button className="btn btn__primary btn__solid mb-3" onClick={confirmCart} label='Confirmar Compra'  disabled={(costoTotal == 0)}  /> )
          }
        </div>
      </Modal>

    </>
     
  )
 
}

export default Cart
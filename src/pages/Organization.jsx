import React, { useContext, useEffect, useState } from 'react'
import { useParams } from 'react-router'
import MkContext from '../context/Context'

import Box from '../components/Box'

function Organization() {
  const {orgs} = useContext(MkContext)
  const [loading, setLoading] = useState(true)
  const [org, setOrg] = useState({})

  const { id } = useParams() // leo el id que viene por el get que manda el card
  console.log("PRODUCTDETAILS: ", id)
  useEffect(() => {
    // consulta original
   // setProducto(  products.filter(prod => parseInt(prod._id) == parseInt(id))[0]  )
    // consulta con api
    setLoading(true)
    getProductById(id)
        .then((res) => {
          console.log("RESP API", res)
          setLoading(false)
          setProducto(res)
          
        })
        .catch((error) => console.error("error al obtener producto: ", error))

  }, [])
  
   if (loading) {
    return <div>Cargando producto...</div>
  }

  if (!producto) {
    return <div>Producto no encontrado</div>
  }
  return (
    <Box style={{ display: 'flex', gap: '20px', padding: '20px' }}>
      <div style={{ flex: 1 }}>
        <h1>{producto.name}</h1>
        <p><strong>Precio:</strong> ${producto.amount}</p>
        <p><strong>Descripción:</strong> {producto.description}</p>
        <p><strong>Categoría:</strong> {producto.category}</p>
        <p><strong>Marca:</strong> {producto.brand}</p>
        <p><strong>Stock:</strong> {producto.stock} unidades</p>
        <p><strong>Edad:</strong> {producto.ageFrom} - {producto.ageTo} años</p>
        <p><strong>Envío gratis:</strong> {producto.freeDelivery ? 'Sí' : 'No'}</p>
        <h3>Descripción completa:</h3>
        <p>{producto.largeDescription}</p>
 
       
    </div>
    <div style={{ flex: 1 }}>
       <img 
          src={producto.img} 
          alt={producto.name}
          style={{ 
            width: '100%', 
            maxWidth: '400px',
            height: 'auto',
            border: '1px solid #ddd'
          }}
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/400x400?text=Sin+imagen'
          }}
        />
      </div>
    </Box>

  )
}

export default Organization
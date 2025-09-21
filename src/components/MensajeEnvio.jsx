import React, { useEffect, useState } from 'react'
import Box from './Box'

function MensajeEnvio({
    enviado,
    msg
    
}) {

    const [clase, setClase] = useState("")
        const [mensaje, setMessage] = useState("")
   
    useEffect(() => {
                (enviado == 1) ? setClase("okMessage") : setClase("errorMessage")
              if (enviado == 1)
              {
                 setMessage(msg)
              }
              else{
                  setMessage(msg)

              }

    }, [enviado])
    
  return (
            <Box as="span" 
            className={`${clase} ${(mensaje !== "") ? 
                "mostrar" : 
                "ocultar"} d-flex asc`} >
                    {mensaje}
                    </Box>
  )
}

export default MensajeEnvio
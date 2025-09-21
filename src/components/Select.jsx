import React, { useEffect, useState } from 'react'
import Text from './Text'

function Select({label, onChange, onBlur, name, from , to, step=1}, values) {
    //objeto select solo numerico
    const [opciones, setOpciones] = useState([])

    useEffect(() => {
        const array = [];
        for (let i = from; i < to; i += step) {
        array.push(i);
        }
        setOpciones(array);
    }, [from, to, step]); 
      
  
  return (
    <>
        <Text as="label" htmlFor={name}>{label}</Text>
        <select name={name} id={name}  onBlur={onBlur}>
            <option value="0">-- Elegí una opción --</option>
            {
                (opciones) &&
                opciones.map(opc => (
                  
                    <option key={opc} value={opc}  > {opc} </option>
                ) )
            }
 
        </select>
    </>
  )
}

export default Select
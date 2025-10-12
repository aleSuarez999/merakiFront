
import Text from '../components/Text'

import { useContext, useEffect, useState } from 'react'

import Box from '../components/Box'
import Context from '../context/Context'

import CardDevices from '../components/CardDevices'

export default function Devices() {
  const [loading, setLoading] = useState(true)
 
  //const {orgs, networks} = useContext(Context)
  const orgs = useContext(Context)
// acordeon con uplinks caidos //



/////////////////////////////////

  useEffect(() => {
  // setLoading(true)
    
  }, [])


  if (loading) {
    //return <div>Cargando productos...</div>
  }
  
  return (
    
      <>    
     
      <div className='org__grid' >
        {orgs && orgs.map(data => (
          <Box key={`B${data.id}`} id={`B${data.id}`} className="col-xs-12 col-sm-6 col-lg-4 col-xl-3 col-xxl-2 ">
            <CardDevices {...data} org={data} onClick={() => toggleAccordion(data.id, 1)} />
            
          </Box>
        ))}
      </div>
      </>

    
  )
}

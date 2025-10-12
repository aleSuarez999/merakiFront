

import { useContext, useEffect, useState } from 'react'

import Box from '../components/Box'
import Context from '../context/Context'
import CardUplink from '../components/CardUplink'

export default function Uplinks() {
  const [loading, setLoading] = useState(true)
 
  //const {orgs, networks} = useContext(Context)
  const orgs = useContext(Context)
// acordeon con uplinks caidos //
 
const context = useContext(Context);
console.log(context)


 
/////////////////////////////////

  useEffect(() => {
  // setLoading(true)
    console.log("entro a uplinks")
    console.log(orgs)
  }, [orgs])


  if (loading) {
    //return <div>Cargando productos...</div>
  }
  
  return (
    
      <>    
     
      <div className='org__grid' >
        {orgs && orgs.map(data => (
          <Box key={`B${data.id}`} id={`B${data.id}`} className="col-xs-12 col-sm-6 col-lg-4 col-xl-3 col-xxl-2 ">
            <CardUplink {...data} org={data}  />
            
          </Box>
        ))}
      </div>
      </>

    
  )
}

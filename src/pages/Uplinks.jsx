

import { useContext, useEffect, useState } from 'react'

import Box from '../components/Box'
import Context from '../context/Context'
import CardUplink from '../components/CardUplink'

export default function Uplinks() {
  const [loading, setLoading] = useState(true)
 
  const orgs = useContext(Context)
 
  const context = useContext(Context);
/* sin uso
  useEffect(() => {

  }, [orgs])
*/
/*
  useEffect(() => {
    console.log(orgs)
    if (orgs.length > 0) {
      setLoading(false);
      console.log("Uplinks actualizados:", orgs.map(o => o.uplinks));
    }
  }, [orgs]);
*/
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

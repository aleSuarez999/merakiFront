
import Text from '../components/Text'
import Card from '../components/Card'
import { useContext, useEffect, useState } from 'react'

import Box from '../components/Box'
import Context from '../context/Context'

export default function DashBoard() {
  const [loading, setLoading] = useState(true)
  const orgs = useContext(Context)
  
  useEffect(() => {
  // setLoading(true)
    
    
  }, [])


  if (loading) {
    //return <div>Cargando productos...</div>
  }
  

  return (
    
      <>    
     
        <div className='org__grid'>
        {
            orgs && orgs.map(data => 
              <Box key={`B${data.id}`} id={`B${data.id}`} className="col-xs-12 col-sm-6 col-lg-4 col-xl-3">
                <Card  {...data} org={data} />
              </Box>
            )
        }
          </div>
      </>

    
  )
}


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
  
  if (orgs.length > 0)
  {
    //console.log(orgs)  
    //setLoading(false)
  }

  if (loading) {
    //return <div>Cargando productos...</div>
  }
  

  return (
    
      <>    
        <Text as="h2" >Organizaciones</Text>
        
        <div className='org__grid'>
        {
            orgs.map(data => 
              <Box key={`B${data._id}`} id={`B${data._id}`} className="col-xs-12 col-sm-6 col-lg-4 col-xl-3">
                <Card  {...data} prod={data} />
              </Box>
            )
        }
          </div>
      </>

    
  )
}

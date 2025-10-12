
import Text from '../components/Text'
import Card from '../components/Card'
import { useContext, useState } from 'react'

import Box from '../components/Box'
import Context from '../context/Context'

export default function DashBoard() {
  const [loading, setLoading] = useState(true)
 
  //const {orgs, networks} = useContext(Context)
  const orgs = useContext(Context)
  //const context = useContext(Context);

// acordeon con uplinks caidos //
 

return (
      <>    
     
      <div className='org__grid' >
        {orgs && orgs.map(data => (
          <Box key={`B${data.id}`} id={`B${data.id}`} className="col-xs-12 col-sm-6 col-lg-4 col-xl-3 col-xxl-2 ">
            <Card {...data} org={data} onClick={() => toggleAccordion(data.id, 1)} />
            
       
          </Box>
        ))}
      </div>
      </>

    
  )
}

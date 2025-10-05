
import Text from '../components/Text'
import Card from '../components/Card'
import { useContext, useEffect, useState } from 'react'

import Box from '../components/Box'
import Context from '../context/Context'
import ApplianceStatus from './ApplianceStatus'

export default function DashBoard() {
  const [loading, setLoading] = useState(true)
 
  const orgs = useContext(Context)
// acordeon con uplinks caidos //
  const [expandedOrgId, setExpandedOrgId] = useState(null);

  const toggleAccordion = (id) => {
    if (id === 0)
      setExpandedOrgId(null);
    else  
      setExpandedOrgId(prev => (prev === id ? null : id));
  };
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
            <Card {...data} org={data} onClick={() => toggleAccordion(data.id, 1)} />
            
            {expandedOrgId === data.id && (
              <div className="accordion-content" onClick={() => toggleAccordion(0)}>
                <ApplianceStatus orgId={data.id} />
              </div>
            )}
          </Box>
        ))}
      </div>
      </>

    
  )
}

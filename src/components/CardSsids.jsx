import { useNavigate } from 'react-router'

import Box from './Box';

function CardSsids({
    ssids,
    selectedData,
    isSelected,
    onClick,
    ...props

}) {


   useEffect(() => {
      const fetchSsids = async () => {
        const res = await getNetworkSsids(networkId);
        setnetworkSsids(res);
        setLoading(false);
      };
      fetchSsids();
    }, [networkId]);

  const navigate = useNavigate();

  return (
      
         
          <Box className="card__ssids__body" onClick={onClick}>

           
              {
              (ssids) && (
                    
                    <Box key={ssids.interfaceId} className="vlan_container">
                      <h5>Id: {ssids.id} VlanName: - {ssids.name}</h5>  
                      <ul>
                        <li><input
                      type="text"
                      value={isSelected ? selectedData.applianceIp : vlassidsns.applianceIp}
                      onChange={(e) => updateVlanField(ssids.id, 'applianceIp', e.target.value)}
                      disabled={!isSelected}
                    /></li>
                        <li><input
                      type="text"
                      value={isSelected ? selectedData.subnet : ssids.subnet}
                      onChange={(e) => updateVlanField(ssids.id, 'subnet', e.target.value)}
                      disabled={!isSelected}
                    /></li>
                      </ul>
                    </Box>
              
                )              
           }
          </Box>
    
  )
}

export default CardSsids
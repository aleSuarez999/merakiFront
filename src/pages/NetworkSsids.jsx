import { useEffect, useState } from "react";
import { getNetworkSsids } from "../utils/api";
import { useParams } from "react-router";
import SelectNetwork from "../components/SelectNetwork";


function NetworkSsdis() {

  const [networkSsid, setNetworkSsid] = useState([])

  const { networkId } = useParams();

  useEffect(() => {

    const fetchSSids = async () => {
      try {
        const response = await getNetworkSsids(networkId)
        console.log(response.data)
        return response.data
      } catch (error) {
        console.log(error.message)
      }
      return 
    } 


    fetchSSids()


  }, [networkId])
  

      useEffect(() => {
        
        if (selectedNetwork) {
    
          const fetchVlans = async () => {
          const res = await getNetworkVlans(selectedNetwork);
          setDstVlans(res);
          setLoading(false);
        };
        fetchVlans();
      }
        else{
          setDstVlans([])
        }
        
      }, [selectedNetwork])

  return (
    <div>NetworkSsdis
      <SelectNetwork  />

    </div>
  )


}

export default NetworkSsdis
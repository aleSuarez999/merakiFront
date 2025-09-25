import { useState } from 'react'
import Text from '../components/Text'
import { NavLink } from 'react-router'
import Box from '../components/Box'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBars } from '@fortawesome/free-solid-svg-icons'
import Button from '../components/Button'
import brandImage from "../assets/react.svg"

function Navbar() {

  return (
       <Box className="navbar__container" >
        
             <img src={brandImage} height="55"  />
            <NavLink to="/" >
               
                <Text as="h2" >Meraki Dashboard</Text>
            </NavLink>
            <Box as="nav">

                <NavLink to="/Item" ></NavLink>
                <NavLink to="/Item" ></NavLink>
                <NavLink to="/Contacto" ></NavLink>

                <NavLink> </NavLink>
            </Box>
            
        </Box>
    
  )
}

export default Navbar
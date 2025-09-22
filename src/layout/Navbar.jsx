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
               
                <Text as="h1" > Dashboard</Text>
            </NavLink>
            <Box as="nav">

                <NavLink to="/Contacto" >Contacto</NavLink>
                <NavLink to="/Nosotros" >Nosotros</NavLink>
                <NavLink to="/Alta" >Alta</NavLink>
                <NavLink to="/MensajesRecibidos" >Mensajes</NavLink>
                <NavLink> </NavLink>
            </Box>
            <Box  className="navbar__menu-mobile">
              <NavLink> </NavLink>
              <Button 
               className="btn btn__primary btn__solid navbar__menu-button" 
               label={<FontAwesomeIcon icon={faBars} size='xl' />} 
               onClick={() => setopenMenuDrawer(true)}
               />
                
            </Box>
        </Box>
    
  )
}

export default Navbar
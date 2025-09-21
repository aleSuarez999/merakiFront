import React, { useState } from 'react'
import Text from './Text'
import { NavLink } from 'react-router'
import Cart from './Cart'
import Box from './Box'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBars } from '@fortawesome/free-solid-svg-icons'
import Button from './Button'
import DrawerMenu from './DrawerMenu'
import Aside from './Aside'
import brandImage from "../assets/logo.png"

function Navbar() {

  const [openMenuDrawer, setopenMenuDrawer] = useState(false)

  return (
        <>
          <div>
            <img src={brandImage} height="55"  />
            <NavLink to="/" >
               
                <Text as="h1" > Juguetería Cósmica</Text>
            </NavLink>
            <Box as="nav">

                <NavLink to="/Contacto" >Contacto</NavLink>
                <NavLink to="/Nosotros" >Nosotros</NavLink>
                <NavLink to="/Alta" >Alta</NavLink>
                <NavLink to="/MensajesRecibidos" >Mensajes</NavLink>
                <NavLink> <Cart /></NavLink>
            </Box>
            <Box  className="navbar__menu-mobile">
              <NavLink> <Cart /></NavLink>
              <Button 
               className="btn btn__primary btn__solid navbar__menu-button" 
               label={<FontAwesomeIcon icon={faBars} size='xl' />} 
               onClick={() => setopenMenuDrawer(true)}
               />
                
            </Box>
        </div>
    </>
  )
}

export default Navbar
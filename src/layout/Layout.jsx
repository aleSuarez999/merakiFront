import React from 'react'

import Footer from './Footer'
import { Outlet } from 'react-router'
import Aside from '../components/Aside'
import Container from '../components/Container'
import Header from './Header'

function Layout() {
  return (
    <>
      <Header />        
        <Aside />
          <Container>
          { <Outlet /> }
          </Container>
        <Footer />
    </>
  )
}

export default Layout
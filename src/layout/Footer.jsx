import React from 'react'
import Box from '../components/Box'
import Text from '../components/Text'

const APP_VERSION = '1.0.0'

function Footer() {
  return (
    <footer className='footer__content'>
      <div className='footer__container'>
        <Text as="p">OSPT &mdash; Dashboard Meraki &mdash; v{APP_VERSION}</Text>
      </div>
    </footer>
  )
}

export default Footer

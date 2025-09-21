import React from 'react'
import { createPortal } from 'react-dom'
import Button from './Button'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faClose } from '@fortawesome/free-solid-svg-icons'

function DrawerMenu({
    show,
    closeMenu,
    children
}) {
    return (
        show ? (
            createPortal(
                <div className='drawer__container' role='button' onClick={closeMenu} >
                    <div className='drawer__content' onClick={e => e.stopPropagation()} >
                        <Button className="drawer__close" onClick={closeMenu} value="Cerrar" label={<FontAwesomeIcon icon={faClose} size='xl' />}  />
                            
                        
                        {children}
                    </div>
                </div>,
                document.body
            )
        ) : undefined
    )
}

export default DrawerMenu
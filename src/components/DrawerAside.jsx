import React from 'react'
import { createPortal } from 'react-dom'
import Button from './Button'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faClose } from '@fortawesome/free-solid-svg-icons'

function DrawerAside({
    show,
    closeAside,
    children
}) {
    return (
        show ? (
            createPortal(
                <div className='drawer__aside__container' role='button' onClick={closeAside} >
                    <div className='drawer__aside__content' onClick={e => e.stopPropagation()} >
                        <Button className="drawer__aside__close" onClick={closeAside} value="Cerrar" label={<FontAwesomeIcon icon={faClose} size='xl' />}  />
                        
                        {children}
                    </div>
                </div>,
                document.body
            )
        ) : undefined
    )
}

export default DrawerAside
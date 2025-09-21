import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import Button from './Button'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faClose } from '@fortawesome/free-solid-svg-icons'

function Modal({
    showModal,
    closeModal,
    children
}) {
    /*cierra con escape*/
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
            closeModal();
            }
        };

        if (showModal) {
            document.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [showModal, closeModal]); 


    return (
        showModal ? (
            createPortal(
                <div className='modal__container' role='button' onClick={closeModal} onScroll={e => e.stopPropagation()}>
                    <div className='modal__content' onClick={e => e.stopPropagation()} >
                        <Button  onClick={closeModal} value="Cerrar" label={<FontAwesomeIcon icon={faClose} />}  />
                            
                        
                        {children}
                    </div>
                </div>,
                document.body
            )
        ) : undefined
    )
}

export default Modal
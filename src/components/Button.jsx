import React from 'react'
function Button({
      label = "", 
      color = "primary", 
      variant = "solid",
      onClick,
      ...props 
                })
{
  return (
    <button className={ `btn btn__${color} btn__${variant}`}  
      onClick={onClick} 
      {...props}
    >
        {label}
    </button>
  )
}

export default Button
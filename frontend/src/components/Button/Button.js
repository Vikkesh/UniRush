import React from 'react'
import classes from './button.module.css'

export default function Button({
  type = 'button',
  text = 'Submit',
  onClick,
  color = '#009e84',
  backgroundColor = 'var(--secondary-color)',
  width = '12rem',
  height,
  disabled = false
  }) {
  
  // Create style object, but exclude width if it's "100%" to let CSS handle it
  const buttonStyle = {
    color,
    backgroundColor,
    ...(width !== "100%" && { width }), // Only apply width if it's not "100%"
    ...(height && { height })
  };

  return (
    <div className={classes.container} style={width === "100%" ? { width: "100%" } : {}}>
    <button
      style={buttonStyle}
      type={type}
      onClick={onClick}
      disabled={disabled}
    >
      {text}
    </button>
  </div>
  )
}

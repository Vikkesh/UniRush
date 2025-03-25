import React from 'react'
import classes from './button.module.css'

export default function Button({
  type = 'button',
  text = 'Submit',
  onClick,
  color = 'white',
  backgroundColor = '#e72929',
  width = '12rem',
  }) {
  return (
    <div className={classes.container}>
    <button
      style={{
        color,
        backgroundColor,
        width,
      }}
      type={type}
      onClick={onClick}
    >
      {text}
    </button>
  </div>
  )
}

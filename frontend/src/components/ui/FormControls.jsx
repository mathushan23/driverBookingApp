import { motion } from 'framer-motion'
import { useMemo } from 'react'

export function FormHeader({ title, subtitle }) {
  return (
    <header className="form-header">
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </header>
  )
}

export function Input({ label, type = 'text', value, onChange, placeholder }) {
  const id = useMemo(() => label.toLowerCase().replaceAll(' ', '-'), [label])

  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder || `Enter your ${label.toLowerCase()}`}
        onChange={(event) => onChange(event.target.value)}
        required
      />
    </label>
  )
}

export function Button({ label, disabled = false }) {
  return (
    <motion.button
      className="primary-button"
      type="submit"
      disabled={disabled}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      {label}
    </motion.button>
  )
}

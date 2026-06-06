import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthShell } from '../components/layout/AuthShell'
import { Button, FormHeader, Input } from '../components/ui/FormControls'

export function SignupPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')

  const submit = (event) => {
    event.preventDefault()
    if (form.password !== form.confirmPassword) {
      setError('Passwords must match.')
      return
    }

    localStorage.setItem(
      'goride:registered',
      JSON.stringify({
        email: form.email,
        name: form.name,
        role: null,
        token: 'demo-user-token',
        onboardingComplete: false,
      }),
    )

    setError('')
    navigate('/login')
  }

  return (
    <AuthShell mode="signup">
      <FormHeader title="Join GoRide" subtitle="Create your account and choose how you want to travel or drive." />
      <form className="auth-form" onSubmit={submit}>
        <Input label="Full Name" value={form.name} onChange={(name) => setForm({ ...form, name })} />
        <Input label="Email Address" type="email" value={form.email} onChange={(email) => setForm({ ...form, email })} />
        <Input label="Password" type="password" value={form.password} onChange={(password) => setForm({ ...form, password })} />
        <Input
          label="Confirm Password"
          type="password"
          value={form.confirmPassword}
          onChange={(confirmPassword) => setForm({ ...form, confirmPassword })}
        />
        {error && <p className="form-error">{error}</p>}
        <Button label="Create GoRide Account" />
      </form>
      <p className="auth-switch">
        Already part of GoRide? <Link to="/login">Sign in instead</Link>
      </p>
    </AuthShell>
  )
}

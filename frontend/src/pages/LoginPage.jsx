import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthShell } from '../components/layout/AuthShell'
import { Button, FormHeader, Input } from '../components/ui/FormControls'
import { adminUser } from '../data/gorideData'
import { api } from '../services/api'

export function LoginPage({ saveUser }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '', remember: true })
  const [loading, setLoading] = useState(false)

  const submit = (event) => {
    event.preventDefault()
    setLoading(true)

    const registered = JSON.parse(localStorage.getItem('goride:registered') || 'null')
    const nextUser =
      form.email.toLowerCase() === adminUser.email
        ? adminUser
        : registered || {
            email: form.email,
            name: form.email.split('@')[0] || 'GoRide User',
            role: null,
            token: 'demo-user-token',
            onboardingComplete: false,
          }

    api.defaults.headers.common.Authorization = `Bearer ${nextUser.token}`
    saveUser(nextUser)
    setLoading(false)
    navigate(nextUser.role === 'admin' ? '/dashboard' : '/onboarding')
  }

  return (
    <AuthShell mode="login">
      <FormHeader title="Welcome Back" subtitle="Access your rides, routes, and bookings with GoRide." />
      <form className="auth-form" onSubmit={submit}>
        <Input label="Email Address" type="email" value={form.email} onChange={(email) => setForm({ ...form, email })} />
        <Input label="Password" type="password" value={form.password} onChange={(password) => setForm({ ...form, password })} />
        <div className="form-row">
          <label className="checkbox">
            <input
              type="checkbox"
              checked={form.remember}
              onChange={(event) => setForm({ ...form, remember: event.target.checked })}
            />
            Remember Me
          </label>
          <a href="#forgot">Forgot Password</a>
        </div>
        <Button label={loading ? 'Signing in...' : 'Start Riding'} disabled={loading} />
      </form>
      <p className="auth-switch">
        New passenger or driver? <Link to="/signup">Create your GoRide account</Link>
      </p>
    </AuthShell>
  )
}

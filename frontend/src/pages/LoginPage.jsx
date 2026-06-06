import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthShell } from '../components/layout/AuthShell'
import { Button, FormHeader, Input } from '../components/ui/FormControls'
import { api } from '../services/api'

export function LoginPage({ saveUser }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '', remember: true })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data: nextUser } = await api.post('/auth/login', {
        email: form.email,
        password: form.password,
      })

      api.defaults.headers.common.Authorization = `Bearer ${nextUser.token}`
      saveUser(nextUser)
      navigate(nextUser.role === 'admin' ? '/dashboard' : '/onboarding')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Login failed. Check your email and password.')
    } finally {
      setLoading(false)
    }
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
        {error && <p className="form-error">{error}</p>}
        <Button label={loading ? 'Signing in...' : 'Start Riding'} disabled={loading} />
      </form>
      <p className="auth-switch">
        New passenger or driver? <Link to="/signup">Create your GoRide account</Link>
      </p>
    </AuthShell>
  )
}

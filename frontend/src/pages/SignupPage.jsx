import { Link, useNavigate } from 'react-router-dom'
import { AuthShell } from '../components/layout/AuthShell'
import { Button, FormHeader, Input } from '../components/ui/FormControls'
import { api } from '../services/api'
import { clearAuthSession } from '../services/authStorage'
import { useState } from 'react'

export function SignupPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    if (form.password !== form.confirmPassword) {
      setError('Passwords must match.')
      return
    }

    setLoading(true)
    setError('')

    try {
      await api.post('/auth/signup', {
        name: form.name,
        email: form.email,
        password: form.password,
      })
      clearAuthSession()
      navigate('/login', { replace: true, state: { message: 'Account created. Login to continue.' } })
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Signup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell mode="signup">
      <FormHeader title="Create Account" subtitle="Fill in your details to continue." />
      <form className="auth-form" onSubmit={submit}>
        <Input label="Full Name" value={form.name} onChange={(name) => setForm({ ...form, name })} />
        <Input label="Email Address" type="email" value={form.email} onChange={(email) => setForm({ ...form, email })} />
        <Input label="Password" type="password" value={form.password} onChange={(password) => setForm({ ...form, password })} />
        <Input label="Confirm Password" type="password" value={form.confirmPassword} onChange={(confirmPassword) => setForm({ ...form, confirmPassword })} />
        {error && <p className="form-error">{error}</p>}
        <Button label={loading ? 'Creating account...' : 'Create Account'} disabled={loading} />
      </form>
      <p className="auth-switch">
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </AuthShell>
  )
}

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { BackgroundFX } from '../../components/auth/AuthLayout'
import { LocationPicker } from '../../components/location/LocationPicker'
import { api } from '../../services/api'
import { setAuthSession } from '../../services/authStorage'

const statuses = ['AVAILABLE', 'BUSY', 'OFFLINE']

export function DriverDashboard({ user, logout }) {
  const [status, setStatus] = useState('AVAILABLE')
  const [driverLocation, setDriverLocation] = useState({
    address: user?.address || '',
    lat: user?.latitude || null,
    lng: user?.longitude || null,
  })
  const [savedAddress, setSavedAddress] = useState(user?.address || 'No location saved yet')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [requests, setRequests] = useState([])
  const [loadingRequests, setLoadingRequests] = useState(false)

  const loadRequests = async () => {
    if (!user?.id) return
    setLoadingRequests(true)
    try {
      const { data } = await api.get(`/bookings/driver-requests/${user.id}`)
      setRequests(data)
    } catch {
      setRequests([])
    } finally {
      setLoadingRequests(false)
    }
  }

  useEffect(() => {
    loadRequests()
    const timer = setInterval(loadRequests, 5000)
    return () => clearInterval(timer)
  }, [user?.id])

  const saveLocation = async () => {
    setMessage('')
    setError('')

    if (!driverLocation.lat || !driverLocation.lng) {
      setError('Please choose a location using suggestions, GPS, or map before saving.')
      return
    }

    setSaving(true)
    try {
      const { data: updatedUser } = await api.patch(`/users/${user.id}/driver-location`, {
        latitude: driverLocation.lat,
        longitude: driverLocation.lng,
        address: driverLocation.address,
      })
      setAuthSession(updatedUser)
      setSavedAddress(updatedUser.address)
      setMessage('Driver location saved successfully.')
      loadRequests()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not save driver location.')
    } finally {
      setSaving(false)
    }
  }

  const acceptRide = async (bookingId) => {
    setMessage('')
    setError('')
    try {
      await api.patch(`/bookings/${bookingId}/accept`, null, { params: { driverId: user.id } })
      setMessage('Ride accepted. The rider has been notified.')
      loadRequests()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not accept this ride.')
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-6 text-white">
      <BackgroundFX />
      <section className="relative z-10 mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col gap-4 rounded-[2rem] border border-white/15 bg-white/10 p-5 shadow-2xl shadow-blue-950/40 backdrop-blur-2xl sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.35em] text-blue-300">driver control center</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">Driver Dashboard</h1>
            <p className="mt-2 text-blue-100/75">Welcome {user?.name || 'Driver'}, manage availability, assigned rides, and current map location.</p>
          </div>
          <button onClick={logout} className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-black text-blue-100 hover:bg-white/15">Logout</button>
        </header>

        <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
          <div className="space-y-5">
            <section className="rounded-[2rem] border border-white/15 bg-white/10 p-5 shadow-2xl shadow-blue-950/30 backdrop-blur-xl">
              <h2 className="text-2xl font-black">Availability Status</h2>
              <div className="mt-5 grid gap-3">
                {statuses.map((item) => (
                  <motion.button
                    key={item}
                    type="button"
                    onClick={() => setStatus(item)}
                    whileHover={{ x: 5 }}
                    className={`rounded-2xl border px-4 py-4 text-left font-black transition ${status === item ? 'border-blue-300 bg-blue-500/25 text-white shadow-lg shadow-blue-500/20' : 'border-white/15 bg-white/10 text-blue-100 hover:border-blue-300/50'}`}
                  >
                    {item}
                  </motion.button>
                ))}
              </div>
              <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <p className="text-sm text-blue-100/70">Current status</p>
                <p className="mt-1 text-3xl font-black text-blue-300">{status}</p>
              </div>
            </section>

            <section className="rounded-[2rem] border border-white/15 bg-white/10 p-5 shadow-2xl shadow-blue-950/30 backdrop-blur-xl">
              <h2 className="text-2xl font-black">My Current Location</h2>
              <p className="mt-2 rounded-2xl border border-white/10 bg-slate-950/40 p-3 text-sm text-blue-100/75">{savedAddress}</p>
              <div className="mt-4">
                <LocationPicker label="Current Driver Location" value={driverLocation} allowCurrentLocation onChange={setDriverLocation} />
              </div>
              {message && <p className="mt-4 rounded-2xl border border-emerald-300/30 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-100">{message}</p>}
              {error && <p className="mt-4 rounded-2xl border border-red-300/30 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-100">{error}</p>}
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button type="button" onClick={() => setSavedAddress(driverLocation.address || savedAddress)} className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-black text-blue-100 hover:bg-white/15">Update Location</button>
                <button type="button" onClick={saveLocation} disabled={saving} className="primary-action">{saving ? 'Saving...' : 'Save Location'}</button>
              </div>
            </section>
          </div>

          <section className="rounded-[2rem] border border-white/15 bg-white/10 p-5 shadow-2xl shadow-blue-950/30 backdrop-blur-xl">
            <h2 className="text-2xl font-black">Assigned Ride Requests</h2>
            <p className="mt-2 text-sm text-blue-100/70">Only pending rides within 5 km of your saved current location appear here.</p>
            <div className="mt-5 grid gap-4">
              {loadingRequests && <p className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm font-bold text-blue-100">Checking nearby ride requests...</p>}
              {!loadingRequests && requests.length === 0 && <p className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm font-bold text-blue-100">No nearby pending ride requests. Save your current location to receive rides near you.</p>}
              {requests.map((request, index) => (
                <motion.article key={request.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }} className="rounded-2xl border border-white/10 bg-white/10 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-lg font-black">Booking #{request.id}</p>
                      <p className="mt-1 text-sm text-blue-100/70">{request.pickupAddress}</p>
                      <p className="mt-1 text-sm text-blue-100/70">to {request.dropAddress}</p>
                    </div>
                    <div className="font-black text-blue-300">{formatVehicleType(request.vehicleType)}</div>
                  </div>
                  <div className="mt-4 flex gap-3">
                    <button onClick={() => acceptRide(request.id)} className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-black text-white hover:bg-blue-400">Accept</button>
                    <button className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-black text-blue-100 hover:bg-white/15">Decline</button>
                  </div>
                </motion.article>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  )
}

function formatVehicleType(type = '') {
  if (type === 'motor bike') return 'Motor Bike'
  if (type === 'three wheeler') return 'Three Wheeler'
  return type.charAt(0).toUpperCase() + type.slice(1)
}

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { BackgroundFX } from '../../components/auth/AuthLayout'
import { LocationPicker } from '../../components/location/LocationPicker'
import { api } from '../../services/api'
import { setAuthSession } from '../../services/authStorage'

const statuses = ['AVAILABLE', 'BUSY', 'OFFLINE']

export function DriverDashboard({ user, logout }) {
  const [status, setStatus] = useState(user?.driverStatus || 'OFFLINE')
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
  const [acceptedRide, setAcceptedRide] = useState(null)

  const hasActiveRide = acceptedRide?.status === 'ACCEPTED'

  const loadRequests = async () => {
    if (!user?.id || hasActiveRide) return
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
  }, [user?.id, hasActiveRide])

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

  const updateStatus = async (nextStatus) => {
    if (hasActiveRide) return
    setStatus(nextStatus)
    setMessage('')
    setError('')
    try {
      const { data: updatedUser } = await api.patch(`/users/${user.id}/driver-status`, { status: nextStatus })
      setAuthSession(updatedUser)
      setMessage(`Status updated to ${nextStatus}.`)
      loadRequests()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not update driver status.')
    }
  }

  const acceptRide = async (bookingId) => {
    setMessage('')
    setError('')
    try {
      const { data } = await api.patch(`/bookings/${bookingId}/accept`, null, { params: { driverId: user.id } })
      setAcceptedRide(data)
      setStatus('BUSY')
      setRequests([])
      setMessage('Ride accepted. Status is locked as BUSY until you complete the ride.')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not accept this ride.')
    }
  }

  const completeRide = async () => {
    if (!acceptedRide?.id) return
    setMessage('')
    setError('')
    try {
      const { data } = await api.patch(`/bookings/${acceptedRide.id}/complete`, null, { params: { driverId: user.id } })
      setAcceptedRide(data)
      setStatus('AVAILABLE')
      setMessage('Ride completed. You are now AVAILABLE for new requests.')
      setTimeout(() => setAcceptedRide(null), 1200)
      loadRequests()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not complete this ride.')
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-6 text-white">
      <BackgroundFX />
      <section className="relative z-10 mx-auto max-w-7xl">
        <header className="mb-4 overflow-hidden rounded-[2rem] border border-white/15 bg-[linear-gradient(135deg,rgba(37,99,235,.24),rgba(255,255,255,.09)_48%,rgba(14,165,233,.18))] p-5 shadow-2xl shadow-blue-950/40 backdrop-blur-2xl">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-blue-300">driver control center</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">Driver Dashboard</h1>
              <div className="mt-4 grid gap-3 text-sm font-bold text-blue-100/80 sm:grid-cols-3">
                <InfoPill label="Driver" value={user?.name || 'Driver'} />
                <InfoPill label="Email" value={user?.email || 'No email'} />
                <InfoPill label="Vehicle" value={`${formatVehicleType(user?.vehicleType)} ${user?.vehicleNumber ? `| ${user.vehicleNumber}` : ''}`} />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-[180px_120px] lg:min-w-[320px]">
              <label className="block text-xs font-black uppercase tracking-[0.2em] text-blue-200/70">
                Driver Status
                <select
                  className="auth-input mt-2 h-12 text-sm"
                  value={status}
                  onChange={(event) => updateStatus(event.target.value)}
                  disabled={hasActiveRide}
                  title={hasActiveRide ? 'Status is locked while a ride is active' : 'Change driver status'}
                >
                  {statuses.map((item) => (
                    <option key={item} value={item} disabled={hasActiveRide && item !== 'BUSY'}>{item}</option>
                  ))}
                </select>
              </label>
              <button onClick={logout} className="self-end rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-black text-blue-100 hover:bg-white/15">Logout</button>
            </div>
          </div>
        </header>

        <section className="mb-5 rounded-[1.6rem] border border-white/15 bg-white/10 p-4 shadow-xl shadow-blue-950/25 backdrop-blur-xl">
          <div className="grid gap-4 lg:grid-cols-[1fr_180px] lg:items-end">
            <div>
              <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-black">Save Current Location</h2>
                <p className="text-xs font-bold text-blue-100/65">Saved: {savedAddress}</p>
              </div>
              <LocationPicker label="Driver Location" value={driverLocation} allowCurrentLocation onChange={setDriverLocation} />
            </div>
            <button type="button" onClick={saveLocation} disabled={saving} className="primary-action h-13">{saving ? 'Saving...' : 'Save Location'}</button>
          </div>
        </section>

        {(message || error) && (
          <div className="mb-5 grid gap-3">
            {message && <p className="rounded-2xl border border-emerald-300/30 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-100">{message}</p>}
            {error && <p className="rounded-2xl border border-red-300/30 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-100">{error}</p>}
          </div>
        )}

        <section className="rounded-[2rem] border border-white/15 bg-white/10 p-5 shadow-2xl shadow-blue-950/30 backdrop-blur-xl">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-black">Ride Requests</h2>
              <p className="mt-2 text-sm text-blue-100/70">Only AVAILABLE drivers receive matching rides within 5 km and matching vehicle type.</p>
            </div>
            {hasActiveRide && <span className="rounded-2xl border border-amber-300/25 bg-amber-400/10 px-4 py-2 text-xs font-black text-amber-100">Status locked: active ride</span>}
          </div>

          {acceptedRide && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-5 rounded-[1.5rem] border border-emerald-300/20 bg-emerald-500/10 p-5">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-100/70">Accepted ride</p>
              <h3 className="mt-2 text-xl font-black">Rider: {acceptedRide.riderName}</h3>
              <div className="mt-3 grid gap-2 text-sm font-bold text-emerald-50 md:grid-cols-2">
                <p>Mobile: {acceptedRide.riderMobile || 'Not available'}</p>
                <p>Price: LKR {Number(acceptedRide.price || 0).toFixed(0)}</p>
                <p className="md:col-span-2">Pickup: {acceptedRide.pickupAddress}</p>
                <p className="md:col-span-2">Drop: {acceptedRide.dropAddress}</p>
                <p>Vehicle: {formatVehicleType(acceptedRide.vehicleType)}</p>
                <p>Status: {acceptedRide.status}</p>
              </div>
              {acceptedRide.status === 'ACCEPTED' && <button onClick={completeRide} className="primary-action mt-5 max-w-xs">Complete Ride</button>}
            </motion.div>
          )}

          <div className="mt-5 grid gap-4">
            {loadingRequests && <p className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm font-bold text-blue-100">Checking nearby ride requests...</p>}
            {!loadingRequests && requests.length === 0 && !hasActiveRide && <p className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm font-bold text-blue-100">No nearby pending ride requests. Set status AVAILABLE and save your current location.</p>}
            {requests.map((request, index) => (
              <motion.article key={request.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }} className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-lg font-black">Booking #{request.id}</p>
                    <p className="mt-1 text-sm text-blue-100/70">Rider: {request.riderName || 'Rider'} {request.riderMobile ? `| ${request.riderMobile}` : ''}</p>
                    <p className="mt-1 text-sm text-blue-100/70">Pickup: {request.pickupAddress}</p>
                    <p className="mt-1 text-sm text-blue-100/70">Drop: {request.dropAddress}</p>
                  </div>
                  <div className="text-right font-black text-blue-300">
                    <p>{formatVehicleType(request.vehicleType)}</p>
                    <p>LKR {Number(request.price || 0).toFixed(0)}</p>
                  </div>
                </div>
                <div className="mt-4 flex gap-3">
                  <button onClick={() => acceptRide(request.id)} disabled={hasActiveRide} className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-black text-white hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50">Accept</button>
                  <button className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-black text-blue-100 hover:bg-white/15">Decline</button>
                </div>
              </motion.article>
            ))}
          </div>
        </section>
      </section>
    </main>
  )
}

function InfoPill({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
      <p className="text-[0.65rem] font-black uppercase tracking-[0.22em] text-blue-200/60">{label}</p>
      <p className="mt-1 truncate text-sm font-black text-white">{value}</p>
    </div>
  )
}

function formatVehicleType(type = '') {
  if (type === 'motor bike') return 'Motor Bike'
  if (type === 'three wheeler') return 'Three Wheeler'
  return type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Vehicle'
}

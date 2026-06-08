import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../../services/api'
import { EmptyCard, formatVehicleType, HistoryShell } from '../rider/RiderRideHistoryPage'

export function DriverRideDetailsPage({ user }) {
  const navigate = useNavigate()
  const { bookingId } = useParams()
  const [ride, setRide] = useState(null)
  const [loading, setLoading] = useState(true)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [error, setError] = useState('')

  const loadRide = async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/bookings/${bookingId}`)
      setRide(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRide()
  }, [bookingId])

  const completeRide = async () => {
    if (!ride?.id || !user?.id) return
    setCompleting(true)
    setError('')
    try {
      const { data } = await api.patch(`/bookings/${ride.id}/complete`, null, { params: { driverId: user.id } })
      setRide(data)
      setConfirmOpen(false)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not complete this ride.')
    } finally {
      setCompleting(false)
    }
  }

  return (
    <HistoryShell title="Driver Ride Details" subtitle="View rider details, route, fare, and assignment status." backTo="/driver/history">
      {loading && <EmptyCard text="Loading ride details..." />}
      {!loading && !ride && <EmptyCard text="Ride not found." />}
      {ride && (
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-[2rem] border border-white/15 bg-white/10 p-6 shadow-2xl shadow-blue-950/30 backdrop-blur-xl">
          <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-300">Booking #{ride.id}</p>
              <h2 className="mt-2 text-3xl font-black">Status: {ride.status}</h2>
              <div className="mt-6 space-y-4">
                <RouteLine label="Pickup" address={ride.pickupAddress} lat={ride.pickupLatitude} lng={ride.pickupLongitude} />
                <RouteLine label="Drop" address={ride.dropAddress} lat={ride.dropLatitude} lng={ride.dropLongitude} />
              </div>
              {error && <p className="mt-5 rounded-2xl border border-red-300/30 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-100">{error}</p>}
              {ride.status === 'ACCEPTED' && (
                <button onClick={() => setConfirmOpen(true)} className="primary-action mt-5 max-w-xs">Complete Ride</button>
              )}
            </div>
            <div className="grid gap-3">
              <Info label="Rider" value={ride.riderName || 'Rider'} />
              <Info label="Rider Mobile" value={ride.riderMobile || 'Not available'} />
              <Info label="Vehicle" value={formatVehicleType(ride.vehicleType)} />
              <Info label="Distance" value={`${ride.distanceKm || '--'} km`} />
              <Info label="Price" value={`LKR ${Number(ride.price || 0).toFixed(0)}`} />
            </div>
          </div>
        </motion.section>
      )}

      <AnimatePresence>
        {confirmOpen && (
          <motion.div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 p-4 backdrop-blur-xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div initial={{ opacity: 0, y: 24, scale: 0.94 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.94 }} className="w-full max-w-md rounded-[2rem] border border-white/15 bg-slate-950 p-6 text-center shadow-2xl shadow-blue-950/60">
              <motion.div className="mx-auto h-20 w-20 rounded-full border-4 border-blue-300/30 border-t-blue-300" animate={{ rotate: 360 }} transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }} />
              <h3 className="mt-5 text-3xl font-black">Complete this ride?</h3>
              <p className="mt-3 text-sm leading-6 text-blue-100/70">This will close the assignment and unlock your driver status.</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <button onClick={() => setConfirmOpen(false)} className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-black text-blue-100 hover:bg-white/15">Not Yet</button>
                <button onClick={completeRide} disabled={completing} className="primary-action">{completing ? 'Completing...' : 'Complete Ride'}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </HistoryShell>
  )
}

function RouteLine({ label, address, lat, lng }) {
  const href = lat && lng ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address || '')}`
  return (
    <a href={href} target="_blank" rel="noreferrer" className="block rounded-2xl border border-white/10 bg-slate-950/35 p-4 transition hover:border-blue-300/40 hover:bg-blue-500/10">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-200/70">{label}</p>
      <p className="mt-2 text-sm font-bold leading-6 text-white">{address}</p>
      <p className="mt-2 text-xs font-black text-blue-300">Open in Google Maps</p>
    </a>
  )
}

function Info({ label, value }) {
  return <div className="rounded-2xl border border-white/10 bg-white/10 p-4"><p className="text-xs font-black uppercase tracking-[0.22em] text-blue-200/70">{label}</p><p className="mt-2 text-lg font-black text-white">{value}</p></div>
}

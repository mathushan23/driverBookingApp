import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../../services/api'
import { EmptyCard, formatVehicleType, HistoryShell } from './RiderRideHistoryPage'

export function RiderRideDetailsPage({ user, logout }) {
  const { bookingId } = useParams()
  const [ride, setRide] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/bookings/${bookingId}`)
        setRide(data)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [bookingId])

  return (
    <HistoryShell title="Ride Details" subtitle="View ride route, driver details, status, and fare." user={user} logout={logout}>
      {loading && <EmptyCard text="Loading ride details..." />}
      {!loading && !ride && <EmptyCard text="Ride not found." />}
      {ride && (
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-[2rem] border border-white/15 bg-white/10 p-6 shadow-2xl shadow-blue-950/30 backdrop-blur-xl">
          <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-300">Booking #{ride.id}</p>
              <h2 className="mt-2 text-3xl font-black">Status: {ride.status}</h2>
              <div className="mt-6 space-y-4">
                <RouteLine label="Pickup" address={ride.pickupAddress} />
                <RouteLine label="Drop" address={ride.dropAddress} />
              </div>
            </div>
            <div className="grid gap-3">
              <Info label="Driver" value={ride.driverName || 'Waiting for driver'} />
              <Info label="Driver Phone" value={ride.driverPhone || 'Not available'} />
              <Info label="Vehicle" value={`${formatVehicleType(ride.vehicleType)} ${ride.driverVehicleNumber ? `| ${ride.driverVehicleNumber}` : ''}`} />
              <Info label="Distance" value={`${ride.distanceKm || '--'} km`} />
              <Info label="Price" value={`LKR ${Number(ride.price || 0).toFixed(0)}`} />
            </div>
          </div>
        </motion.section>
      )}
    </HistoryShell>
  )
}

function RouteLine({ label, address }) {
  return <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4"><p className="text-xs font-black uppercase tracking-[0.22em] text-blue-200/70">{label}</p><p className="mt-2 text-sm font-bold leading-6 text-white">{address}</p></div>
}

function Info({ label, value }) {
  return <div className="rounded-2xl border border-white/10 bg-white/10 p-4"><p className="text-xs font-black uppercase tracking-[0.22em] text-blue-200/70">{label}</p><p className="mt-2 text-lg font-black text-white">{value}</p></div>
}

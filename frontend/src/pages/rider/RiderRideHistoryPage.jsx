import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BackgroundFX } from '../../components/auth/AuthLayout'
import { RiderSidebar } from '../../components/layout/RiderSidebar'
import { api } from '../../services/api'

export function RiderRideHistoryPage({ user, logout }) {
  const navigate = useNavigate()
  const [rides, setRides] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/bookings/rider-history/${user.id}`)
        setRides(data)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user.id])

  return (
    <HistoryShell title="Ride History" subtitle="Track active rides first and review your previous bookings." user={user} logout={logout}>
      {loading && <EmptyCard text="Loading ride history..." />}
      {!loading && rides.length === 0 && <EmptyCard text="No rides found yet." />}
      <div className="grid gap-4">
        {rides.map((ride, index) => (
          <RideHistoryCard key={ride.id} ride={ride} index={index} onTrack={() => navigate(`/rider/rides/${ride.id}`)} />
        ))}
      </div>
    </HistoryShell>
  )
}

function RideHistoryCard({ ride, index, onTrack }) {
  const active = ride.status === 'ACCEPTED' || ride.status === 'ON_THE_WAY' || ride.status === 'STARTED' || ride.status === 'PENDING'
  return (
    <motion.article initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className={`rounded-[1.5rem] border p-5 ${active ? 'border-blue-300/35 bg-blue-500/15' : 'border-white/10 bg-white/10'}`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-black">Booking #{ride.id}</h2>
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-black text-blue-100">{ride.status}</span>
          </div>
          <p className="mt-2 text-sm text-blue-100/75">{ride.pickupAddress}</p>
          <p className="mt-1 text-sm text-blue-100/75">to {ride.dropAddress}</p>
        </div>
        <div className="flex flex-col gap-3 text-left lg:text-right">
          <p className="font-black text-blue-300">LKR {Number(ride.price || 0).toFixed(0)}</p>
          <p className="text-sm font-bold text-blue-100/70">{formatVehicleType(ride.vehicleType)} | {ride.distanceKm || '--'} km</p>
          <button onClick={onTrack} className="rounded-2xl bg-blue-500 px-5 py-3 text-sm font-black text-white hover:bg-blue-400">{active ? 'Track' : 'View Details'}</button>
        </div>
      </div>
    </motion.article>
  )
}

export function HistoryShell({ title, subtitle, user, logout, children }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-6 text-white">
      <BackgroundFX />
      <section className="relative z-10 mx-auto grid max-w-7xl gap-5 lg:ml-72 lg:block lg:max-w-none">
        <RiderSidebar user={user} logout={logout} />
        <div className="min-w-0 lg:px-6">
        <header className="mb-6 rounded-[2rem] border border-white/15 bg-white/10 p-5 shadow-2xl shadow-blue-950/40 backdrop-blur-2xl">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.35em] text-blue-300">ride booking app</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">{title}</h1>
            <p className="mt-2 text-blue-100/75">{subtitle}</p>
          </div>
        </header>
        {children}
        </div>
      </section>
    </main>
  )
}

export function EmptyCard({ text }) {
  return <p className="rounded-2xl border border-white/10 bg-white/10 p-5 text-sm font-bold text-blue-100">{text}</p>
}

export function formatVehicleType(type = '') {
  if (type === 'motor bike') return 'Motor Bike'
  if (type === 'three wheeler') return 'Three Wheeler'
  return type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Vehicle'
}

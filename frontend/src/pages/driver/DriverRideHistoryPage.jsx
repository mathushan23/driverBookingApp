import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BackgroundFX } from '../../components/auth/AuthLayout'
import { DriverSidebar } from '../../components/layout/DriverSidebar'
import { api } from '../../services/api'

export function DriverRideHistoryPage({ user, logout }) {
  const navigate = useNavigate()
  const [rides, setRides] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/bookings/driver-history/${user.id}`)
        setRides(data)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user.id])

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-6 text-white">
      <BackgroundFX />
      <section className="relative z-10 mx-auto grid max-w-7xl gap-5 lg:ml-72 lg:block lg:max-w-none">
        <DriverSidebar user={user} logout={logout} status={user?.driverStatus || 'OFFLINE'} hasActiveRide={rides.some((ride) => ride.status === 'ACCEPTED' || ride.status === 'ON_THE_WAY' || ride.status === 'STARTED')} onStatusChange={() => {}} />
        <div className="min-w-0 lg:px-6">
          <header className="mb-6 rounded-[2rem] border border-white/15 bg-white/10 p-5 shadow-2xl shadow-blue-950/40 backdrop-blur-2xl">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-emerald-300">driver control center</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">Driver Ride History</h1>
              <p className="mt-2 text-blue-100/75">View active and completed rides assigned to you.</p>
            </div>
          </header>

          {loading && <p className="rounded-2xl border border-white/10 bg-white/10 p-5 text-sm font-bold text-blue-100">Loading driver ride history...</p>}
          {!loading && rides.length === 0 && <p className="rounded-2xl border border-white/10 bg-white/10 p-5 text-sm font-bold text-blue-100">No assigned ride history found.</p>}
          <div className="grid gap-4">
            {rides.map((ride, index) => (
              <motion.article key={ride.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className={`rounded-[1.5rem] border p-5 ${ride.status === 'ACCEPTED' || ride.status === 'ON_THE_WAY' || ride.status === 'STARTED' ? 'border-emerald-300/35 bg-emerald-500/15' : 'border-white/10 bg-white/10'}`}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-black">Booking #{ride.id}</h2>
                      <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-black text-blue-100">{ride.status}</span>
                    </div>
                    <p className="mt-2 text-sm text-blue-100/75">Rider: {ride.riderName || 'Rider'} {ride.riderMobile ? `| ${ride.riderMobile}` : ''}</p>
                    <p className="mt-1 text-sm text-blue-100/75">{ride.pickupAddress}</p>
                    <p className="mt-1 text-sm text-blue-100/75">to {ride.dropAddress}</p>
                  </div>
                  <div className="flex flex-col gap-3 text-left lg:text-right">
                    <p className="font-black text-blue-300">LKR {Number(ride.price || 0).toFixed(0)}</p>
                    <p className="text-sm font-bold text-blue-100/70">{ride.distanceKm || '--'} km</p>
                    <button onClick={() => navigate(`/driver/rides/${ride.id}`)} className="rounded-2xl bg-blue-500 px-5 py-3 text-sm font-black text-white hover:bg-blue-400">View Details</button>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}

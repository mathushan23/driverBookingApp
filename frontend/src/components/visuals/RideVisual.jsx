import { motion } from 'framer-motion'
import { CarIcon, PinIcon, WheelIcon } from '../icons/GoRideIcons'

export function RideVisual({ mode = 'rider' }) {
  const isDriver = mode === 'driver'

  return (
    <div className="relative min-h-[280px] overflow-hidden rounded-[2rem] border border-white/15 bg-white/10 p-6 shadow-2xl shadow-blue-950/40 backdrop-blur-xl">
      <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.16)_1px,transparent_1px)] [background-size:36px_36px]" />
      <motion.div
        className="absolute left-8 top-8 grid h-14 w-14 place-items-center rounded-2xl bg-blue-500 text-white shadow-xl shadow-blue-500/40"
        animate={{ y: [0, -10, 0], rotate: [0, 3, 0] }}
        transition={{ duration: 3.2, repeat: Infinity }}
      >
        {isDriver ? <WheelIcon /> : <PinIcon />}
      </motion.div>
      <motion.div
        className="absolute right-8 top-12 rounded-2xl border border-white/15 bg-slate-950/50 px-4 py-3 text-sm font-bold text-blue-100"
        animate={{ opacity: [0.75, 1, 0.75], y: [0, 8, 0] }}
        transition={{ duration: 3.8, repeat: Infinity }}
      >
        {isDriver ? 'LKR 8,450 earned' : 'Driver arriving in 3 min'}
      </motion.div>
      <div className="absolute bottom-16 left-8 right-8 h-1 rounded-full bg-white/15">
        <motion.div className="h-full rounded-full bg-blue-400" animate={{ width: ['12%', '82%', '12%'] }} transition={{ duration: 4.5, repeat: Infinity }} />
      </div>
      <motion.div
        className="absolute bottom-20 left-10 w-36 text-blue-400 sm:w-48"
        animate={{ x: [0, 130, 0], y: [0, -6, 0] }}
        transition={{ duration: 5.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <CarIcon />
      </motion.div>
      <motion.div
        className="absolute bottom-28 right-16 h-16 w-10 rounded-full bg-white/90 shadow-xl shadow-blue-950/30 before:absolute before:left-1/2 before:top-2 before:h-5 before:w-5 before:-translate-x-1/2 before:rounded-full before:bg-amber-300 after:absolute after:bottom-2 after:left-1/2 after:h-6 after:w-6 after:-translate-x-1/2 after:rounded-xl after:bg-blue-500"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 2.6, repeat: Infinity }}
      />
    </div>
  )
}

export function RoleIcon({ role }) {
  return (
    <span className="grid h-14 w-14 place-items-center rounded-2xl bg-blue-500/15 text-blue-300 ring-1 ring-blue-300/20">
      {role === 'driver' ? <WheelIcon /> : <PinIcon />}
    </span>
  )
}

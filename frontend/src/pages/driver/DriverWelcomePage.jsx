import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { BackgroundFX } from '../../components/auth/AuthLayout'
import { RideVisual } from '../../components/visuals/RideVisual'

export function DriverWelcomePage() {
  const navigate = useNavigate()

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-8 text-white">
      <BackgroundFX />
      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <motion.div initial={{ opacity: 0, x: -32 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="rounded-[2rem] border border-white/15 bg-white/10 p-7 shadow-2xl shadow-blue-950/50 backdrop-blur-2xl sm:p-10">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-blue-300">driver workspace ready</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">Welcome to the driver&apos;s community.</h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-blue-100/80">Start receiving ride requests, control your availability, and grow your daily earnings with a clean driver dashboard.</p>
          <button className="primary-action mt-8 max-w-xs" onClick={() => navigate('/driver/dashboard')}>Next</button>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 36, scale: 0.96 }} animate={{ opacity: 1, x: 0, scale: 1 }} transition={{ duration: 0.55, delay: 0.1 }}>
          <RideVisual mode="driver" />
        </motion.div>
      </section>
    </main>
  )
}

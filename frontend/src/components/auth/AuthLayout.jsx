import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import gorideLogo from '../../assets/goride-logo.png'

export function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <BackgroundFX />
      <section className="relative z-10 grid min-h-screen place-items-center px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="w-full max-w-md rounded-[2rem] border border-white/15 bg-white/10 p-6 shadow-2xl shadow-blue-950/60 backdrop-blur-2xl sm:p-8"
        >
          <Link to="/login" className="mb-8 flex items-center justify-center gap-3">
            <span className="grid h-12 w-12 place-items-center overflow-hidden rounded-2xl bg-white shadow-lg shadow-blue-500/35">
              <img src={gorideLogo} alt="GoRide" className="h-full w-full object-cover" />
            </span>
            <span>
              <span className="block text-xl font-black tracking-tight">Ride Booking</span>
              <span className="block text-xs font-semibold uppercase tracking-[0.25em] text-blue-200">premium rides</span>
            </span>
          </Link>

          <div className="mb-7 text-center">
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{title}</h1>
            <p className="mt-3 text-sm leading-6 text-blue-100/80">{subtitle}</p>
          </div>

          {children}
          {footer && <div className="mt-6 text-center text-sm font-semibold text-blue-100/80">{footer}</div>}
        </motion.div>
      </section>
    </main>
  )
}

export function BackgroundFX() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(37,99,235,.35),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(14,165,233,.22),transparent_24%),linear-gradient(135deg,#020617_0%,#0f172a_48%,#061225_100%)]" />
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:48px_48px]" />
      <motion.div className="floating-pin left-[8%] top-[18%]" animate={{ y: [0, -18, 0] }} transition={{ duration: 4, repeat: Infinity }} />
      <motion.div className="floating-pin right-[12%] top-[28%]" animate={{ y: [0, 16, 0] }} transition={{ duration: 5, repeat: Infinity }} />
      <motion.div className="absolute bottom-16 left-[-8rem] h-2 w-44 rounded-full bg-blue-400/60 shadow-[0_0_30px_rgba(96,165,250,.8)]" animate={{ x: ['0vw', '120vw'] }} transition={{ duration: 7, repeat: Infinity, ease: 'linear' }} />
    </div>
  )
}

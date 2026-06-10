import { motion } from 'framer-motion'
import { useEffect } from 'react'
import { BrandText } from '../ui/BrandText'

export function PremiumWelcomePage({ mode, title, onNext }) {
  const isDriver = mode === 'driver'
  const message = title || (isDriver ? "Welcome to the driver's community." : 'Enjoy your ride with us.')
  const words = message.split(' ')
  const renderWord = (word) => (word === 'GoRide' ? <BrandText goClassName="text-blue-400" rideClassName="text-white" /> : word)

  useEffect(() => {
    const timer = window.setTimeout(onNext, 5200)
    return () => window.clearTimeout(timer)
  }, [onNext])

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-black px-5 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(37,99,235,.22),transparent_32%),radial-gradient(circle_at_20%_70%,rgba(56,189,248,.12),transparent_28%)]" />
      <motion.div
        className={`absolute h-72 w-72 rounded-full blur-[120px] ${isDriver ? 'bg-amber-500/18' : 'bg-blue-500/20'}`}
        animate={{ scale: [0.9, 1.14, 0.9], opacity: [0.35, 0.8, 0.35] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
      />

      <section className="relative z-10 text-center">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className={`mb-5 text-xs font-black uppercase tracking-[0.45em] ${isDriver ? 'text-amber-300' : 'text-blue-300'}`}
        >
          <BrandText goClassName="text-blue-400" rideClassName="text-white" />
        </motion.p>

        <h1 className="mx-auto flex max-w-5xl flex-wrap justify-center gap-x-4 gap-y-3 text-4xl font-black leading-tight tracking-tight sm:text-6xl lg:text-7xl">
          {words.map((word, index) => (
            <motion.span
              key={`${word}-${index}`}
              initial={{ opacity: 0, y: 34, rotateX: -55, filter: 'blur(12px)' }}
              animate={{ opacity: 1, y: 0, rotateX: 0, filter: 'blur(0px)' }}
              transition={{ delay: 0.35 + index * 0.32, duration: 0.95, ease: [0.22, 1, 0.36, 1] }}
              className="inline-block"
            >
              {renderWord(word)}
            </motion.span>
          ))}
        </h1>

        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 2.25, duration: 1.05, ease: 'easeOut' }}
          className={`mx-auto mt-8 h-1 w-56 origin-center rounded-full ${isDriver ? 'bg-amber-400' : 'bg-blue-500'} shadow-[0_0_30px_currentColor]`}
        />

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0.7, 1] }}
          transition={{ delay: 2.75, duration: 1.35 }}
          className="mt-7 text-sm font-bold uppercase tracking-[0.28em] text-white/55"
        >
          Redirecting to dashboard
        </motion.p>
      </section>
    </main>
  )
}

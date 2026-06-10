import { AnimatePresence, motion } from 'framer-motion'
import { BrandLockup } from './BrandLockup'
import { CityBackground } from './CityBackground'

export function AuthShell({ mode, children }) {
  return (
    <main className={`auth-shell ${mode === 'login' ? 'login-layout' : 'signup-layout'}`}>
      <CityBackground />
      <div className="auth-orbit" aria-hidden="true" />
      <section className="auth-panel">
        <BrandLockup centered compact />
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </section>
    </main>
  )
}

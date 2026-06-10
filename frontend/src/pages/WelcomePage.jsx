import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { BrandLockup } from '../components/layout/BrandLockup'
import { CityBackground } from '../components/layout/CityBackground'
import { BrandText } from '../components/ui/BrandText'
import { Illustration } from '../components/ui/Illustration'

export function WelcomePage({ user }) {
  const isDriver = user?.role === 'driver'

  return (
    <main className="welcome-page">
      <CityBackground />
      <section className="welcome-stage">
        <motion.div
          className="welcome-copy"
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <BrandLockup />
          <h1>
            {isDriver ? (
              <>Welcome to the <BrandText goClassName="text-blue-500" rideClassName="text-white" /> Driver Community</>
            ) : (
              <>Enjoy Your Ride With <BrandText goClassName="text-blue-500" rideClassName="text-white" /></>
            )}
          </h1>
          <p>
            {isDriver
              ? <>Start accepting rides, grow your earnings, and become part of the <BrandText goClassName="text-blue-500" rideClassName="text-white" /> network.</>
              : 'Book rides quickly, travel safely, and reach your destination comfortably.'}
          </p>
          <Link className="primary-button" to="/dashboard">
            Enter Dashboard
          </Link>
        </motion.div>
        <motion.div
          className="welcome-visual"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
        >
          <Illustration type={isDriver ? 'driverWelcome' : 'riderWelcome'} />
        </motion.div>
      </section>
    </main>
  )
}

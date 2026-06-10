import { motion } from 'framer-motion'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PremiumWelcomePage } from '../../components/welcome/PremiumWelcomePage'
import { BrandText } from '../../components/ui/BrandText'
import { api } from '../../services/api'
import { markDriverWelcomeShown, setAuthSession } from '../../services/authStorage'

export function DriverWelcomePage({ user, saveUser, logout }) {
  const navigate = useNavigate()

  useEffect(() => {
    if (!user || user.driverApproved) return

    let active = true
    const checkApproval = async () => {
      try {
        const { data } = await api.get('/users/me')
        if (!active) return
        setAuthSession(data)
        saveUser(data)
      } catch {
        // Keep the pending screen visible; login token issues are handled by route guards.
      }
    }

    checkApproval()
    const timer = setInterval(checkApproval, 5000)
    return () => {
      active = false
      clearInterval(timer)
    }
  }, [saveUser, user])

  if (!user?.driverApproved) {
    return <DriverApprovalWaitingPage logout={logout} />
  }

  return (
    <PremiumWelcomePage
      mode="driver"
      title="Welcome to the GoRide Driver Community"
      onNext={() => {
        markDriverWelcomeShown(user.id)
        navigate('/driver/dashboard', { replace: true })
      }}
    />
  )
}

function DriverApprovalWaitingPage({ logout }) {
  const message = 'Please wait admin approval is needed to join GoRide driver community'
  const words = message.split(' ')
  const renderWord = (word) => {
    if (word !== 'GoRide') return word

    return <BrandText goClassName="text-blue-400 drop-shadow-[0_0_28px_rgba(59,130,246,.55)]" rideClassName="text-white" />
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-black px-4 py-6 text-white">
      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl place-items-center">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="relative w-full overflow-hidden bg-black px-6 py-8 text-center sm:px-10 sm:py-12"
        >
          <h1 className="mx-auto flex max-w-5xl flex-wrap justify-center gap-x-4 gap-y-3 text-4xl font-black leading-tight tracking-tight sm:text-6xl lg:text-7xl">
            {words.map((word, index) => (
              <motion.span
                key={`${word}-${index}`}
                initial={{ opacity: 0, y: 34, rotateX: -55, filter: 'blur(12px)' }}
                animate={{ opacity: 1, y: 0, rotateX: 0, filter: 'blur(0px)' }}
                transition={{ delay: 0.45 + index * 0.32, duration: 1.35, ease: [0.22, 1, 0.36, 1] }}
                className="inline-block bg-gradient-to-br from-white via-slate-100 to-blue-100 bg-clip-text text-transparent drop-shadow-[0_0_34px_rgba(255,255,255,.12)]"
              >
                {renderWord(word)}
              </motion.span>
            ))}
          </h1>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 4.4, duration: 0.8 }}
            className="mx-auto mt-10 h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white"
            aria-label="Loading"
          />

          <motion.button
            type="button"
            onClick={logout}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 4.65, duration: 0.8 }}
            className="mx-auto mt-8 rounded-2xl border border-red-300/30 bg-red-500/16 px-6 py-3 text-sm font-black text-red-50 shadow-xl shadow-red-950/25 transition hover:bg-red-500/28"
          >
            Logout
          </motion.button>
        </motion.div>
      </section>
    </main>
  )
}

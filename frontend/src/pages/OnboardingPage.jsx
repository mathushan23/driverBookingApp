import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import driverRoleImage from '../assets/driver-role.png'
import riderRoleImage from '../assets/rider-role.png'
import { CarIcon, PinIcon, WheelIcon } from '../components/icons/GoRideIcons'
import { api } from '../services/api'
import { setAuthSession, welcomePathFor } from '../services/authStorage'

const roles = [
  {
    role: 'rider',
    title: 'Rider',
    description: 'Book rides instantly and travel anywhere with ease.',
    tone: 'blue',
    image: riderRoleImage,
  },
  {
    role: 'driver',
    title: 'Driver',
    description: 'Accept ride requests and earn on your own schedule.',
    tone: 'amber',
    image: driverRoleImage,
  },
]

const vehicleTypes = [
  { value: 'motor bike', label: 'Motor Bike' },
  { value: 'three wheeler', label: 'Three Wheeler' },
  { value: 'car', label: 'Car' },
  { value: 'van', label: 'Van' },
]

export function OnboardingPage({ user, saveUser }) {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [selectedRole, setSelectedRole] = useState(null)
  const [form, setForm] = useState({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const runAnime = () => {
      if (!window.anime) return

      window.anime({
        targets: '.ob-glow',
        opacity: [0.25, 0.78],
        scale: [0.96, 1.08],
        direction: 'alternate',
        easing: 'easeInOutSine',
        duration: 2200,
        loop: true,
      })
    }

    if (window.anime) {
      runAnime()
      return
    }

    const timer = window.setTimeout(runAnime, 600)
    return () => window.clearTimeout(timer)
  }, [step])

  const chooseRole = (role) => {
    setSelectedRole(role)
    setForm({})
    setError('')
  }

  const update = (field) => (event) => setForm({ ...form, [field]: event.target.value })

  const goNext = () => {
    if (!selectedRole) {
      setError('Please select Rider or Driver to continue.')
      return
    }
    setError('')
    setStep(2)
  }

  const submit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data: updatedUser } = await api.patch(`/users/${user.id}/onboarding`, {
        ...form,
        role: selectedRole,
      })
      setAuthSession(updatedUser)
      localStorage.setItem('firstLogin', 'false')
      saveUser(updatedUser)
      navigate(welcomePathFor(updatedUser.role), { replace: true })
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not save your role details. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#020817] px-3 py-3 text-white sm:px-5 sm:py-4">
      <section className="relative mx-auto min-h-[calc(100vh-1.5rem)] max-w-7xl overflow-hidden rounded-[1.55rem] border border-white/10 bg-[#050b18] shadow-2xl shadow-black/60 sm:min-h-[calc(100vh-2rem)] sm:rounded-[1.8rem]">
        <CinematicBackdrop role={selectedRole} />
        <OnboardingHeader step={step} />

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <RoleSelection
              key="role-selection"
              selectedRole={selectedRole}
              onSelect={chooseRole}
              onNext={goNext}
              error={error}
            />
          ) : (
            <DetailsStep
              key="details-step"
              role={selectedRole}
              form={form}
              update={update}
              onBack={() => {
                setStep(1)
                setError('')
              }}
              onSubmit={submit}
              error={error}
              loading={loading}
            />
          )}
        </AnimatePresence>
      </section>
    </main>
  )
}

function OnboardingHeader({ step }) {
  return (
    <header className="relative z-20 flex items-center justify-between px-5 py-4 sm:px-7">
      <div className="text-xl font-black tracking-tight">
        <span className="text-sky-300">Go</span>Ride
      </div>
      <div className="absolute left-1/2 top-6 flex -translate-x-1/2 items-center gap-2.5">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="flex items-center gap-2.5">
            <span className={`h-2.5 w-2.5 rounded-full ${item <= step ? 'bg-blue-500 shadow-[0_0_18px_rgba(59,130,246,.95)]' : 'bg-slate-500/70'}`} />
            {item !== 4 && <span className={`h-px w-7 ${item < step ? 'bg-blue-500' : 'bg-slate-500/70'}`} />}
          </div>
        ))}
      </div>
    </header>
  )
}

function RoleSelection({ selectedRole, onSelect, onNext, error }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -18 }}
      transition={{ duration: 0.38 }}
      className="relative z-10 px-5 pb-5 pt-3 sm:px-7"
    >
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="text-3xl font-black leading-[1.04] tracking-tight sm:text-5xl">
          How would you like
          <br />
          to use <span className="text-blue-500">GoRide?</span>
        </h1>
        <p className="mt-4 text-sm font-semibold text-blue-100/75">Choose your role and get started with your journey.</p>
      </div>

      <div className="mx-auto mt-6 grid max-w-6xl gap-5 md:grid-cols-2">
        {roles.map((item, index) => (
          <RoleCard key={item.role} item={item} selected={selectedRole === item.role} index={index} onSelect={() => onSelect(item.role)} />
        ))}
      </div>

      {error && <p className="mx-auto mt-4 max-w-6xl rounded-2xl border border-red-300/25 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-100">{error}</p>}

      <div className="mx-auto mt-6 flex max-w-6xl items-center justify-between gap-4">
        <button type="button" className="rounded-full border border-white/12 bg-white/[0.04] px-6 py-3 text-sm font-black text-blue-100/80 backdrop-blur-xl">
          Back
        </button>
        <motion.button whileHover={{ y: -2, scale: 1.02 }} whileTap={{ scale: 0.98 }} type="button" onClick={onNext} className="rounded-full bg-blue-600 px-8 py-3 text-sm font-black text-white shadow-2xl shadow-blue-600/35">
          Next <span className="ml-2">-&gt;</span>
        </motion.button>
      </div>
    </motion.div>
  )
}

function RoleCard({ item, selected, index, onSelect }) {
  const isDriver = item.role === 'driver'

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      whileHover={{ y: -8, scale: 1.015 }}
      whileTap={{ scale: 0.98 }}
      className={`group relative overflow-hidden rounded-[1.35rem] border text-left shadow-2xl transition ${selected ? 'border-white/70 bg-white/10 shadow-blue-500/25' : isDriver ? 'border-amber-300/25 bg-amber-950/15 shadow-black/30' : 'border-blue-300/25 bg-blue-950/20 shadow-black/30'}`}
    >
      <div className="relative h-52 overflow-hidden sm:h-60">
        <img src={item.image} alt={`${item.title} role`} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
        <div className={`absolute inset-0 ${isDriver ? 'bg-[linear-gradient(180deg,rgba(251,146,60,.04),rgba(7,10,18,.78))]' : 'bg-[linear-gradient(180deg,rgba(37,99,235,.02),rgba(7,10,18,.76))]'}`} />
      </div>
      <div className="relative bg-[linear-gradient(180deg,rgba(6,16,33,.95),rgba(3,9,22,.98))] p-4">
        <div className={`absolute inset-x-0 top-0 h-px ${isDriver ? 'bg-gradient-to-r from-transparent via-amber-300/70 to-transparent' : 'bg-gradient-to-r from-transparent via-blue-300/70 to-transparent'}`} />
        <div className="flex items-center gap-3">
          <span className={`grid h-10 w-10 place-items-center rounded-full ${isDriver ? 'bg-amber-500 text-white shadow-amber-500/30' : 'bg-blue-600 text-white shadow-blue-600/35'} shadow-xl`}>
            {isDriver ? <WheelIcon /> : <PinIcon />}
          </span>
          <h2 className="text-xl font-black">{item.title}</h2>
        </div>
        <p className="mt-3 max-w-xs text-xs font-semibold leading-5 text-blue-100/75">{item.description}</p>
        <span className={`absolute bottom-4 right-4 grid h-10 w-10 place-items-center rounded-full ${isDriver ? 'bg-amber-500' : 'bg-blue-600'} text-sm font-black text-white shadow-xl`}>
          -&gt;
        </span>
      </div>
      {selected && <motion.div layoutId="onboarding-selected-card" className={`absolute inset-0 rounded-[1.35rem] border-2 ${isDriver ? 'border-amber-300' : 'border-blue-300'}`} />}
    </motion.button>
  )
}

function DetailsStep({ role, form, update, onBack, onSubmit, error, loading }) {
  const isDriver = role === 'driver'

  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -18 }}
      transition={{ duration: 0.38 }}
      className="relative z-10 grid min-h-[calc(100vh-6rem)] items-center gap-8 px-5 pb-5 pt-3 lg:grid-cols-[0.82fr_1.18fr] sm:px-7"
    >
      <div>
        <h1 className="text-3xl font-black leading-[1.05] tracking-tight sm:text-5xl">
          {isDriver ? (
            <>
              Set up your
              <br />
              <span className="text-amber-400">Driver Profile</span>
            </>
          ) : (
            <>
              Complete your
              <br />
              <span className="text-blue-500">Rider Profile</span>
            </>
          )}
        </h1>
        <div className="mt-6 grid gap-4">
          {(isDriver ? driverFeatures : riderFeatures).map((item) => (
            <FeatureRow key={item.title} icon={item.icon} title={item.title} description={item.description} amber={isDriver} />
          ))}
        </div>
      </div>

      <div className="relative overflow-hidden rounded-[1.45rem] border border-white/12 bg-white/[0.055] p-4 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-5">
        <form onSubmit={onSubmit} className="relative z-10 rounded-[1.25rem] border border-white/12 bg-slate-950/70 p-4 backdrop-blur-xl">
          <div className="mb-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-200/60">profile details</p>
              <h2 className="mt-1 text-xl font-black">{isDriver ? 'Driver verification' : 'Rider details'}</h2>
            </div>
          </div>

          <div className="grid gap-4">
            {isDriver ? (
              <>
                <AuthField label="NIC Number" value={form.nic || ''} onChange={update('nic')} placeholder="Enter NIC number" />
                <AuthField label="Phone Number" value={form.phone || ''} onChange={update('phone')} placeholder="07X XXX XXXX" />
                <SelectField label="Vehicle Type" value={form.vehicleType || ''} onChange={update('vehicleType')} />
                <AuthField label="Vehicle Number" value={form.vehicleNumber || ''} onChange={update('vehicleNumber')} placeholder="ABC-1234" />
              </>
            ) : (
              <AuthField label="Mobile Number" value={form.mobile || ''} onChange={update('mobile')} placeholder="07X XXX XXXX" wide />
            )}
          </div>

          {error && <p className="mt-4 rounded-2xl border border-red-300/25 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-100">{error}</p>}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button type="button" onClick={onBack} className="rounded-full border border-white/12 bg-white/[0.04] px-6 py-3 text-sm font-black text-blue-100/80">
              &lt;- Back
            </button>
            <motion.button whileHover={{ y: -2, scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={loading} className={`rounded-full px-8 py-3 text-sm font-black text-white shadow-2xl disabled:cursor-wait disabled:opacity-65 ${isDriver ? 'bg-amber-500 shadow-amber-500/30' : 'bg-blue-600 shadow-blue-600/35'}`}>
              {loading ? 'Saving...' : 'Next ->'}
            </motion.button>
          </div>
        </form>
      </div>
    </motion.div>
  )
}

const riderFeatures = [
  { icon: <PinIcon />, title: 'Fast Booking', description: 'Book your ride in just a few seconds.' },
  { icon: <WheelIcon />, title: 'Trusted Drivers', description: 'Verified drivers for a safe journey.' },
  { icon: <CarIcon />, title: 'Ride History', description: 'View active and completed rides anytime.' },
]

const driverFeatures = [
  { icon: <WheelIcon />, title: 'Accept Ride Requests', description: 'Get ride requests and choose what suits you.' },
  { icon: <PinIcon />, title: 'Update Availability', description: 'Set your availability and go online anytime.' },
  { icon: <CarIcon />, title: 'Grow Your Earnings', description: 'More rides, more earnings on your own terms.' },
]

function FeatureRow({ icon, title, description, amber }) {
  return (
    <div className="flex gap-5">
      <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-full border ${amber ? 'border-amber-300/15 bg-amber-500/12 text-amber-300' : 'border-blue-300/15 bg-blue-500/12 text-blue-300'}`}>
        {icon}
      </div>
      <div>
        <h3 className="text-base font-black text-white">{title}</h3>
        <p className="mt-1 max-w-xs text-xs font-semibold leading-5 text-blue-100/65">{description}</p>
      </div>
    </div>
  )
}

function CinematicBackdrop({ role }) {
  const isDriver = role === 'driver'

  return (
    <>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_22%,rgba(37,99,235,.22),transparent_35%),linear-gradient(135deg,#07152e_0%,#020817_52%,#050713_100%)]" />
      <div className="ob-glow absolute left-[18%] top-[20%] h-64 w-64 rounded-full bg-blue-500/15 blur-[90px]" />
      <div className={`ob-glow absolute bottom-[10%] right-[8%] h-72 w-72 rounded-full ${isDriver ? 'bg-amber-500/16' : 'bg-blue-500/18'} blur-[100px]`} />
      <CitySkyline />
    </>
  )
}

function CitySkyline() {
  return (
    <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-52 opacity-45">
      <div className="absolute bottom-0 left-[5%] h-24 w-14 rounded-t bg-blue-950/80" />
      <div className="absolute bottom-0 left-[17%] h-36 w-16 rounded-t bg-blue-950/85" />
      <div className="absolute bottom-0 left-[31%] h-28 w-20 rounded-t bg-blue-950/75" />
      <div className="absolute bottom-0 right-[28%] h-40 w-16 rounded-t bg-blue-950/90" />
      <div className="absolute bottom-0 right-[14%] h-32 w-20 rounded-t bg-blue-950/75" />
      <div className="absolute bottom-0 right-[5%] h-48 w-8 bg-blue-950/90" />
      <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-[#050b18] to-transparent" />
    </div>
  )
}

function AuthField({ label, wide, ...props }) {
  return (
    <label className={`block text-sm font-bold text-blue-50 ${wide ? 'sm:col-span-2' : ''}`}>
      <span className="mb-2 block">{label}</span>
      <input required className="auth-input" {...props} />
    </label>
  )
}

function SelectField({ label, ...props }) {
  return (
    <label className="block text-sm font-bold text-blue-50">
      <span className="mb-2 block">{label}</span>
      <select required className="auth-input" {...props}>
        <option value="">Select vehicle type</option>
        {vehicleTypes.map((type) => (
          <option key={type.value} value={type.value}>{type.label}</option>
        ))}
      </select>
    </label>
  )
}

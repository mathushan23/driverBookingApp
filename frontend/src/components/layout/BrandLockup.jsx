import { CarIcon } from '../icons/GoRideIcons'

export function BrandLockup({ centered = false }) {
  return (
    <div className={`brand ${centered ? 'centered' : ''}`}>
      <div className="brand-mark">
        <CarIcon />
      </div>
      <div>
        <strong>GoRide</strong>
        <span>Your Journey, One Tap Away</span>
      </div>
    </div>
  )
}

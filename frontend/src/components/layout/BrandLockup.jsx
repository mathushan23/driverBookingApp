import gorideLogo from '../../assets/goride-logo.png'
import { BrandText } from '../ui/BrandText'

export function BrandLockup({ centered = false }) {
  return (
    <div className={`brand ${centered ? 'centered' : ''}`}>
      <div className="brand-mark">
        <img src={gorideLogo} alt="GoRide" />
      </div>
      <div>
        <strong><BrandText goClassName="text-blue-500" rideClassName="text-white" /></strong>
        <span>Your Journey, One Tap Away</span>
      </div>
    </div>
  )
}

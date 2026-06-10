import gorideLogo from '../../assets/goride-logo.png'
import { BrandText } from '../ui/BrandText'

export function BrandLockup({ centered = false, compact = false }) {
  return (
    <div className={`brand ${centered ? 'centered' : ''}`}>
      <div className="brand-mark">
        <img src={gorideLogo} alt="GoRide" />
      </div>
      <div>
        <strong>
          <BrandText className="brand-name" goClassName="brand-go" rideClassName="brand-ride" />
        </strong>
        {!compact && <span>Your Journey, One Tap Away</span>}
      </div>
    </div>
  )
}

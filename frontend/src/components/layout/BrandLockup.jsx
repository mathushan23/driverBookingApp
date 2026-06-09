import gorideLogo from '../../assets/goride-logo.png'

export function BrandLockup({ centered = false }) {
  return (
    <div className={`brand ${centered ? 'centered' : ''}`}>
      <div className="brand-mark">
        <img src={gorideLogo} alt="GoRide" />
      </div>
      <div>
        <strong>GoRide</strong>
        <span>Your Journey, One Tap Away</span>
      </div>
    </div>
  )
}

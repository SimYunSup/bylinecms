import { Link } from '@tanstack/react-router'
import Logo from '@/images/byline-logo-v1'
// import logo from '../../images/byline-logo-v1.svg'

export function Branding() {
  return (
    <div className="flex items-center space-x-2">
      <Link to="/">
        <Logo className="w-[28px] h-[28px]" />
      </Link>
    </div>
  )
}

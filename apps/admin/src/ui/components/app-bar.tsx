import { Branding } from './branding'

export function AppBar() {
  return (
    <header className="h-[45px] fixed z-50 w-full max-w-full bg-white dark:bg-canvas-800 shadow p-4 text-lg font-semibold flex items-center justify-between">
      <Branding />
    </header>
  )
}

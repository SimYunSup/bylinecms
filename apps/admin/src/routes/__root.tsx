import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

import { TranslationsProvider } from '@/i18n/client/translation-provider'
import { AppBar } from '@/ui/components/app-bar.tsx'

import '@/ui/styles/global.css'

export const Route = createRootRoute({
  component: () => {
    return (
      <TranslationsProvider>
        <div className="layout flex flex-col w-full max-w-full min-h-screen h-full selection:text-white selection:bg-primary-400">
          <AppBar />
          <main className="flex flex-col flex-1 pt-[50px] w-full max-w-full">
            <Outlet />
          </main>
        </div>
        <TanStackRouterDevtools />
      </TranslationsProvider>
    )
  },
})

import { Link, Outlet } from 'react-router'
import { StatusDaApi } from './StatusDaApi'

export function Layout() {
  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <header className="border-b">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/pessoas" className="font-heading text-lg font-semibold">
            Cadastro de Pessoas
          </Link>
          <StatusDaApi />
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}

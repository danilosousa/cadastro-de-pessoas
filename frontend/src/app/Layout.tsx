import { Link, Outlet } from 'react-router'
import { ConexaoComApi } from '@/auth/ConexaoComApi'
import { StatusDaApi } from './StatusDaApi'

export function Layout() {
  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <header className="border-b">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
          <Link to="/pessoas" className="font-heading text-lg font-semibold">
            Listagem de clientes - QUIPUX
          </Link>
          <StatusDaApi />
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <ConexaoComApi>
          <Outlet />
        </ConexaoComApi>
      </main>
    </div>
  )
}

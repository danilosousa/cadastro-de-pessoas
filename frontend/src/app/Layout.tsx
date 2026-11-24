import { LogOut } from 'lucide-react'
import { Link, Outlet } from 'react-router'
import { useAutenticacao } from '@/auth/contexto'
import { Button } from '@/components/ui/button'
import { StatusDaApi } from './StatusDaApi'

export function Layout() {
  const { sessao, sair } = useAutenticacao()

  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <header className="border-b">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
          <Link to="/pessoas" className="font-heading text-lg font-semibold">
            Cadastro de Pessoas
          </Link>
          <div className="flex items-center gap-3">
            <StatusDaApi />
            {sessao && (
              <>
                <span className="text-sm text-muted-foreground">{sessao.usuario}</span>
                <Button variant="ghost" size="sm" onClick={sair}>
                  <LogOut aria-hidden />
                  Sair
                </Button>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}

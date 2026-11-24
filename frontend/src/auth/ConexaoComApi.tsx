import type { ReactNode } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAutenticacao } from './contexto'

/** Só mostra o conteúdo depois que o login automático obteve o token. */
export function ConexaoComApi({ children }: { children: ReactNode }) {
  const { conexao, tentarDeNovo } = useAutenticacao()

  if (conexao.situacao === 'conectando') {
    return (
      <div role="status" aria-label="Conectando à API" className="flex flex-col gap-3">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  if (conexao.situacao === 'falhou') {
    return (
      <Alert variant="destructive">
        <AlertTitle>Não foi possível conectar à API</AlertTitle>
        <AlertDescription className="flex flex-col items-start gap-3">
          {conexao.erro.status === 401
            ? 'A API recusou as credenciais configuradas no frontend (VITE_API_USUARIO / VITE_API_SENHA).'
            : conexao.erro.message}
          <Button variant="outline" size="sm" onClick={tentarDeNovo}>
            Tentar de novo
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return children
}

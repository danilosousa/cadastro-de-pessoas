import { QueryClientProvider, type QueryClient } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { ProvedorDeAutenticacao } from '@/auth/ProvedorDeAutenticacao'

/** Provedores globais, na mesma ordem no app e nos testes. */
export function Provedores({
  queryClient,
  children,
}: {
  queryClient: QueryClient
  children: ReactNode
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <ProvedorDeAutenticacao>{children}</ProvedorDeAutenticacao>
    </QueryClientProvider>
  )
}

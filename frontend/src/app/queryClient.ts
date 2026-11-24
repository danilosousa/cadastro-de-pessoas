import { QueryClient } from '@tanstack/react-query'
import { ApiError } from '@/api/erro'

/** Erros 4xx são respostas definitivas: não adianta repetir a chamada. */
function deveRepetir(tentativas: number, erro: unknown): boolean {
  if (erro instanceof ApiError && erro.status >= 400 && erro.status < 500) return false
  return tentativas < 1
}

export function criarQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: deveRepetir, staleTime: 30_000, refetchOnWindowFocus: false },
      mutations: { retry: false },
    },
  })
}

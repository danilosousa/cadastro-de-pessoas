import { useQuery } from '@tanstack/react-query'
import { chamarApi } from '@/api/cliente'
import type { NacionalidadeResponse } from '@/api/tipos'

/**
 * `GET /findNacionalityByPerson/{documento}`, só depois que o usuário pede (`habilitada`):
 * cada consulta gasta a cota da nationalize.io. O backend já guarda em cache por 24 h,
 * então aqui o resultado também vale por bastante tempo.
 */
export function useNacionalidade(documento: string, habilitada: boolean) {
  return useQuery({
    queryKey: ['nacionalidade', documento],
    queryFn: ({ signal }) =>
      chamarApi<NacionalidadeResponse>(`/findNacionalityByPerson/${documento}`, { sinal: signal }),
    enabled: habilitada,
    staleTime: 60 * 60 * 1000,
    // 502/503 vêm de uma API externa com cota: repetir sozinho só gastaria a cota.
    retry: false,
  })
}

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { chamarApi } from '@/api/cliente'
import type { PaginaResponse, PessoaResponse, RegistrarPessoaRequest } from '@/api/tipos'

export const TAMANHO_DA_PAGINA = 10

/**
 * Chaves de cache das consultas de pessoa. Tudo começa com ['pessoas'], então
 * `invalidateQueries({ queryKey: chavesDePessoas.todas })` atualiza listas e detalhes de uma vez.
 */
export const chavesDePessoas = {
  todas: ['pessoas'] as const,
  listas: () => [...chavesDePessoas.todas, 'lista'] as const,
  lista: (pagina: number) => [...chavesDePessoas.listas(), pagina] as const,
  detalhe: (documento: string) => [...chavesDePessoas.todas, 'detalhe', documento] as const,
}

/** Lista paginada. `pagina` começa em 1 (como na URL); a API começa em 0. */
export function usePessoas(pagina: number) {
  return useQuery({
    queryKey: chavesDePessoas.lista(pagina),
    queryFn: ({ signal }) =>
      chamarApi<PaginaResponse<PessoaResponse>>('/list', {
        busca: { page: pagina - 1, size: TAMANHO_DA_PAGINA },
        sinal: signal,
      }),
    // Mantém a página anterior na tela enquanto a próxima carrega: a tabela não pisca.
    placeholderData: keepPreviousData,
  })
}

/** `POST /registrarName`. Ao registrar, as listas ficam desatualizadas e o detalhe já fica no cache. */
export function useRegistrarPessoa() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dados: RegistrarPessoaRequest) =>
      chamarApi<PessoaResponse>('/registrarName', { metodo: 'POST', corpo: dados }),
    onSuccess: async (pessoa) => {
      queryClient.setQueryData(chavesDePessoas.detalhe(pessoa.documento), pessoa)
      await queryClient.invalidateQueries({ queryKey: chavesDePessoas.listas() })
    },
  })
}

/** `GET /list/{documento}`. */
export function usePessoa(documento: string) {
  return useQuery({
    queryKey: chavesDePessoas.detalhe(documento),
    queryFn: ({ signal }) => chamarApi<PessoaResponse>(`/list/${documento}`, { sinal: signal }),
  })
}

/** `DELETE /list/{documento}`. Remove o detalhe do cache e marca as listas como desatualizadas. */
export function useExcluirPessoa() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (documento: string) => chamarApi<void>(`/list/${documento}`, { metodo: 'DELETE' }),
    onSuccess: async (_, documento) => {
      queryClient.removeQueries({ queryKey: chavesDePessoas.detalhe(documento) })
      await queryClient.invalidateQueries({ queryKey: chavesDePessoas.listas() })
    },
  })
}

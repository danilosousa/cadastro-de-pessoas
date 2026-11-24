import type { PaginaResponse, PessoaResponse } from '@/api/tipos'

/** Pessoas com CPFs válidos (mesmos CPFs e nomes do seed de desenvolvimento do backend). */
export const PESSOAS: PessoaResponse[] = [
  {
    documento: '39053344705',
    nome: 'Nathaniel',
    sobrenome: 'Brooks',
    email: 'nathaniel@exemplo.com',
  },
  { documento: '75198461059', nome: 'Giulia', sobrenome: 'Rossi', email: 'giulia@exemplo.com' },
  { documento: '26018573660', nome: 'Kenji', sobrenome: 'Tanaka', email: 'kenji@exemplo.com' },
]

/** Monta a resposta paginada como o backend (`page` começa em 0). */
export function pagina<T>(
  content: T[],
  { page = 0, size = 10, totalElements = content.length } = {},
): PaginaResponse<T> {
  return { content, page, size, totalElements, totalPages: Math.ceil(totalElements / size) }
}

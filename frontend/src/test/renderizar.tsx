import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { Provedores } from '@/app/Provedores'
import { criarQueryClient } from '@/app/queryClient'
import { rotas } from '@/app/rotas'
import { salvarSessao, type Sessao } from '@/auth/sessao'

export const TOKEN_DE_TESTE = 'token-de-teste'

/** Uma sessão válida por mais uma hora. */
export function sessaoDeTeste(alteracoes: Partial<Sessao> = {}): Sessao {
  return {
    token: TOKEN_DE_TESTE,
    usuario: 'admin',
    expiraEm: new Date(Date.now() + 3_600_000).toISOString(),
    ...alteracoes,
  }
}

type Opcoes = {
  /** Sessão já salva antes de montar o app; `null` para começar deslogado. Padrão: logado. */
  sessao?: Sessao | null
}

/** Renderiza o app inteiro (rotas reais) começando em `url`, com um QueryClient novo. */
export function renderizarApp(url = '/', { sessao = sessaoDeTeste() }: Opcoes = {}) {
  if (sessao) salvarSessao(sessao)

  const queryClient = criarQueryClient()
  queryClient.setDefaultOptions({
    queries: { ...queryClient.getDefaultOptions().queries, retry: false },
  })
  const router = createMemoryRouter(rotas, { initialEntries: [url] })
  const usuario = userEvent.setup()
  const resultado = render(
    <Provedores queryClient={queryClient}>
      <RouterProvider router={router} />
    </Provedores>,
  )
  return { ...resultado, router, usuario, queryClient }
}

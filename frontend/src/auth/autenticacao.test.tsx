import { act, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { chamarApi } from '@/api/cliente'
import { renderizarApp, sessaoDeTeste, TOKEN_DE_TESTE } from '@/test/renderizar'
import { API, naoAutenticado, servidor } from '@/test/servidor'
import { lerSessao } from './sessao'

const EXPIRA_EM = '2099-01-01T00:00:00Z'

function loginAceitando(usuario: string, senha: string) {
  return http.post(`${API}/auth/login`, async ({ request }) => {
    const corpo = (await request.json()) as { usuario: string; senha: string }
    if (corpo.usuario !== usuario || corpo.senha !== senha) return naoAutenticado()
    return HttpResponse.json({ token: 'token-novo', tipo: 'Bearer', expiraEm: EXPIRA_EM })
  })
}

describe('login e sessão', () => {
  it('leva ao login quem abre uma página protegida sem sessão', async () => {
    const { router } = renderizarApp('/pessoas', { sessao: null })

    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
  })

  it('entra com credenciais certas, guarda a sessão e volta à página pedida', async () => {
    servidor.use(loginAceitando('admin', 'admin123'))
    const { router, usuario } = renderizarApp('/pessoas?page=2', { sessao: null })

    await usuario.type(await screen.findByLabelText('Usuário'), 'admin')
    await usuario.type(screen.getByLabelText('Senha'), 'admin123')
    await usuario.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('heading', { name: 'Pessoas' })).toBeInTheDocument()
    expect(router.state.location.pathname + router.state.location.search).toBe('/pessoas?page=2')
    expect(lerSessao()).toEqual({ token: 'token-novo', usuario: 'admin', expiraEm: EXPIRA_EM })
    expect(screen.getByRole('button', { name: 'Sair' })).toBeInTheDocument()
  })

  it('mostra erro genérico com credenciais erradas e continua no login', async () => {
    servidor.use(loginAceitando('admin', 'admin123'))
    const { router, usuario } = renderizarApp('/login', { sessao: null })

    await usuario.type(await screen.findByLabelText('Usuário'), 'admin')
    await usuario.type(screen.getByLabelText('Senha'), 'errada')
    await usuario.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByText('Usuário ou senha inválidos.')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
    expect(lerSessao()).toBeNull()
  })

  it('valida os campos obrigatórios antes de chamar a API', async () => {
    // Sem handler de login: se o formulário chamasse a API, o MSW falharia o teste.
    const { usuario } = renderizarApp('/login', { sessao: null })

    await usuario.click(await screen.findByRole('button', { name: 'Entrar' }))

    expect(await screen.findByText('Informe o usuário')).toBeInTheDocument()
    expect(screen.getByText('Informe a senha')).toBeInTheDocument()
    expect(screen.getByLabelText('Usuário')).toHaveAttribute('aria-invalid', 'true')
  })

  it('mostra outro erro quando o servidor não responde', async () => {
    servidor.use(http.post(`${API}/auth/login`, () => HttpResponse.error()))
    const { usuario } = renderizarApp('/login', { sessao: null })

    await usuario.type(await screen.findByLabelText('Usuário'), 'admin')
    await usuario.type(screen.getByLabelText('Senha'), 'admin123')
    await usuario.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByText(/Não foi possível falar com o servidor/)).toBeInTheDocument()
  })

  it('retoma a sessão salva ao recarregar a página', async () => {
    renderizarApp('/pessoas')

    expect(await screen.findByRole('heading', { name: 'Pessoas' })).toBeInTheDocument()
    expect(screen.getByText('admin')).toBeInTheDocument()
  })

  it('descarta uma sessão salva já vencida', async () => {
    renderizarApp('/pessoas', {
      sessao: sessaoDeTeste({ expiraEm: new Date(Date.now() - 1000).toISOString() }),
    })

    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
    expect(lerSessao()).toBeNull()
  })

  it('volta ao login com aviso quando o backend recusa o token', async () => {
    let autorizacao: string | null = null
    servidor.use(
      http.get(`${API}/list`, ({ request }) => {
        autorizacao = request.headers.get('Authorization')
        return naoAutenticado()
      }),
    )
    const { router } = renderizarApp('/pessoas')
    await screen.findByRole('heading', { name: 'Pessoas' })

    await act(() => chamarApi('/list').catch(() => undefined))

    expect(autorizacao).toBe(`Bearer ${TOKEN_DE_TESTE}`)
    expect(await screen.findByText('Sessão expirada')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
    expect(lerSessao()).toBeNull()
  })

  it('sai ao clicar em Sair', async () => {
    const { router, usuario } = renderizarApp('/pessoas')

    await usuario.click(await screen.findByRole('button', { name: 'Sair' }))

    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
    expect(screen.queryByText('Sessão expirada')).not.toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
    expect(lerSessao()).toBeNull()
  })

  it('quem já está logado e abre o login vai direto para a lista', async () => {
    const { router } = renderizarApp('/login')

    expect(await screen.findByRole('heading', { name: 'Pessoas' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/pessoas')
  })
})

import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { PESSOAS, pagina } from '@/test/dados'
import { renderizarApp, sessaoDeTeste, TOKEN_DE_TESTE } from '@/test/renderizar'
import { API, naoAutenticado, servidor, TOKEN_EMITIDO } from '@/test/servidor'
import { lerSessao } from './sessao'

/** Registra o header Authorization de cada chamada a /list e responde com a lista. */
function listaRegistrandoToken(tokens: (string | null)[]) {
  return http.get(`${API}/list`, ({ request }) => {
    tokens.push(request.headers.get('Authorization'))
    return HttpResponse.json(pagina(PESSOAS))
  })
}

/** Falha o teste se o app tentar fazer login. */
const loginProibido = http.post(`${API}/auth/login`, () => {
  throw new Error('não deveria fazer login')
})

describe('login automático', () => {
  it('abre direto na lista, entrando com as credenciais configuradas', async () => {
    let credenciais: unknown
    const tokens: (string | null)[] = []
    servidor.use(
      http.post(`${API}/auth/login`, async ({ request }) => {
        credenciais = await request.json()
        return HttpResponse.json({
          token: TOKEN_EMITIDO,
          tipo: 'Bearer',
          expiraEm: '2099-01-01T00:00:00Z',
        })
      }),
      listaRegistrandoToken(tokens),
    )
    renderizarApp('/', { sessao: null })

    expect(await screen.findByRole('link', { name: 'Nathaniel Brooks' })).toBeInTheDocument()
    expect(credenciais).toEqual({ usuario: 'admin', senha: 'admin123' })
    expect(tokens).toEqual([`Bearer ${TOKEN_EMITIDO}`])
    expect(lerSessao()?.token).toBe(TOKEN_EMITIDO)
    expect(screen.queryByRole('heading', { name: 'Entrar' })).not.toBeInTheDocument()
  })

  it('reaproveita o token salvo ao recarregar, sem novo login', async () => {
    const tokens: (string | null)[] = []
    servidor.use(loginProibido, listaRegistrandoToken(tokens))
    renderizarApp('/pessoas')

    expect(await screen.findByRole('link', { name: 'Nathaniel Brooks' })).toBeInTheDocument()
    expect(tokens).toEqual([`Bearer ${TOKEN_DE_TESTE}`])
  })

  it('entra de novo quando o token salvo já venceu', async () => {
    const tokens: (string | null)[] = []
    servidor.use(listaRegistrandoToken(tokens))
    renderizarApp('/pessoas', {
      sessao: sessaoDeTeste({ expiraEm: new Date(Date.now() - 1000).toISOString() }),
    })

    expect(await screen.findByRole('link', { name: 'Nathaniel Brooks' })).toBeInTheDocument()
    expect(tokens).toEqual([`Bearer ${TOKEN_EMITIDO}`])
  })

  it('renova o token antes de vencer', async () => {
    const tokens: (string | null)[] = []
    servidor.use(listaRegistrandoToken(tokens))
    // Vence em 30 s: dentro da antecedência de renovação (60 s), então renova na hora.
    renderizarApp('/pessoas', {
      sessao: sessaoDeTeste({ expiraEm: new Date(Date.now() + 30_000).toISOString() }),
    })

    expect(await screen.findByRole('link', { name: 'Nathaniel Brooks' })).toBeInTheDocument()
    await vi.waitFor(() => expect(lerSessao()?.token).toBe(TOKEN_EMITIDO))
  })

  it('quando a API recusa o token, entra de novo e recarrega a lista', async () => {
    const tokens: (string | null)[] = []
    servidor.use(
      http.get(`${API}/list`, ({ request }) => {
        const autorizacao = request.headers.get('Authorization')
        tokens.push(autorizacao)
        if (autorizacao === `Bearer ${TOKEN_DE_TESTE}`) return naoAutenticado()
        return HttpResponse.json(pagina(PESSOAS))
      }),
    )
    renderizarApp('/pessoas')

    expect(await screen.findByRole('link', { name: 'Nathaniel Brooks' })).toBeInTheDocument()
    expect(tokens).toEqual([`Bearer ${TOKEN_DE_TESTE}`, `Bearer ${TOKEN_EMITIDO}`])
    expect(lerSessao()?.token).toBe(TOKEN_EMITIDO)
  })

  it('não entra em laço se a API recusar até o token recém-emitido', async () => {
    let logins = 0
    servidor.use(
      http.post(`${API}/auth/login`, () => {
        logins++
        return HttpResponse.json({
          token: TOKEN_EMITIDO,
          tipo: 'Bearer',
          expiraEm: '2099-01-01T00:00:00Z',
        })
      }),
      http.get(`${API}/list`, () => naoAutenticado()),
    )
    renderizarApp('/pessoas', { sessao: null })

    expect(await screen.findByText('Não foi possível conectar à API')).toBeInTheDocument()
    expect(logins).toBe(1)
  })

  it('explica quando a API recusa as credenciais configuradas', async () => {
    servidor.use(http.post(`${API}/auth/login`, () => naoAutenticado()))
    renderizarApp('/pessoas', { sessao: null })

    expect(await screen.findByText('Não foi possível conectar à API')).toBeInTheDocument()
    expect(screen.getByText(/recusou as credenciais configuradas/)).toBeInTheDocument()
  })

  it('mostra a falha de conexão e tenta de novo', async () => {
    let tentativas = 0
    servidor.use(
      http.post(`${API}/auth/login`, () => {
        tentativas++
        if (tentativas === 1) return HttpResponse.error()
        return HttpResponse.json({
          token: TOKEN_EMITIDO,
          tipo: 'Bearer',
          expiraEm: '2099-01-01T00:00:00Z',
        })
      }),
      http.get(`${API}/list`, () => HttpResponse.json(pagina(PESSOAS))),
    )
    const { usuario } = renderizarApp('/pessoas', { sessao: null })

    expect(await screen.findByText(/Não foi possível falar com o servidor/)).toBeInTheDocument()
    await usuario.click(screen.getByRole('button', { name: 'Tentar de novo' }))

    expect(await screen.findByRole('link', { name: 'Nathaniel Brooks' })).toBeInTheDocument()
  })
})

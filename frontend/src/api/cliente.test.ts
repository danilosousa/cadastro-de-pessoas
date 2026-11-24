import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { aoExpirarSessao, salvarSessao } from '@/auth/sessao'
import { API, naoAutenticado, servidor } from '@/test/servidor'
import { chamarApi } from './cliente'
import { ApiError } from './erro'

describe('chamarApi', () => {
  it('devolve o JSON e envia a query string', async () => {
    servidor.use(
      http.get(`${API}/list`, ({ request }) =>
        HttpResponse.json({ pagina: new URL(request.url).searchParams.get('page') }),
      ),
    )

    await expect(chamarApi('/list', { busca: { page: 2, size: undefined } })).resolves.toEqual({
      pagina: '2',
    })
  })

  it('envia o corpo como JSON', async () => {
    servidor.use(
      http.post(`${API}/eco`, async ({ request }) =>
        HttpResponse.json({
          tipo: request.headers.get('Content-Type'),
          corpo: await request.json(),
        }),
      ),
    )

    await expect(chamarApi('/eco', { metodo: 'POST', corpo: { a: 1 } })).resolves.toEqual({
      tipo: 'application/json',
      corpo: { a: 1 },
    })
  })

  it('devolve undefined num 204', async () => {
    servidor.use(http.delete(`${API}/list/1`, () => new HttpResponse(null, { status: 204 })))

    await expect(chamarApi('/list/1', { metodo: 'DELETE' })).resolves.toBeUndefined()
  })

  it('converte um ProblemDetail em ApiError, com os erros de campo', async () => {
    servidor.use(
      http.post(`${API}/registrarName`, () =>
        HttpResponse.json(
          {
            title: 'Dados inválidos',
            status: 400,
            detail: 'Um ou mais campos são inválidos.',
            erros: [{ campo: 'email', mensagem: 'e-mail inválido' }],
          },
          { status: 400, headers: { 'Content-Type': 'application/problem+json' } },
        ),
      ),
    )

    const erro = await chamarApi('/registrarName', { metodo: 'POST', corpo: {} }).catch((e) => e)

    expect(erro).toBeInstanceOf(ApiError)
    expect(erro).toMatchObject({
      status: 400,
      titulo: 'Dados inválidos',
      detalhe: 'Um ou mais campos são inválidos.',
      erros: [{ campo: 'email', mensagem: 'e-mail inválido' }],
    })
  })

  it('tolera erro sem corpo JSON', async () => {
    servidor.use(http.get(`${API}/list`, () => new HttpResponse('Bad Gateway', { status: 502 })))

    const erro = await chamarApi('/list').catch((e) => e)

    expect(erro).toMatchObject({ status: 502, titulo: 'Erro no servidor', erros: [] })
  })

  it('envia o token da sessão no header Authorization', async () => {
    salvarSessao({ token: 'abc', usuario: 'admin', expiraEm: '2099-01-01T00:00:00Z' })
    servidor.use(
      http.get(`${API}/list`, ({ request }) =>
        HttpResponse.json({ autorizacao: request.headers.get('Authorization') }),
      ),
    )

    await expect(chamarApi('/list')).resolves.toEqual({ autorizacao: 'Bearer abc' })
  })

  it('um 401 sem token enviado (ex.: login errado) não é tratado como sessão expirada', async () => {
    const ouvinte = vi.fn()
    const cancelar = aoExpirarSessao(ouvinte)
    servidor.use(http.post(`${API}/auth/login`, () => naoAutenticado()))

    const erro = await chamarApi('/auth/login', { metodo: 'POST', corpo: {} }).catch((e) => e)
    cancelar()

    expect(erro).toMatchObject({ status: 401 })
    expect(ouvinte).not.toHaveBeenCalled()
  })

  it('converte falha de rede em ApiError com status 0', async () => {
    servidor.use(http.get(`${API}/list`, () => HttpResponse.error()))

    const erro = await chamarApi('/list').catch((e) => e)

    expect(erro).toMatchObject({ status: 0, titulo: 'Sem conexão' })
  })
})

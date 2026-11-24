import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { API, servidor } from '@/test/servidor'
import { renderizarApp } from '@/test/renderizar'

describe('App', () => {
  it('redireciona a raiz para a lista de pessoas', async () => {
    const { router } = renderizarApp('/')

    expect(await screen.findByRole('heading', { name: 'Pessoas' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/pessoas')
  })

  it('mostra que a API está online', async () => {
    renderizarApp('/pessoas')

    expect(await screen.findByText('API funionando')).toBeInTheDocument()
  })

  it('mostra que a API está indisponível', async () => {
    servidor.use(http.get(`${API}/actuator/health`, () => HttpResponse.error()))
    renderizarApp('/pessoas')

    expect(await screen.findByText('API indisponível')).toBeInTheDocument()
  })

  it('mostra a página de não encontrada para rotas desconhecidas', async () => {
    renderizarApp('/qualquer-coisa')

    expect(
      await screen.findByRole('heading', { name: 'Página não encontrada' }),
    ).toBeInTheDocument()
  })
})

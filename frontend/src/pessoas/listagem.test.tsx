import { screen, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { PESSOAS, pagina } from '@/test/dados'
import { renderizarApp } from '@/test/renderizar'
import { API, servidor } from '@/test/servidor'

/** Responde a /list com 25 pessoas fictícias, 10 por página, e registra cada página pedida. */
function listaCom25Pessoas(paginasPedidas: string[] = []) {
  return http.get(`${API}/list`, ({ request }) => {
    const parametros = new URL(request.url).searchParams
    const page = Number(parametros.get('page'))
    paginasPedidas.push(`${parametros.get('page')}/${parametros.get('size')}`)
    const conteudo = PESSOAS.slice(0, 1).map((p) => ({ ...p, nome: `Pessoa${page}` }))
    return HttpResponse.json(pagina(conteudo, { page, totalElements: 25 }))
  })
}

describe('listagem de pessoas', () => {
  it('mostra a tabela com documento mascarado, nome completo e e-mail', async () => {
    servidor.use(http.get(`${API}/list`, () => HttpResponse.json(pagina(PESSOAS))))
    renderizarApp('/pessoas')

    const tabela = await screen.findByRole('table')
    const linhas = within(tabela).getAllByRole('row')
    expect(linhas).toHaveLength(4) // cabeçalho + 3
    expect(within(linhas[1]).getByText('390.533.447-05')).toBeInTheDocument()
    expect(within(linhas[1]).getByRole('link', { name: 'Nathaniel Brooks' })).toHaveAttribute(
      'href',
      '/pessoas/39053344705',
    )
    expect(within(linhas[1]).getByText('nathaniel@exemplo.com')).toBeInTheDocument()
    expect(screen.getByText('Página 1 de 1 · 3 pessoas')).toBeInTheDocument()
  })

  it('pede a página da URL à API (que começa em 0) e navega entre páginas', async () => {
    const pedidas: string[] = []
    servidor.use(listaCom25Pessoas(pedidas))
    const { router, usuario } = renderizarApp('/pessoas?page=2')

    expect(await screen.findByText('Página 2 de 3 · 25 pessoas')).toBeInTheDocument()
    expect(screen.getByText('Pessoa1 Brooks')).toBeInTheDocument()
    expect(pedidas).toEqual(['1/10'])

    await usuario.click(screen.getByRole('link', { name: 'Próxima' }))
    expect(await screen.findByText('Página 3 de 3 · 25 pessoas')).toBeInTheDocument()
    expect(router.state.location.search).toBe('?page=3')
    expect(screen.getByRole('button', { name: 'Próxima' })).toBeDisabled()

    await usuario.click(screen.getByRole('link', { name: 'Anterior' }))
    expect(await screen.findByText('Página 2 de 3 · 25 pessoas')).toBeInTheDocument()

    // Voltar no histórico do navegador também troca a página.
    await router.navigate(-1)
    expect(await screen.findByText('Página 3 de 3 · 25 pessoas')).toBeInTheDocument()
  })

  it('trata page inválido na URL como a primeira página', async () => {
    const pedidas: string[] = []
    servidor.use(listaCom25Pessoas(pedidas))
    renderizarApp('/pessoas?page=abc')

    expect(await screen.findByText('Página 1 de 3 · 25 pessoas')).toBeInTheDocument()
    expect(pedidas).toEqual(['0/10'])
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled()
  })

  it('avisa quando a página pedida não existe mais', async () => {
    servidor.use(
      http.get(`${API}/list`, () => HttpResponse.json(pagina([], { page: 8, totalElements: 3 }))),
    )
    renderizarApp('/pessoas?page=9')

    expect(await screen.findByText('A página 9 não existe.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ir para a primeira página' })).toHaveAttribute(
      'href',
      '/pessoas',
    )
  })

  it('mostra o estado vazio com atalho para registrar', async () => {
    renderizarApp('/pessoas')

    expect(await screen.findByText('Nenhuma pessoa registrada')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Registrar pessoa' })[1]).toHaveAttribute(
      'href',
      '/pessoas/nova',
    )
  })

  it('mostra o erro e tenta de novo', async () => {
    let chamadas = 0
    servidor.use(
      http.get(`${API}/list`, () => {
        chamadas++
        if (chamadas === 1) {
          return HttpResponse.json(
            { title: 'Erro interno', status: 500, detail: 'Erro inesperado no servidor.' },
            { status: 500 },
          )
        }
        return HttpResponse.json(pagina(PESSOAS))
      }),
    )
    const { usuario } = renderizarApp('/pessoas')

    expect(await screen.findByText('Não foi possível carregar as pessoas')).toBeInTheDocument()
    expect(screen.getByText('Erro inesperado no servidor.')).toBeInTheDocument()

    await usuario.click(screen.getByRole('button', { name: 'Tentar de novo' }))
    expect(await screen.findByRole('table')).toBeInTheDocument()
  })
})

describe('busca por CPF', () => {
  it('formata enquanto digita e vai ao detalhe com o CPF só com dígitos', async () => {
    const { router, usuario } = renderizarApp('/pessoas')
    const campo = await screen.findByLabelText('Buscar por CPF')

    await usuario.type(campo, '52998224725')
    expect(campo).toHaveValue('529.982.247-25')
    await usuario.click(screen.getByRole('button', { name: 'Buscar' }))

    expect(router.state.location.pathname).toBe('/pessoas/52998224725')
  })

  it('não navega com CPF inválido e mostra o erro no campo', async () => {
    const { router, usuario } = renderizarApp('/pessoas')
    const campo = await screen.findByLabelText('Buscar por CPF')

    await usuario.type(campo, '52998224724{Enter}')

    expect(await screen.findByText('CPF inválido')).toBeInTheDocument()
    expect(campo).toHaveAttribute('aria-invalid', 'true')
    expect(router.state.location.pathname).toBe('/pessoas')
  })

  it('pede o CPF quando o campo está vazio', async () => {
    const { usuario } = renderizarApp('/pessoas')

    await usuario.click(await screen.findByRole('button', { name: 'Buscar' }))

    expect(await screen.findByText('Informe um CPF')).toBeInTheDocument()
  })
})

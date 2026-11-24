import { screen, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { PESSOAS, pagina } from '@/test/dados'
import { renderizarApp } from '@/test/renderizar'
import { API, servidor } from '@/test/servidor'

const KENJI = PESSOAS[2]
const URL_KENJI = `/pessoas/${KENJI.documento}`

const pessoaEncontrada = http.get(`${API}/list/:documento`, ({ params }) => {
  const pessoa = PESSOAS.find((p) => p.documento === params.documento)
  if (pessoa) return HttpResponse.json(pessoa)
  return HttpResponse.json(
    {
      title: 'Pessoa não encontrada',
      status: 404,
      detail: 'Não existe pessoa com este documento.',
    },
    { status: 404 },
  )
})

function nacionalidadeRespondendo(status: number, corpo: object, chamadas = { total: 0 }) {
  return http.get(`${API}/findNacionalityByPerson/:documento`, () => {
    chamadas.total++
    return HttpResponse.json(corpo, { status })
  })
}

describe('detalhe da pessoa', () => {
  it('mostra os dados da pessoa', async () => {
    servidor.use(pessoaEncontrada)
    renderizarApp(URL_KENJI)

    expect(await screen.findByRole('heading', { name: 'Kenji Tanaka' })).toBeInTheDocument()
    expect(screen.getByText('260.185.736-60')).toBeInTheDocument()
    expect(screen.getByText('kenji@exemplo.com')).toBeInTheDocument()
    expect(screen.queryByText('Pessoa registrada')).not.toBeInTheDocument()
  })

  it('mostra "pessoa não encontrada" para um CPF válido não cadastrado', async () => {
    servidor.use(pessoaEncontrada)
    renderizarApp('/pessoas/52998224725')

    expect(
      await screen.findByRole('heading', { name: 'Pessoa não encontrada' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/529\.982\.247-25/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Voltar para a lista' })).toHaveAttribute(
      'href',
      '/pessoas',
    )
  })

  it('não chama a API com um CPF inválido na URL', async () => {
    // Sem handler para /list/:documento: se chamasse, o MSW falharia o teste.
    renderizarApp('/pessoas/12345678900')

    expect(await screen.findByRole('heading', { name: 'CPF inválido' })).toBeInTheDocument()
  })

  it('confirma o registro quando chega do formulário', async () => {
    servidor.use(pessoaEncontrada)
    const { router } = renderizarApp('/pessoas')
    await router.navigate(URL_KENJI, { state: { registrada: true } })

    expect(await screen.findByText('Pessoa registrada')).toBeInTheDocument()
  })
})

describe('nacionalidade', () => {
  it('só consulta quando o usuário pede, e mostra país e probabilidade', async () => {
    const chamadas = { total: 0 }
    servidor.use(
      pessoaEncontrada,
      nacionalidadeRespondendo(
        200,
        {
          documento: KENJI.documento,
          nome: 'Kenji',
          nacionalidade: { codigo: 'JP', pais: 'Japão', probabilidade: 0.621909 },
        },
        chamadas,
      ),
    )
    const { usuario } = renderizarApp(URL_KENJI)
    await screen.findByRole('heading', { name: 'Kenji Tanaka' })
    expect(chamadas.total).toBe(0)

    await usuario.click(screen.getByRole('button', { name: 'Consultar nacionalidade' }))

    expect(await screen.findByText('Japão')).toBeInTheDocument()
    expect(screen.getByText('(JP)')).toBeInTheDocument()
    expect(screen.getByText('Probabilidade de 62,2%')).toBeInTheDocument()
    expect(chamadas.total).toBe(1)
  })

  it('mostra a mensagem do backend quando não há previsão', async () => {
    servidor.use(
      pessoaEncontrada,
      nacionalidadeRespondendo(200, {
        documento: KENJI.documento,
        nome: 'Kenji',
        nacionalidade: null,
        mensagem: 'Não foi possível prever a nacionalidade para este nome.',
      }),
    )
    const { usuario } = renderizarApp(URL_KENJI)

    await usuario.click(await screen.findByRole('button', { name: 'Consultar nacionalidade' }))

    expect(
      await screen.findByText('Não foi possível prever a nacionalidade para este nome.'),
    ).toBeInTheDocument()
  })

  it.each([
    [503, 'Cota de consultas esgotada', /Tente mais tarde/],
    [502, 'Serviço de nacionalidade indisponível', /não respondeu/],
  ])('explica o %i e permite tentar de novo', async (status, titulo, texto) => {
    const chamadas = { total: 0 }
    servidor.use(
      pessoaEncontrada,
      nacionalidadeRespondendo(status, { title: 'Falha', status, detail: 'detalhe' }, chamadas),
    )
    const { usuario } = renderizarApp(URL_KENJI)

    await usuario.click(await screen.findByRole('button', { name: 'Consultar nacionalidade' }))

    expect(await screen.findByText(titulo)).toBeInTheDocument()
    expect(screen.getByText(texto)).toBeInTheDocument()
    expect(chamadas.total).toBe(1) // sem repetição automática: cada chamada gasta a cota

    await usuario.click(screen.getByRole('button', { name: 'Tentar de novo' }))
    await vi.waitFor(() => expect(chamadas.total).toBe(2))
  })
})

describe('exclusão', () => {
  it('cancelar não exclui', async () => {
    let excluiu = false
    servidor.use(
      pessoaEncontrada,
      http.delete(`${API}/list/:documento`, () => {
        excluiu = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { router, usuario } = renderizarApp(URL_KENJI)

    await usuario.click(await screen.findByRole('button', { name: 'Excluir' }))
    const dialogo = await screen.findByRole('alertdialog', { name: 'Excluir Kenji Tanaka?' })
    await usuario.click(within(dialogo).getByRole('button', { name: 'Cancelar' }))

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(excluiu).toBe(false)
    expect(router.state.location.pathname).toBe(URL_KENJI)
  })

  it('confirmar exclui e volta para a lista atualizada', async () => {
    let excluida: string | undefined
    servidor.use(
      pessoaEncontrada,
      http.delete(`${API}/list/:documento`, ({ params }) => {
        excluida = params.documento as string
        return new HttpResponse(null, { status: 204 })
      }),
      http.get(`${API}/list`, () =>
        HttpResponse.json(pagina(PESSOAS.filter((p) => p.documento !== excluida))),
      ),
    )
    const { router, usuario } = renderizarApp(URL_KENJI)

    await usuario.click(await screen.findByRole('button', { name: 'Excluir' }))
    const dialogo = await screen.findByRole('alertdialog')
    await usuario.click(within(dialogo).getByRole('button', { name: 'Excluir' }))

    expect(await screen.findByText('Pessoa excluída: Kenji Tanaka')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/pessoas')
    expect(excluida).toBe(KENJI.documento)
    expect(await screen.findByRole('link', { name: 'Nathaniel Brooks' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Kenji Tanaka' })).not.toBeInTheDocument()
  })

  it('mostra o erro no diálogo quando a exclusão falha', async () => {
    servidor.use(
      pessoaEncontrada,
      http.delete(`${API}/list/:documento`, () =>
        HttpResponse.json(
          { title: 'Erro interno', status: 500, detail: 'Erro inesperado no servidor.' },
          { status: 500 },
        ),
      ),
    )
    const { router, usuario } = renderizarApp(URL_KENJI)

    await usuario.click(await screen.findByRole('button', { name: 'Excluir' }))
    const dialogo = await screen.findByRole('alertdialog')
    await usuario.click(within(dialogo).getByRole('button', { name: 'Excluir' }))

    expect(
      await within(dialogo).findByText('Não foi possível excluir: Erro inesperado no servidor.'),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe(URL_KENJI)
  })
})

import { screen } from '@testing-library/react'
import type { UserEvent } from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import type { PessoaResponse, RegistrarPessoaRequest } from '@/api/tipos'
import { PESSOAS, pagina } from '@/test/dados'
import { renderizarApp } from '@/test/renderizar'
import { API, servidor } from '@/test/servidor'

const DADOS: RegistrarPessoaRequest = {
  documento: '52998224725',
  nome: 'Maria Clara',
  sobrenome: "D'Ávila",
  email: 'maria@exemplo.com',
}
const NOVA: PessoaResponse = { ...DADOS, criadoEm: '2026-11-24T12:00:00Z' }

async function preencher(usuario: UserEvent, dados: Partial<Record<string, string>>) {
  const rotulos: Record<string, string> = {
    documento: 'CPF',
    nome: 'Nome',
    sobrenome: 'Sobrenome',
    email: 'E-mail',
  }
  for (const [campo, valor] of Object.entries(dados)) {
    if (valor) await usuario.type(screen.getByLabelText(rotulos[campo]), valor)
  }
}

/** Responde ao registro com o status e o corpo dados, e guarda os corpos recebidos. */
function registroRespondendo(status: number, corpo: object, recebidos: unknown[] = []) {
  return http.post(`${API}/registrarName`, async ({ request }) => {
    recebidos.push(await request.json())
    return HttpResponse.json(corpo, { status })
  })
}

function problemaDeValidacao(erros: { campo: string; mensagem: string }[]) {
  return {
    title: 'Dados inválidos',
    status: 400,
    detail: 'Um ou mais campos são inválidos.',
    erros,
  }
}

describe('registrar pessoa', () => {
  it('valida no cliente sem chamar a API', async () => {
    const recebidos: unknown[] = []
    servidor.use(registroRespondendo(201, NOVA, recebidos))
    const { usuario } = renderizarApp('/pessoas/nova')
    await screen.findByRole('heading', { name: 'Registrar pessoa' })

    await usuario.click(screen.getByRole('button', { name: 'Registrar' }))
    expect(await screen.findAllByText('É obrigatório')).toHaveLength(4)

    await preencher(usuario, {
      documento: '52998224724',
      nome: 'Maria2',
      sobrenome: 'Silva',
      email: 'maria@',
    })
    await usuario.click(screen.getByRole('button', { name: 'Registrar' }))

    expect(await screen.findByText('Deve ser um CPF válido')).toBeInTheDocument()
    expect(screen.getByText('Deve conter apenas letras')).toBeInTheDocument()
    expect(screen.getByText('Deve ser um e-mail válido')).toBeInTheDocument()
    expect(screen.getByLabelText('Nome')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Sobrenome')).toHaveAttribute('aria-invalid', 'false')
    expect(recebidos).toHaveLength(0)
  })

  it('aceita nomes com acento, espaço, hífen e apóstrofo', async () => {
    servidor.use(registroRespondendo(201, NOVA))
    const { router, usuario } = renderizarApp('/pessoas/nova')
    await screen.findByRole('heading', { name: 'Registrar pessoa' })

    await preencher(usuario, {
      documento: '52998224725',
      nome: 'Ana-Lúcia Maria',
      sobrenome: "D'Ávila",
      email: 'ana@exemplo.com',
    })
    await usuario.click(screen.getByRole('button', { name: 'Registrar' }))

    await vi.waitFor(() => expect(router.state.location.pathname).toBe('/pessoas/52998224725'))
  })

  it('formata o CPF enquanto digita e envia só os dígitos', async () => {
    const recebidos: unknown[] = []
    servidor.use(registroRespondendo(201, NOVA, recebidos))
    const { router, usuario } = renderizarApp('/pessoas/nova')
    await screen.findByRole('heading', { name: 'Registrar pessoa' })

    await preencher(usuario, {
      documento: '52998224725',
      nome: ' Maria Clara ',
      sobrenome: "D'Ávila",
      email: 'maria@exemplo.com',
    })
    expect(screen.getByLabelText('CPF')).toHaveValue('529.982.247-25')
    await usuario.click(screen.getByRole('button', { name: 'Registrar' }))

    await vi.waitFor(() => expect(router.state.location.pathname).toBe('/pessoas/52998224725'))
    expect(recebidos).toEqual([DADOS])
    expect(router.state.location.state).toEqual({ registrada: true })
  })

  it('a lista já mostra a pessoa registrada', async () => {
    let registrada = false
    servidor.use(
      http.post(`${API}/registrarName`, () => {
        registrada = true
        return HttpResponse.json(NOVA, { status: 201 })
      }),
      http.get(`${API}/list`, () =>
        HttpResponse.json(pagina(registrada ? [...PESSOAS, NOVA] : PESSOAS)),
      ),
    )
    const { router, usuario } = renderizarApp('/pessoas')
    await screen.findByRole('link', { name: 'Nathaniel Brooks' })

    await usuario.click(screen.getAllByRole('link', { name: 'Registrar pessoa' })[0])
    await preencher(usuario, {
      documento: '52998224725',
      nome: 'Maria Clara',
      sobrenome: "D'Ávila",
      email: 'maria@exemplo.com',
    })
    await usuario.click(screen.getByRole('button', { name: 'Registrar' }))
    await vi.waitFor(() => expect(router.state.location.pathname).toBe('/pessoas/52998224725'))

    await router.navigate('/pessoas')
    expect(await screen.findByRole('link', { name: "Maria Clara D'Ávila" })).toBeInTheDocument()
  })

  it('mostra no campo certo os erros de validação do backend', async () => {
    servidor.use(
      registroRespondendo(
        400,
        problemaDeValidacao([
          { campo: 'email', mensagem: 'deve ser um e-mail válido' },
          { campo: 'nome', mensagem: 'deve ter no máximo 100 caracteres' },
        ]),
      ),
    )
    const { usuario } = renderizarApp('/pessoas/nova')
    await screen.findByRole('heading', { name: 'Registrar pessoa' })

    await preencher(usuario, { ...DADOS })
    await usuario.click(screen.getByRole('button', { name: 'Registrar' }))

    expect(await screen.findByText('Deve ser um e-mail válido')).toBeInTheDocument()
    expect(screen.getByText('Deve ter no máximo 100 caracteres')).toBeInTheDocument()
    expect(screen.getByLabelText('E-mail')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.queryByText('Não foi possível registrar')).not.toBeInTheDocument()
  })

  it.each([
    ['documento', 'CPF', 'Já existe uma pessoa registrada com este documento.'],
    ['e-mail', 'E-mail', 'Já existe uma pessoa registrada com este e-mail.'],
  ])('mostra o 409 de %s no campo %s', async (campo, rotulo, detalhe) => {
    servidor.use(
      registroRespondendo(409, {
        title: 'Pessoa já registrada',
        status: 409,
        detail: detalhe,
        campo,
      }),
    )
    const { router, usuario } = renderizarApp('/pessoas/nova')
    await screen.findByRole('heading', { name: 'Registrar pessoa' })

    await preencher(usuario, { ...DADOS })
    await usuario.click(screen.getByRole('button', { name: 'Registrar' }))

    expect(await screen.findByText(detalhe)).toBeInTheDocument()
    expect(screen.getByLabelText(rotulo)).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText(rotulo)).toHaveFocus()
    expect(router.state.location.pathname).toBe('/pessoas/nova')
  })

  it('mostra como erro geral o que não tem campo (409 de corrida, 500)', async () => {
    servidor.use(
      registroRespondendo(409, {
        title: 'Conflito de dados',
        status: 409,
        detail: 'O registro conflita com dados já existentes.',
      }),
    )
    const { usuario } = renderizarApp('/pessoas/nova')
    await screen.findByRole('heading', { name: 'Registrar pessoa' })

    await preencher(usuario, { ...DADOS })
    await usuario.click(screen.getByRole('button', { name: 'Registrar' }))

    expect(await screen.findByText('Não foi possível registrar')).toBeInTheDocument()
    expect(screen.getByText('O registro conflita com dados já existentes.')).toBeInTheDocument()
  })

  it('desabilita o botão enquanto envia', async () => {
    let liberar: () => void = () => {}
    servidor.use(
      http.post(`${API}/registrarName`, async () => {
        await new Promise<void>((resolver) => (liberar = resolver))
        return HttpResponse.json(NOVA, { status: 201 })
      }),
    )
    const { router, usuario } = renderizarApp('/pessoas/nova')
    await screen.findByRole('heading', { name: 'Registrar pessoa' })

    await preencher(usuario, { ...DADOS })
    await usuario.click(screen.getByRole('button', { name: 'Registrar' }))

    expect(await screen.findByRole('button', { name: 'Registrando…' })).toBeDisabled()
    liberar()
    await vi.waitFor(() => expect(router.state.location.pathname).toBe('/pessoas/52998224725'))
  })
})

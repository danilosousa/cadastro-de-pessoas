import { describe, expect, it, vi } from 'vitest'
import { aoExpirarSessao, avisarSessaoExpirada, lerSessao, salvarSessao } from './sessao'

const sessao = { token: 't', usuario: 'admin', expiraEm: '2030-01-01T00:00:00Z' }

describe('sessão no sessionStorage', () => {
  it('lê o que foi salvo enquanto não vence', () => {
    salvarSessao(sessao)

    expect(lerSessao(Date.parse('2029-12-31T23:59:59Z'))).toEqual(sessao)
  })

  it('descarta a sessão vencida', () => {
    salvarSessao(sessao)

    expect(lerSessao(Date.parse('2030-01-01T00:00:00Z'))).toBeNull()
    expect(sessionStorage.length).toBe(0)
  })

  it('descarta conteúdo corrompido ou incompleto', () => {
    sessionStorage.setItem('prova.sessao', '{não é json')
    expect(lerSessao()).toBeNull()

    sessionStorage.setItem('prova.sessao', JSON.stringify({ token: 't' }))
    expect(lerSessao()).toBeNull()
  })

  it('avisa os ouvintes e limpa a sessão quando ela expira', () => {
    salvarSessao(sessao)
    const ouvinte = vi.fn()
    const cancelar = aoExpirarSessao(ouvinte)

    avisarSessaoExpirada()
    cancelar()
    avisarSessaoExpirada()

    expect(ouvinte).toHaveBeenCalledTimes(1)
    expect(lerSessao(0)).toBeNull()
  })
})

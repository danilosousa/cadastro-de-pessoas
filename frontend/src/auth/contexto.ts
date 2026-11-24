import { createContext, useContext } from 'react'
import type { Sessao } from './sessao'

export type MotivoDeSaida = 'expirada' | null

export type Autenticacao = {
  sessao: Sessao | null
  /** Por que a sessão terminou sem o usuário pedir; mostrado na tela de login. */
  motivoDeSaida: MotivoDeSaida
  entrar: (usuario: string, senha: string) => Promise<void>
  sair: () => void
}

export const ContextoDeAutenticacao = createContext<Autenticacao | null>(null)

export function useAutenticacao(): Autenticacao {
  const contexto = useContext(ContextoDeAutenticacao)
  if (!contexto) throw new Error('useAutenticacao precisa estar dentro de <ProvedorDeAutenticacao>')
  return contexto
}

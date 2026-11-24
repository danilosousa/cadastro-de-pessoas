import { createContext, useContext } from 'react'
import type { ApiError } from '@/api/erro'

/**
 * Estado da conexão autenticada com a API:
 * - `conectando`: fazendo o login automático;
 * - `conectada`: há um token válido;
 * - `falhou`: o login automático não deu certo (API fora do ar, credenciais erradas).
 */
export type EstadoDaConexao =
  { situacao: 'conectando' } | { situacao: 'conectada' } | { situacao: 'falhou'; erro: ApiError }

export type Autenticacao = {
  conexao: EstadoDaConexao
  tentarDeNovo: () => void
}

export const ContextoDeAutenticacao = createContext<Autenticacao | null>(null)

export function useAutenticacao(): Autenticacao {
  const contexto = useContext(ContextoDeAutenticacao)
  if (!contexto) throw new Error('useAutenticacao precisa estar dentro de <ProvedorDeAutenticacao>')
  return contexto
}

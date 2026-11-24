import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { chamarApi } from '@/api/cliente'
import type { LoginRequest, LoginResponse } from '@/api/tipos'
import { ContextoDeAutenticacao, type Autenticacao, type MotivoDeSaida } from './contexto'
import {
  aoExpirarSessao,
  avisarSessaoExpirada,
  lerSessao,
  limparSessao,
  salvarSessao,
  type Sessao,
} from './sessao'

export function ProvedorDeAutenticacao({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  // Ao carregar (ou dar F5), retoma a sessão salva; uma sessão vencida é descartada.
  const [sessao, setSessao] = useState<Sessao | null>(() => lerSessao())
  const [motivoDeSaida, setMotivoDeSaida] = useState<MotivoDeSaida>(null)

  const encerrar = useCallback(
    (motivo: MotivoDeSaida) => {
      limparSessao()
      setSessao(null)
      setMotivoDeSaida(motivo)
      // Os dados em cache pertencem ao usuário que saiu.
      queryClient.clear()
    },
    [queryClient],
  )

  // Um 401 em qualquer chamada protegida encerra a sessão.
  useEffect(() => aoExpirarSessao(() => encerrar('expirada')), [encerrar])

  // Encerra também quando o token vence com a aba parada, sem esperar a próxima chamada.
  useEffect(() => {
    if (!sessao) return
    // setTimeout estoura acima de ~24,8 dias (2^31 ms); o token vale 1 h, mas limitamos mesmo assim.
    const restante = Math.min(Date.parse(sessao.expiraEm) - Date.now(), 2 ** 31 - 1)
    const timer = window.setTimeout(avisarSessaoExpirada, Math.max(restante, 0))
    return () => window.clearTimeout(timer)
  }, [sessao])

  const entrar = useCallback(async (usuario: string, senha: string) => {
    const resposta = await chamarApi<LoginResponse>('/auth/login', {
      metodo: 'POST',
      corpo: { usuario, senha } satisfies LoginRequest,
    })
    const nova: Sessao = { token: resposta.token, usuario, expiraEm: resposta.expiraEm }
    salvarSessao(nova)
    setSessao(nova)
    setMotivoDeSaida(null)
  }, [])

  const sair = useCallback(() => encerrar(null), [encerrar])

  const valor = useMemo<Autenticacao>(
    () => ({ sessao, motivoDeSaida, entrar, sair }),
    [sessao, motivoDeSaida, entrar, sair],
  )

  return <ContextoDeAutenticacao value={valor}>{children}</ContextoDeAutenticacao>
}

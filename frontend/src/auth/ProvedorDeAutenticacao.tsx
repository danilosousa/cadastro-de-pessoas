import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { chamarApi } from '@/api/cliente'
import { ApiError } from '@/api/erro'
import type { LoginRequest, LoginResponse } from '@/api/tipos'
import { ContextoDeAutenticacao, type Autenticacao, type EstadoDaConexao } from './contexto'
import { CREDENCIAIS } from './credenciais'
import { aoExpirarSessao, lerSessao, salvarSessao, type Sessao } from './sessao'

/** Renova o token um pouco antes de vencer, para nenhuma chamada sair com token vencido. */
const ANTECEDENCIA_DA_RENOVACAO_MS = 60_000
/** Um 401 logo depois de um login indica problema na API, não token vencido: não insiste. */
const JANELA_DE_RECUSA_MS = 5_000

/**
 * Login automático (ADR 0012): sem tela de login, o frontend obtém o token sozinho com as
 * credenciais configuradas, renova antes de vencer e entra de novo se a API recusar o token.
 */
export function ProvedorDeAutenticacao({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  // Ao carregar (ou dar F5), reaproveita o token salvo se ainda for válido.
  const [sessao, setSessao] = useState<Sessao | null>(() => lerSessao())
  const [falha, setFalha] = useState<ApiError | null>(null)
  const loginEmAndamento = useRef<Promise<void> | null>(null)
  const momentoDoUltimoLogin = useRef(0)

  const conectar = useCallback(() => {
    // Um login por vez, mesmo que vários gatilhos disparem juntos.
    loginEmAndamento.current ??= (async () => {
      try {
        const resposta = await chamarApi<LoginResponse>('/auth/login', {
          metodo: 'POST',
          corpo: CREDENCIAIS satisfies LoginRequest,
        })
        const nova: Sessao = {
          token: resposta.token,
          usuario: CREDENCIAIS.usuario,
          expiraEm: resposta.expiraEm,
        }
        salvarSessao(nova)
        momentoDoUltimoLogin.current = Date.now()
        setSessao(nova)
        setFalha(null)
        // Consultas que falharam por falta de token rodam de novo com o token novo.
        await queryClient.invalidateQueries()
      } catch (erro) {
        setFalha(erro instanceof ApiError ? erro : ApiError.semConexao())
      } finally {
        loginEmAndamento.current = null
      }
    })()
    return loginEmAndamento.current
  }, [queryClient])

  // Sem token (primeira visita, ou token recusado): entra sozinho.
  useEffect(() => {
    if (!sessao && !falha) void conectar()
  }, [sessao, falha, conectar])

  // A API recusou o token (401 com token enviado): descarta e entra de novo.
  useEffect(
    () =>
      aoExpirarSessao(() => {
        setSessao(null)
        if (Date.now() - momentoDoUltimoLogin.current < JANELA_DE_RECUSA_MS) {
          setFalha(
            new ApiError(401, {
              title: 'Token recusado',
              detail: 'A API recusou o token que acabou de emitir.',
            }),
          )
        }
      }),
    [],
  )

  // Renova antes de vencer; o token atual continua valendo até o novo chegar.
  useEffect(() => {
    if (!sessao) return
    const restante = Date.parse(sessao.expiraEm) - Date.now() - ANTECEDENCIA_DA_RENOVACAO_MS
    // setTimeout estoura acima de 2^31 ms (~24,8 dias); o token vale 1 h, mas limitamos mesmo assim.
    const espera = Math.min(Math.max(restante, 0), 2 ** 31 - 1)
    const timer = window.setTimeout(() => void conectar(), espera)
    return () => window.clearTimeout(timer)
  }, [sessao, conectar])

  const tentarDeNovo = useCallback(() => {
    setFalha(null)
    void conectar()
  }, [conectar])

  const conexao = useMemo<EstadoDaConexao>(() => {
    if (falha) return { situacao: 'falhou', erro: falha }
    return sessao ? { situacao: 'conectada' } : { situacao: 'conectando' }
  }, [sessao, falha])

  const valor = useMemo<Autenticacao>(() => ({ conexao, tentarDeNovo }), [conexao, tentarDeNovo])

  return <ContextoDeAutenticacao value={valor}>{children}</ContextoDeAutenticacao>
}

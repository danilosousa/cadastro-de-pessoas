/**
 * Sessão guardada no sessionStorage: sobrevive ao F5, some ao fechar a aba (ADR 0011).
 * Este módulo é a única parte do código que lê ou escreve o token.
 */

export type Sessao = {
  token: string
  usuario: string
  expiraEm: string
}

const CHAVE = 'prova.sessao'

export function lerSessao(agora = Date.now()): Sessao | null {
  let bruto: string | null
  try {
    bruto = sessionStorage.getItem(CHAVE)
  } catch {
    return null
  }
  if (!bruto) return null

  try {
    const sessao = JSON.parse(bruto) as Partial<Sessao>
    if (!sessao.token || !sessao.usuario || !sessao.expiraEm) throw new Error('incompleta')
    if (Date.parse(sessao.expiraEm) <= agora) throw new Error('vencida')
    return sessao as Sessao
  } catch {
    limparSessao()
    return null
  }
}

export function salvarSessao(sessao: Sessao): void {
  try {
    sessionStorage.setItem(CHAVE, JSON.stringify(sessao))
  } catch {
    // Armazenamento bloqueado (ex.: modo privado restrito): a sessão fica só em memória.
  }
}

export function limparSessao(): void {
  try {
    sessionStorage.removeItem(CHAVE)
  } catch {
    // nada a limpar
  }
}

type Ouvinte = () => void
const ouvintesDeExpiracao = new Set<Ouvinte>()

/** Registra quem deve reagir quando o backend recusar o token (401). Devolve a função de cancelar. */
export function aoExpirarSessao(ouvinte: Ouvinte): () => void {
  ouvintesDeExpiracao.add(ouvinte)
  return () => ouvintesDeExpiracao.delete(ouvinte)
}

export function avisarSessaoExpirada(): void {
  limparSessao()
  for (const ouvinte of ouvintesDeExpiracao) ouvinte()
}

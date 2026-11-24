import { ApiError } from './erro'

/** Prefixo que o proxy (Vite no dev, nginx em produção) repassa ao backend. */
const PREFIXO = '/api'

type Metodo = 'GET' | 'POST' | 'DELETE'

export type Requisicao = {
  metodo?: Metodo
  corpo?: unknown
  busca?: Record<string, string | number | undefined>
  sinal?: AbortSignal
}

/**
 * Chama a API e devolve o JSON já tipado. Qualquer resposta fora de 2xx vira ApiError,
 * e falha de rede vira ApiError com status 0. Respostas 204 devolvem undefined.
 */
export async function chamarApi<T>(caminho: string, requisicao: Requisicao = {}): Promise<T> {
  const { metodo = 'GET', corpo, busca, sinal } = requisicao
  const url = new URL(PREFIXO + caminho, window.location.origin)
  for (const [chave, valor] of Object.entries(busca ?? {})) {
    if (valor !== undefined) url.searchParams.set(chave, String(valor))
  }

  const headers = new Headers({ Accept: 'application/json' })
  if (corpo !== undefined) headers.set('Content-Type', 'application/json')

  let resposta: Response
  try {
    resposta = await fetch(url, {
      method: metodo,
      headers,
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
      signal: sinal,
    })
  } catch (erro) {
    if (erro instanceof DOMException && erro.name === 'AbortError') throw erro
    throw ApiError.semConexao()
  }

  if (!resposta.ok) throw await ApiError.daResposta(resposta)
  if (resposta.status === 204) return undefined as T
  return (await resposta.json()) as T
}

import type { ErroDeCampo, ProblemDetail } from './tipos'

/** Erro de qualquer chamada à API: status HTTP mais o que veio no ProblemDetail. */
export class ApiError extends Error {
  readonly status: number
  readonly titulo: string
  readonly detalhe?: string
  readonly erros: ErroDeCampo[]
  readonly campo?: string

  constructor(status: number, problema: ProblemDetail = {}) {
    const titulo = problema.title ?? tituloPadrao(status)
    super(problema.detail ?? titulo)
    this.name = 'ApiError'
    this.status = status
    this.titulo = titulo
    this.detalhe = problema.detail
    this.erros = problema.erros ?? []
    this.campo = problema.campo
  }

  /** Lê o corpo da resposta de erro; tolera corpo vazio ou que não seja JSON. */
  static async daResposta(resposta: Response): Promise<ApiError> {
    let problema: ProblemDetail = {}
    try {
      const corpo: unknown = await resposta.json()
      if (corpo && typeof corpo === 'object') problema = corpo as ProblemDetail
    } catch {
      // Sem corpo JSON (ex.: erro do proxy): fica só o status.
    }
    return new ApiError(resposta.status, problema)
  }

  static semConexao(): ApiError {
    return new ApiError(0, {
      title: 'Sem conexão',
      detail: 'Não foi possível falar com o servidor. Verifique se a API está no ar.',
    })
  }
}

function tituloPadrao(status: number): string {
  if (status >= 500) return 'Erro no servidor'
  if (status === 404) return 'Não encontrado'
  if (status === 401) return 'Não autenticado'
  return 'Erro na requisição'
}

// Tipos que espelham os DTOs do backend (records Java). Mantidos à mão: são poucos e estáveis.

export type PessoaResponse = {
  documento: string
  nome: string
  sobrenome: string
  email: string
}

export type RegistrarPessoaRequest = PessoaResponse

export type PaginaResponse<T> = {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export type NacionalidadeProvavel = {
  codigo: string
  pais: string
  probabilidade: number
}

export type NacionalidadeResponse = {
  documento: string
  nome: string
  nacionalidade: NacionalidadeProvavel | null
  mensagem?: string
}

export type LoginRequest = {
  usuario: string
  senha: string
}

export type LoginResponse = {
  token: string
  tipo: 'Bearer'
  expiraEm: string
}

export type ErroDeCampo = {
  campo: string
  mensagem: string
}

/** Corpo de erro RFC 7807 devolvido pelo backend, com as extensões que usamos. */
export type ProblemDetail = {
  type?: string
  title?: string
  status?: number
  detail?: string
  instance?: string
  erros?: ErroDeCampo[]
  campo?: string
}

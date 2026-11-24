import { z } from 'zod'
import { cpfValido } from '@/shared/cpf'

/**
 * Regras do formulário de registro, espelhando `RegistrarPessoaRequest` do backend
 * (mesmos limites, mesmo padrão de nome e mensagens equivalentes). O backend continua
 * validando: aqui é só para o usuário ver o erro na hora.
 */

/** Mesmo `PADRAO_NOME` do backend: palavras de letras Unicode separadas por espaço, hífen ou apóstrofo. */
const PADRAO_NOME = /^\p{L}+(?:[ '-]\p{L}+)*$/u

const obrigatorio = 'É obrigatório'

const nome = z
  .string()
  .trim()
  .min(1, obrigatorio)
  .max(100, 'Deve ter no máximo 100 caracteres')
  .regex(PADRAO_NOME, 'Deve conter apenas letras')

export const esquemaDeRegistro = z.object({
  documento: z.string().trim().min(1, obrigatorio).refine(cpfValido, 'Deve ser um CPF válido'),
  nome,
  sobrenome: nome,
  email: z
    .string()
    .trim()
    .min(1, obrigatorio)
    .max(255, 'Deve ter no máximo 255 caracteres')
    .pipe(z.email('Deve ser um e-mail válido')),
})

export type DadosDeRegistro = z.infer<typeof esquemaDeRegistro>

export type CampoDeRegistro = keyof DadosDeRegistro

/** Nome do campo como o backend o devolve (em `erros[].campo` ou no `campo` do 409) → campo do formulário. */
export function campoDoFormulario(campoDaApi: string | undefined): CampoDeRegistro | null {
  switch (campoDaApi) {
    case 'documento':
    case 'nome':
    case 'sobrenome':
    case 'email':
      return campoDaApi
    case 'e-mail': // o 409 de e-mail duplicado usa o nome legível
      return 'email'
    default:
      return null
  }
}

/**
 * Regras puras sobre CPF, espelhando `DocumentoCpf` do backend: formato, normalização,
 * máscara e dígitos verificadores. Sem React, para ser testável isoladamente.
 */

const SO_DIGITOS = /^\d{11}$/
const COM_MASCARA_OPCIONAL = /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/

/** `12345678909` ou `123.456.789-09` (pontos e traço opcionais). */
export function temFormatoComMascaraOpcional(valor: string): boolean {
  return COM_MASCARA_OPCIONAL.test(valor)
}

/** Remove tudo que não for dígito: `123.456.789-09` → `12345678909`. */
export function normalizarCpf(valor: string): string {
  return valor.replace(/\D/g, '')
}

/** Confere os dois dígitos verificadores de um CPF com 11 dígitos; rejeita sequências repetidas. */
export function temDigitosVerificadoresValidos(onzeDigitos: string): boolean {
  if (!SO_DIGITOS.test(onzeDigitos)) return false
  if (new Set(onzeDigitos).size === 1) return false
  const d = [...onzeDigitos].map(Number)
  return d[9] === digitoVerificador(d, 9) && d[10] === digitoVerificador(d, 10)
}

/** Formato aceito (com ou sem máscara) e dígitos verificadores corretos. */
export function cpfValido(valor: string): boolean {
  const limpo = valor.trim()
  return temFormatoComMascaraOpcional(limpo) && temDigitosVerificadoresValidos(normalizarCpf(limpo))
}

/**
 * Aplica a máscara progressivamente, enquanto o usuário digita:
 * `529` → `529`, `5299` → `529.9`, `52998224725` → `529.982.247-25`. Ignora o que passar de 11 dígitos.
 */
export function mascararCpf(valor: string): string {
  const d = normalizarCpf(valor).slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}

function digitoVerificador(d: number[], quantidade: number): number {
  let soma = 0
  let peso = quantidade + 1
  for (let i = 0; i < quantidade; i++) soma += d[i] * peso--
  const resto = (soma * 10) % 11
  return resto === 10 ? 0 : resto
}

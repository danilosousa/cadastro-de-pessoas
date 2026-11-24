import { describe, expect, it } from 'vitest'
import {
  cpfValido,
  mascararCpf,
  normalizarCpf,
  temDigitosVerificadoresValidos,
  temFormatoComMascaraOpcional,
} from './cpf'

// Mesmos casos do DocumentoCpfTest do backend: as duas pontas precisam concordar.
describe('cpf', () => {
  it.each(['52998224725', '11144477735', '12345678909'])('aceita %s', (cpf) => {
    expect(temDigitosVerificadoresValidos(cpf)).toBe(true)
  })

  it.each(['52998224724', '52998224715', '12345678900'])('rejeita dígitos errados em %s', (cpf) => {
    expect(temDigitosVerificadoresValidos(cpf)).toBe(false)
  })

  it.each(['00000000000', '11111111111', '99999999999'])('rejeita a sequência %s', (cpf) => {
    expect(temDigitosVerificadoresValidos(cpf)).toBe(false)
  })

  it.each(['', '5299822472', '529982247255', '5299822472a', '529.982.247-25'])(
    'rejeita tamanho ou caracteres inválidos em "%s"',
    (cpf) => {
      expect(temDigitosVerificadoresValidos(cpf)).toBe(false)
    },
  )

  it.each(['529.982.247-25', '52998224725', '529982247-25', '529.982.24725'])(
    'aceita a máscara opcional em %s',
    (valor) => {
      expect(temFormatoComMascaraOpcional(valor)).toBe(true)
    },
  )

  it.each(['529 982 247 25', '529/982/247-25', 'abc.def.ghi-jk', '529..982.247-25'])(
    'rejeita outros separadores em %s',
    (valor) => {
      expect(temFormatoComMascaraOpcional(valor)).toBe(false)
    },
  )

  it('normaliza removendo a máscara', () => {
    expect(normalizarCpf('529.982.247-25')).toBe('52998224725')
  })

  it('cpfValido junta formato e dígitos, tolerando espaços nas pontas', () => {
    expect(cpfValido(' 529.982.247-25 ')).toBe(true)
    expect(cpfValido('529 982 247 25')).toBe(false)
    expect(cpfValido('529.982.247-24')).toBe(false)
  })

  it.each([
    ['', ''],
    ['529', '529'],
    ['5299', '529.9'],
    ['5299822', '529.982.2'],
    ['5299822472', '529.982.247-2'],
    ['52998224725', '529.982.247-25'],
    ['529982247259999', '529.982.247-25'],
    ['529.982.247-25', '529.982.247-25'],
  ])('mascara "%s" como "%s"', (entrada, esperado) => {
    expect(mascararCpf(entrada)).toBe(esperado)
  })
})

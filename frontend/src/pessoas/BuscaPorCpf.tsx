import { Search } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { cpfValido, mascararCpf, normalizarCpf } from '@/shared/cpf'

/** Campo de CPF que leva direto ao detalhe da pessoa. Valida no cliente antes de navegar. */
export function BuscaPorCpf() {
  const navigate = useNavigate()
  const [valor, setValor] = useState('')
  const [erro, setErro] = useState<string | null>(null)

  function buscar(evento: FormEvent) {
    evento.preventDefault()
    if (!cpfValido(valor)) {
      setErro(normalizarCpf(valor).length === 0 ? 'Informe um CPF' : 'CPF inválido')
      return
    }
    navigate(`/pessoas/${normalizarCpf(valor)}`)
  }

  return (
    <form onSubmit={buscar} noValidate role="search" className="w-full sm:max-w-sm">
      <Field data-invalid={!!erro}>
        <FieldLabel htmlFor="busca-cpf">Buscar por CPF</FieldLabel>
        <div className="flex gap-2">
          <Input
            id="busca-cpf"
            inputMode="numeric"
            placeholder="000.000.000-00"
            value={valor}
            aria-invalid={!!erro}
            aria-describedby={erro ? 'busca-cpf-erro' : undefined}
            onChange={(e) => {
              setValor(mascararCpf(e.target.value))
              setErro(null)
            }}
          />
          <Button type="submit" variant="secondary">
            <Search aria-hidden />
            Buscar
          </Button>
        </div>
        <FieldError id="busca-cpf-erro">{erro}</FieldError>
      </Field>
    </form>
  )
}

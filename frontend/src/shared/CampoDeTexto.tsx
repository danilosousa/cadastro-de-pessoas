import type { ComponentProps } from 'react'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

type Props = ComponentProps<typeof Input> & {
  id: string
  rotulo: string
  erro?: string
  dica?: string
}

/**
 * Rótulo + campo + mensagem de erro, ligados para leitores de tela:
 * `aria-invalid` marca o campo e `aria-describedby` aponta para o erro e a dica.
 */
export function CampoDeTexto({ id, rotulo, erro, dica, ...props }: Props) {
  const descricoes = [erro && `${id}-erro`, dica && `${id}-dica`].filter(Boolean).join(' ')

  return (
    <Field data-invalid={!!erro}>
      <FieldLabel htmlFor={id}>{rotulo}</FieldLabel>
      <Input id={id} aria-invalid={!!erro} aria-describedby={descricoes || undefined} {...props} />
      {dica && <FieldDescription id={`${id}-dica`}>{dica}</FieldDescription>}
      <FieldError id={`${id}-erro`}>{erro}</FieldError>
    </Field>
  )
}

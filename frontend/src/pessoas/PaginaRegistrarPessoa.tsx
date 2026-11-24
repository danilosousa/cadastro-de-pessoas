import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { ApiError } from '@/api/erro'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { FieldGroup } from '@/components/ui/field'
import { CampoDeTexto } from '@/shared/CampoDeTexto'
import { mascararCpf, normalizarCpf } from '@/shared/cpf'
import { useRegistrarPessoa } from './consultas'
import { campoDoFormulario, esquemaDeRegistro, type DadosDeRegistro } from './esquemaDeRegistro'

/** Estado de navegação que o detalhe usa para mostrar "Pessoa registrada". */
export type EstadoAposRegistro = { registrada?: boolean }

function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

export function PaginaRegistrarPessoa() {
  const navigate = useNavigate()
  const registrar = useRegistrarPessoa()
  const [erroGeral, setErroGeral] = useState<string | null>(null)

  const {
    control,
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<DadosDeRegistro>({
    resolver: zodResolver(esquemaDeRegistro),
    defaultValues: { documento: '', nome: '', sobrenome: '', email: '' },
    // Valida ao sair do campo e, depois do primeiro envio, a cada tecla.
    mode: 'onTouched',
  })

  /** Leva cada erro do backend ao campo certo; o que não tem campo vira um erro geral. */
  function mostrarErroDaApi(erro: unknown) {
    if (!(erro instanceof ApiError)) {
      setErroGeral('Não foi possível registrar. Tente de novo.')
      return
    }
    if (erro.status === 409) {
      const campo = campoDoFormulario(erro.campo)
      if (campo) setError(campo, { type: 'server', message: erro.message }, { shouldFocus: true })
      else setErroGeral(erro.message)
      return
    }
    const semCampo: string[] = []
    for (const { campo, mensagem } of erro.erros) {
      const alvo = campoDoFormulario(campo)
      if (alvo) setError(alvo, { type: 'server', message: capitalizar(mensagem) })
      else semCampo.push(`${campo}: ${mensagem}`)
    }
    if (erro.erros.length === 0 || semCampo.length > 0) {
      setErroGeral([erro.message, ...semCampo].join(' '))
    }
  }

  const enviar = handleSubmit(async (dados) => {
    setErroGeral(null)
    try {
      const pessoa = await registrar.mutateAsync({
        ...dados,
        documento: normalizarCpf(dados.documento),
      })
      navigate(`/pessoas/${pessoa.documento}`, {
        state: { registrada: true } satisfies EstadoAposRegistro,
      })
    } catch (erro) {
      mostrarErroDaApi(erro)
    }
  })

  return (
    <section className="mx-auto flex w-full max-w-lg flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Button asChild variant="link" className="self-start px-0">
          <Link to="/pessoas">
            <ArrowLeft aria-hidden />
            Voltar para a lista
          </Link>
        </Button>
        <h1 className="font-heading text-2xl font-semibold">Registrar pessoa</h1>
      </div>

      <form onSubmit={enviar} noValidate>
        <FieldGroup>
          <Controller
            name="documento"
            control={control}
            render={({ field, fieldState }) => (
              <CampoDeTexto
                id="documento"
                rotulo="CPF"
                inputMode="numeric"
                autoComplete="off"
                placeholder="000.000.000-00"
                dica="Com ou sem pontos e traço."
                erro={fieldState.error?.message}
                {...field}
                onChange={(e) => field.onChange(mascararCpf(e.target.value))}
              />
            )}
          />
          <div className="grid gap-6 sm:grid-cols-2">
            <CampoDeTexto
              id="nome"
              rotulo="Nome"
              autoComplete="given-name"
              erro={errors.nome?.message}
              {...register('nome')}
            />
            <CampoDeTexto
              id="sobrenome"
              rotulo="Sobrenome"
              autoComplete="family-name"
              erro={errors.sobrenome?.message}
              {...register('sobrenome')}
            />
          </div>
          <CampoDeTexto
            id="email"
            rotulo="E-mail"
            type="email"
            autoComplete="email"
            erro={errors.email?.message}
            {...register('email')}
          />

          {erroGeral && (
            <Alert variant="destructive">
              <AlertTitle>Não foi possível registrar</AlertTitle>
              <AlertDescription>{erroGeral}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Registrando…' : 'Registrar'}
            </Button>
            <Button asChild variant="outline">
              <Link to="/pessoas">Cancelar</Link>
            </Button>
          </div>
        </FieldGroup>
      </form>
    </section>
  )
}

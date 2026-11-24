import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { z } from 'zod'
import { ApiError } from '@/api/erro'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useAutenticacao } from './contexto'
import type { EstadoDeRetorno } from './RotaProtegida'

const esquema = z.object({
  usuario: z.string().trim().min(1, 'Informe o usuário'),
  senha: z.string().min(1, 'Informe a senha'),
})

type DadosDeLogin = z.infer<typeof esquema>

/** Só aceita caminhos internos, para o retorno nunca levar a outro site. */
function destinoSeguro(de: string | undefined): string {
  return de?.startsWith('/') && !de.startsWith('//') ? de : '/pessoas'
}

function mensagemDeErro(erro: unknown): string {
  if (erro instanceof ApiError && erro.status === 401) return 'Usuário ou senha inválidos.'
  if (erro instanceof ApiError) return erro.message
  return 'Não foi possível entrar. Tente de novo.'
}

export function PaginaLogin() {
  const { sessao, motivoDeSaida, entrar } = useAutenticacao()
  const navigate = useNavigate()
  const location = useLocation()
  const destino = destinoSeguro((location.state as EstadoDeRetorno | null)?.de)
  const [erroDeEnvio, setErroDeEnvio] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DadosDeLogin>({ resolver: zodResolver(esquema) })

  if (sessao) return <Navigate to={destino} replace />

  const enviar = handleSubmit(async ({ usuario, senha }) => {
    setErroDeEnvio(null)
    try {
      await entrar(usuario, senha)
      navigate(destino, { replace: true })
    } catch (erro) {
      setErroDeEnvio(mensagemDeErro(erro))
    }
  })

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-4 pt-8">
      {motivoDeSaida === 'expirada' && (
        <Alert>
          <AlertTitle>Sessão expirada</AlertTitle>
          <AlertDescription>Entre novamente para continuar.</AlertDescription>
        </Alert>
      )}
      <Card>
        <CardHeader>
          <CardTitle>
            <h1>Entrar</h1>
          </CardTitle>
          <CardDescription>Use as credenciais de acesso à API.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={enviar} noValidate>
            <FieldGroup>
              <Field data-invalid={!!errors.usuario}>
                <FieldLabel htmlFor="usuario">Usuário</FieldLabel>
                <Input
                  id="usuario"
                  autoComplete="username"
                  autoFocus
                  aria-invalid={!!errors.usuario}
                  aria-describedby={errors.usuario ? 'usuario-erro' : undefined}
                  {...register('usuario')}
                />
                <FieldError id="usuario-erro" errors={[errors.usuario]} />
              </Field>
              <Field data-invalid={!!errors.senha}>
                <FieldLabel htmlFor="senha">Senha</FieldLabel>
                <Input
                  id="senha"
                  type="password"
                  autoComplete="current-password"
                  aria-invalid={!!errors.senha}
                  aria-describedby={errors.senha ? 'senha-erro' : undefined}
                  {...register('senha')}
                />
                <FieldError id="senha-erro" errors={[errors.senha]} />
              </Field>
              {erroDeEnvio && (
                <Alert variant="destructive">
                  <AlertDescription>{erroDeEnvio}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Entrando…' : 'Entrar'}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

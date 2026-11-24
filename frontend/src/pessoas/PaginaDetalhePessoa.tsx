import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, useLocation, useParams } from 'react-router'
import { ApiError } from '@/api/erro'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { PainelNacionalidade } from '@/nacionalidade/PainelNacionalidade'
import { cpfValido, mascararCpf } from '@/shared/cpf'
import { usePessoa } from './consultas'
import { ExcluirPessoa } from './ExcluirPessoa'
import type { EstadoAposRegistro } from './PaginaRegistrarPessoa'

export function PaginaDetalhePessoa() {
  const { documento = '' } = useParams()

  // CPF malformado na URL: nem chama a API (ela responderia 400).
  if (!/^\d{11}$/.test(documento) || !cpfValido(documento)) {
    return (
      <Moldura>
        <Mensagem titulo="CPF inválido" texto={`"${documento}" não é um CPF válido.`} />
      </Moldura>
    )
  }
  return <DetalheDaPessoa documento={documento} />
}

function DetalheDaPessoa({ documento }: { documento: string }) {
  const location = useLocation()
  const recemRegistrada = (location.state as EstadoAposRegistro | null)?.registrada === true
  const consulta = usePessoa(documento)

  if (consulta.isPending) {
    return (
      <Moldura>
        <div role="status" aria-label="Carregando pessoa" className="flex flex-col gap-3">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-24 w-full" />
        </div>
      </Moldura>
    )
  }

  if (consulta.isError) {
    const naoEncontrada = consulta.error instanceof ApiError && consulta.error.status === 404
    return (
      <Moldura>
        {naoEncontrada ? (
          <Mensagem
            titulo="Pessoa não encontrada"
            texto={`Nenhuma pessoa registrada com o CPF ${mascararCpf(documento)}.`}
          />
        ) : (
          <Alert variant="destructive">
            <AlertTitle>Não foi possível carregar a pessoa</AlertTitle>
            <AlertDescription className="flex flex-col items-start gap-3">
              {consulta.error.message}
              <Button variant="outline" size="sm" onClick={() => consulta.refetch()}>
                Tentar de novo
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </Moldura>
    )
  }

  const pessoa = consulta.data
  return (
    <Moldura>
      {recemRegistrada && (
        <Alert>
          <CheckCircle2 aria-hidden />
          <AlertTitle>Pessoa registrada</AlertTitle>
        </Alert>
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="font-heading text-2xl font-semibold">
          {pessoa.nome} {pessoa.sobrenome}
        </h1>
        <ExcluirPessoa pessoa={pessoa} />
      </div>
      <Card>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-[max-content_1fr] sm:gap-x-8">
            <Dado rotulo="CPF">
              <span className="font-mono tabular-nums">{mascararCpf(pessoa.documento)}</span>
            </Dado>
            <Dado rotulo="Nome">{pessoa.nome}</Dado>
            <Dado rotulo="Sobrenome">{pessoa.sobrenome}</Dado>
            <Dado rotulo="E-mail">
              <span className="break-all">{pessoa.email}</span>
            </Dado>
          </dl>
        </CardContent>
      </Card>
      <PainelNacionalidade documento={pessoa.documento} />
    </Moldura>
  )
}

function Moldura({ children }: { children: ReactNode }) {
  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <Button asChild variant="link" className="self-start px-0">
        <Link to="/pessoas">
          <ArrowLeft aria-hidden />
          Voltar para a lista
        </Link>
      </Button>
      {children}
    </section>
  )
}

function Mensagem({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="flex flex-col items-start gap-3">
      <h1 className="font-heading text-2xl font-semibold">{titulo}</h1>
      <p className="text-muted-foreground">{texto}</p>
    </div>
  )
}

function Dado({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="contents">
      <dt className="text-sm text-muted-foreground">{rotulo}</dt>
      <dd className="-mt-3 sm:mt-0">{children}</dd>
    </div>
  )
}

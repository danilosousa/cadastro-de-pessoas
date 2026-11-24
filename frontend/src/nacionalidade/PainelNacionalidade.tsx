import { Globe } from 'lucide-react'
import { useState } from 'react'
import { ApiError } from '@/api/erro'
import type { NacionalidadeResponse } from '@/api/tipos'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useNacionalidade } from './consultas'

const PORCENTAGEM = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 1 })

/** Cada status de erro da API vira uma mensagem que diz ao usuário o que fazer. */
function mensagemDeErro(erro: Error): { titulo: string; texto: string } {
  if (erro instanceof ApiError && erro.status === 503) {
    return {
      titulo: 'Cota de consultas esgotada',
      texto: 'O serviço de nacionalidade atingiu o limite de consultas. Tente mais tarde.',
    }
  }
  if (erro instanceof ApiError && erro.status === 502) {
    return {
      titulo: 'Serviço de nacionalidade indisponível',
      texto: 'O serviço externo não respondeu. Tente de novo em instantes.',
    }
  }
  return { titulo: 'Não foi possível consultar a nacionalidade', texto: erro.message }
}

export function PainelNacionalidade({ documento }: { documento: string }) {
  const [pedida, setPedida] = useState(false)
  const consulta = useNacionalidade(documento, pedida)

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>Nacionalidade provável</h2>
        </CardTitle>
        <CardDescription>Prevista pelo primeiro nome, com a nationalize.io.</CardDescription>
      </CardHeader>
      <CardContent aria-live="polite">
        {!pedida ? (
          <Button variant="secondary" onClick={() => setPedida(true)}>
            <Globe aria-hidden />
            Consultar nacionalidade
          </Button>
        ) : consulta.isPending ? (
          <div role="status" aria-label="Consultando nacionalidade" className="flex flex-col gap-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        ) : consulta.isError ? (
          <ErroDeNacionalidade erro={consulta.error} tentarDeNovo={() => consulta.refetch()} />
        ) : (
          <Resultado resposta={consulta.data} />
        )}
      </CardContent>
    </Card>
  )
}

function Resultado({ resposta }: { resposta: NacionalidadeResponse }) {
  const provavel = resposta.nacionalidade
  if (!provavel) {
    return (
      <p className="text-muted-foreground">{resposta.mensagem ?? 'Sem previsão para este nome.'}</p>
    )
  }
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xl font-semibold">
        {provavel.pais}{' '}
        <span className="font-normal text-muted-foreground">({provavel.codigo})</span>
      </p>
      <p className="text-sm text-muted-foreground">
        Probabilidade de {PORCENTAGEM.format(provavel.probabilidade)}
      </p>
    </div>
  )
}

function ErroDeNacionalidade({ erro, tentarDeNovo }: { erro: Error; tentarDeNovo: () => void }) {
  const { titulo, texto } = mensagemDeErro(erro)
  return (
    <Alert variant="destructive">
      <AlertTitle>{titulo}</AlertTitle>
      <AlertDescription className="flex flex-col items-start gap-3">
        {texto}
        <Button variant="outline" size="sm" onClick={tentarDeNovo}>
          Tentar de novo
        </Button>
      </AlertDescription>
    </Alert>
  )
}

import { ChevronLeft, ChevronRight, UserPlus } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router'
import type { PaginaResponse, PessoaResponse } from '@/api/tipos'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { mascararCpf } from '@/shared/cpf'
import { BuscaPorCpf } from './BuscaPorCpf'
import { usePessoas } from './consultas'

/** `?page=` na URL começa em 1. Qualquer valor inválido vira 1. */
function lerPagina(valor: string | null): number {
  const numero = Number(valor)
  return Number.isInteger(numero) && numero >= 1 ? numero : 1
}

export function PaginaPessoas() {
  const [parametros] = useSearchParams()
  const pagina = lerPagina(parametros.get('page'))
  const consulta = usePessoas(pagina)

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-heading text-2xl font-semibold">Pessoas</h1>
        <Button asChild>
          <Link to="/pessoas/nova">
            <UserPlus aria-hidden />
            Registrar pessoa
          </Link>
        </Button>
      </div>

      <BuscaPorCpf />

      {consulta.isPending ? (
        <CarregandoTabela />
      ) : consulta.isError ? (
        <Alert variant="destructive">
          <AlertTitle>Não foi possível carregar as pessoas</AlertTitle>
          <AlertDescription className="flex flex-col items-start gap-3">
            {consulta.error.message}
            <Button variant="outline" size="sm" onClick={() => consulta.refetch()}>
              Tentar de novo
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <ResultadoDaLista
          dados={consulta.data}
          pagina={pagina}
          atualizando={consulta.isPlaceholderData}
        />
      )}
    </section>
  )
}

function ResultadoDaLista({
  dados,
  pagina,
  atualizando,
}: {
  dados: PaginaResponse<PessoaResponse>
  pagina: number
  atualizando: boolean
}) {
  if (dados.totalElements === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-10 text-center">
        <p className="font-medium">Nenhuma pessoa registrada</p>
        <p className="text-sm text-muted-foreground">Registre a primeira para ela aparecer aqui.</p>
        <Button asChild variant="outline">
          <Link to="/pessoas/nova">Registrar pessoa</Link>
        </Button>
      </div>
    )
  }

  // Ex.: ?page=9 depois de exclusões. Há pessoas, mas não nesta página.
  if (dados.content.length === 0) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p>A página {pagina} não existe.</p>
        <Button asChild variant="outline">
          <Link to="/pessoas">Ir para a primeira página</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* A tabela rola dentro do próprio contêiner no celular; a página não. */}
      <div
        className="overflow-x-auto rounded-lg border aria-busy:opacity-60"
        aria-busy={atualizando}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Documento</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dados.content.map((pessoa) => (
              <TableRow key={pessoa.documento}>
                <TableCell className="font-mono tabular-nums">
                  {mascararCpf(pessoa.documento)}
                </TableCell>
                <TableCell>
                  <Link
                    to={`/pessoas/${pessoa.documento}`}
                    className="font-medium underline-offset-4 hover:underline"
                  >
                    {pessoa.nome} {pessoa.sobrenome}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{pessoa.email}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Paginacao pagina={pagina} totalDePaginas={dados.totalPages} total={dados.totalElements} />
    </div>
  )
}

function Paginacao({
  pagina,
  totalDePaginas,
  total,
}: {
  pagina: number
  totalDePaginas: number
  total: number
}) {
  const temAnterior = pagina > 1
  const temProxima = pagina < totalDePaginas

  return (
    <nav aria-label="Paginação" className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">
        Página {pagina} de {totalDePaginas} · {total} {total === 1 ? 'pessoa' : 'pessoas'}
      </p>
      <div className="flex gap-2">
        <BotaoDePagina destino={pagina - 1} habilitado={temAnterior}>
          <ChevronLeft aria-hidden />
          Anterior
        </BotaoDePagina>
        <BotaoDePagina destino={pagina + 1} habilitado={temProxima}>
          Próxima
          <ChevronRight aria-hidden />
        </BotaoDePagina>
      </div>
    </nav>
  )
}

function BotaoDePagina({
  destino,
  habilitado,
  children,
}: {
  destino: number
  habilitado: boolean
  children: ReactNode
}) {
  if (!habilitado) {
    return (
      <Button variant="outline" size="sm" disabled>
        {children}
      </Button>
    )
  }
  // Links de verdade: a página entra no histórico, então o botão voltar do navegador funciona.
  return (
    <Button asChild variant="outline" size="sm">
      <Link to={destino === 1 ? '/pessoas' : `/pessoas?page=${destino}`}>{children}</Link>
    </Button>
  )
}

function CarregandoTabela() {
  return (
    <div className="flex flex-col gap-2" aria-label="Carregando pessoas" role="status">
      {Array.from({ length: 5 }, (_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  )
}

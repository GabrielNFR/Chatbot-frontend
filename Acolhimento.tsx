import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import {
  ArrowRight,
  Bot,
  Check,
  Clock3,
  Fingerprint,
  HelpCircle,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  Mail,
  MessageCircle,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { formatarCpf, mensagemErroFormato, rotuloCanal, validarIdentificador } from '@/lib/identificacao'
import type { Acolhimento as DadosAcolhimento, ClienteIdentificado, TipoIdentificador } from '@/lib/types'
import { dadosDemonstracao } from '@/services/app'
import { ErroIdentificacao, identificarUsuaria, obterAcolhimento } from '@/services/identificacao'

type EstadoTela = 'carregando' | 'pronto' | 'erro'

const ICONE: Record<TipoIdentificador, LucideIcon> = {
  CPF: Fingerprint,
  EMAIL: Mail,
  CODIGO: KeyRound,
}

const ROTULO_TIPO: Record<TipoIdentificador, string> = {
  CPF: 'CPF',
  EMAIL: 'e-mail',
  CODIGO: 'código de acesso',
}

interface AcolhimentoProps {
  onProsseguir: (cliente: ClienteIdentificado | null) => void
}

export default function Acolhimento({ onProsseguir }: AcolhimentoProps) {
  const [acolhimento, setAcolhimento] = useState<DadosAcolhimento | null>(null)
  const [estado, setEstado] = useState<EstadoTela>('carregando')
  const [tipo, setTipo] = useState<TipoIdentificador>('CPF')
  const [valor, setValor] = useState('')
  const [erroFormato, setErroFormato] = useState<string | null>(null)
  const [erroServico, setErroServico] = useState<string | null>(null)
  const [validando, setValidando] = useState(false)
  const [cliente, setCliente] = useState<ClienteIdentificado | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const sucessoRef = useRef<HTMLDivElement>(null)

  const carregar = useCallback(async () => {
    setEstado('carregando')
    setErroFormato(null)
    setErroServico(null)
    try {
      const dados = await obterAcolhimento()
      if (dados.requerIdentificacao && dados.identificadores.length === 0) {
        throw new Error('Acolhimento sem formas de identificação configuradas.')
      }
      setAcolhimento(dados)
      setTipo(dados.identificadores[0]?.tipo ?? 'CPF')
      setEstado('pronto')
    } catch {
      setEstado('erro')
    }
  }, [])

  useEffect(() => {
    void carregar()
  }, [carregar])

  useEffect(() => {
    if (cliente) sucessoRef.current?.focus()
  }, [cliente])

  const opcaoAtual = acolhimento?.identificadores.find((opcao) => opcao.tipo === tipo)
  const primeiroNome = cliente?.nome.split(' ')[0]

  function trocarTipo(novoTipo: TipoIdentificador) {
    setTipo(novoTipo)
    setValor('')
    setErroFormato(null)
    setErroServico(null)
  }

  function handleValorChange(evento: ChangeEvent<HTMLInputElement>) {
    const proximo = tipo === 'CPF' ? formatarCpf(evento.target.value) : evento.target.value
    setValor(proximo)
    if (erroFormato) setErroFormato(null)
    if (erroServico) setErroServico(null)
  }

  async function handleSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (!acolhimento || validando) return

    const erro = validarIdentificador(tipo, valor)
    if (erro) {
      setErroFormato(mensagemErroFormato(erro, tipo))
      setErroServico(null)
      inputRef.current?.focus()
      return
    }

    setValidando(true)
    setErroFormato(null)
    setErroServico(null)

    try {
      const identificado = await identificarUsuaria({ tipo, valor })
      setCliente(identificado)
      setValor('')
    } catch (erroIdentificacao) {
      setErroServico(
        erroIdentificacao instanceof ErroIdentificacao
          ? erroIdentificacao.message
          : 'Não foi possível validar sua identificação agora. Tente novamente em instantes.',
      )
    } finally {
      setValidando(false)
    }
  }

  function trocarIdentificacao() {
    setCliente(null)
    setValor('')
    setErroFormato(null)
    setErroServico(null)
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  const limite = tipo === 'CPF' ? 14 : tipo === 'EMAIL' ? 254 : 20
  const descricaoErro = [
    erroFormato ? 'identificador-erro' : null,
    erroServico ? 'identificador-erro-servico' : null,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-[#172033]">
      <header className="flex h-16 items-center justify-between border-b border-[#e5e8ee] bg-white px-6 lg:px-12">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-[#253a83] text-white">
            <Sparkles className="size-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight">Portal de Serviços</span>
        </div>
        <div className="flex items-center gap-5 text-sm text-[#68738a]">
          <button className="hidden items-center gap-2 md:flex">
            <HelpCircle className="size-4" /> Central de ajuda
          </button>
          <Separator orientation="vertical" className="hidden h-6 md:block" />
          <div className="flex items-center gap-2 font-medium text-[#34405b]">
            <ShieldCheck className="size-4 text-[#2c876a]" /> Ambiente seguro
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1180px] gap-6 px-4 py-7 md:px-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:px-12 lg:py-9">
        <section className="min-w-0">
          <div className="mb-5">
            <p className="mb-1 text-xs font-medium text-[#5f6b80]">Atendimento digital / Identificação</p>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-[#172033]">Vamos começar</h1>
                <p className="mt-1 text-sm text-[#5b6578]">Identifique-se para um atendimento seguro e personalizado.</p>
              </div>
              <Badge variant="secondary" className="gap-1.5 bg-[#eef1ff] px-3 py-1.5 font-medium text-[#3c4c9b]">
                <span className="size-1.5 rounded-full bg-[#5268d4]" /> Etapa 1 de 2
              </Badge>
            </div>
          </div>

          <Card className="overflow-hidden border-[#e3e7ee] bg-white shadow-[0_10px_30px_rgba(28,42,75,0.05)]">
            <CardHeader className="border-b border-[#edf0f4] px-5 py-4 sm:px-7">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-full bg-[#253a83] text-white">
                    <Bot className="size-5" />
                  </div>
                  <div>
                    {acolhimento ? (
                      <p className="text-sm font-semibold">
                        {acolhimento.assistente.nome}
                        <span className="ml-1.5 rounded bg-[#edf7f3] px-1.5 py-0.5 text-[10px] font-medium text-[#256b55]">
                          {acolhimento.assistente.papel}
                        </span>
                      </p>
                    ) : (
                      <Skeleton className="h-4 w-28" />
                    )}
                    <p className="text-xs text-[#5f6b80]">Vou guiar você durante todo o processo</p>
                  </div>
                </div>
                {acolhimento && (
                  <Badge variant="outline" className="hidden gap-1.5 border-[#dbe0e8] font-normal text-[#68738a] sm:flex">
                    <MessageCircle className="size-3" /> {rotuloCanal(acolhimento.canal)}
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div
                className="flex min-h-[460px] flex-col gap-5 px-5 py-6 sm:px-7"
                aria-live="polite"
                aria-busy={estado === 'carregando'}
              >
                {estado === 'carregando' && <Carregando />}

                {estado === 'erro' && (
                  <div className="flex gap-3" role="alert">
                    <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-[#fdecec] text-[#b42318]">
                      <TriangleAlert className="size-4" />
                    </div>
                    <div className="max-w-[75%] rounded-2xl rounded-tl-sm bg-[#fef3f2] px-4 py-3 text-sm leading-6 text-[#912018]">
                      <p className="font-semibold">Não foi possível iniciar o atendimento.</p>
                      <p>Verifique sua conexão e tente novamente.</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3 border-[#f2c6c2] bg-white text-[#912018]"
                        onClick={() => void carregar()}
                      >
                        <RefreshCw className="size-3.5" /> Tentar novamente
                      </Button>
                    </div>
                  </div>
                )}

                {estado === 'pronto' && acolhimento && !cliente && (
                  <>
                    {acolhimento.mensagens.map((mensagem) => (
                      <MensagemAssistente key={mensagem}>{mensagem}</MensagemAssistente>
                    ))}

                    {acolhimento.requerIdentificacao ? (
                      <div className="ml-0 rounded-2xl border border-[#dfe4ec] bg-[#fbfcfd] p-4 sm:ml-10 sm:p-5">
                        <form onSubmit={(evento) => void handleSubmit(evento)} noValidate>
                          <fieldset disabled={validando}>
                            <legend className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#5f6b80]">
                              Como você quer se identificar?
                            </legend>

                            <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Tipo de identificação">
                              {acolhimento.identificadores.map((opcao) => {
                                const Icone = ICONE[opcao.tipo]
                                return (
                                  <label key={opcao.tipo} className="cursor-pointer">
                                    <input
                                      type="radio"
                                      name="tipo-identificacao"
                                      value={opcao.tipo}
                                      checked={tipo === opcao.tipo}
                                      onChange={() => trocarTipo(opcao.tipo)}
                                      className="peer sr-only"
                                    />
                                    <span className="flex items-center gap-2 rounded-lg border border-[#dfe4ec] bg-white px-3 py-2 text-sm text-[#68738a] transition-colors hover:border-[#c9d0de] peer-checked:border-[#253a83] peer-checked:bg-[#e9edff] peer-checked:font-medium peer-checked:text-[#253a83] peer-focus-visible:ring-3 peer-focus-visible:ring-[#5268d4]/40">
                                      <Icone className="size-3.5" /> {opcao.rotulo}
                                    </span>
                                  </label>
                                )
                              })}
                            </div>

                            <div className="mt-5">
                              <label htmlFor="identificador" className="text-sm font-medium text-[#34405b]">
                                {opcaoAtual?.rotulo ?? 'Identificação'}
                              </label>
                              <Input
                                ref={inputRef}
                                id="identificador"
                                value={valor}
                                onChange={handleValorChange}
                                type={tipo === 'EMAIL' ? 'email' : 'text'}
                                inputMode={tipo === 'CPF' ? 'numeric' : tipo === 'EMAIL' ? 'email' : 'text'}
                                autoComplete={tipo === 'EMAIL' ? 'email' : 'off'}
                                placeholder={opcaoAtual?.placeholder}
                                maxLength={limite}
                                spellCheck={false}
                                aria-required="true"
                                aria-invalid={Boolean(erroFormato || erroServico)}
                                aria-describedby={['identificador-ajuda', descricaoErro].filter(Boolean).join(' ') || undefined}
                                className="mt-1.5 h-11 bg-white text-sm shadow-none focus-visible:ring-[#5268d4]"
                              />
                              <p id="identificador-ajuda" className="mt-1.5 text-xs text-[#68738a]">
                                {opcaoAtual?.ajuda}
                              </p>

                              {erroFormato && (
                                <p id="identificador-erro" role="alert" className="mt-2 flex items-start gap-1.5 text-xs font-medium text-[#b42318]">
                                  <TriangleAlert className="mt-0.5 size-3.5 shrink-0" /> {erroFormato}
                                </p>
                              )}
                            </div>

                            {erroServico && (
                              <div id="identificador-erro-servico" role="alert" className="mt-3 rounded-lg border border-[#f2c6c2] bg-[#fef3f2] px-3 py-2.5 text-xs leading-5 text-[#912018]">
                                {erroServico}
                              </div>
                            )}

                            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <p className="flex items-center gap-1.5 text-[11px] text-[#68738a]">
                                <LockKeyhole className="size-3.5 shrink-0 text-[#2c876a]" />
                                Seus dados são usados apenas para localizar seu cadastro.
                              </p>
                              <Button
                                type="submit"
                                disabled={validando}
                                className="h-9 shrink-0 bg-[#253a83] px-4 text-white hover:bg-[#1f3070]"
                              >
                                {validando ? (
                                  <>
                                    <LoaderCircle className="size-4 animate-spin" /> Validando…
                                  </>
                                ) : (
                                  <>
                                    Continuar <ArrowRight className="size-4" />
                                  </>
                                )}
                              </Button>
                            </div>
                          </fieldset>
                        </form>
                      </div>
                    ) : (
                      <div className="ml-0 rounded-2xl border border-[#dfe4ec] bg-[#fbfcfd] p-4 sm:ml-10 sm:p-5">
                        <p className="text-sm text-[#3e4a62]">Este atendimento não exige identificação. Você pode continuar.</p>
                        <Button
                          className="mt-3 h-9 bg-[#253a83] px-4 text-white hover:bg-[#1f3070]"
                          onClick={() => onProsseguir(null)}
                        >
                          Continuar <ArrowRight className="size-4" />
                        </Button>
                      </div>
                    )}
                  </>
                )}

                {estado === 'pronto' && acolhimento && cliente && (
                  <>
                    {acolhimento.mensagens.slice(0, 1).map((mensagem) => (
                      <MensagemAssistente key={mensagem}>{mensagem}</MensagemAssistente>
                    ))}

                    <div className="flex gap-3">
                      <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-[#e9f6f0] text-[#2c876a]">
                        <Check className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div
                          ref={sucessoRef}
                          tabIndex={-1}
                          className="max-w-none rounded-2xl rounded-tl-sm bg-[#edf8f3] px-4 py-3 text-sm leading-6 text-[#256b55] outline-none sm:max-w-[85%]"
                        >
                          <p className="font-semibold">Perfeito, {primeiroNome}! Encontrei seu cadastro.</p>
                          <p>Agora podemos seguir com um atendimento personalizado.</p>
                        </div>

                        <div className="mt-3 max-w-none rounded-2xl border border-[#cbe7da] bg-white p-4 shadow-[0_10px_30px_rgba(28,42,75,0.05)] sm:max-w-[85%]">
                          <div className="flex items-start gap-3">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#edf8f3] text-[#2c876a]">
                              <ShieldCheck className="size-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#5f6b80]">Identificação concluída</p>
                              <p className="mt-1 truncate text-base font-semibold text-[#172033]">{cliente.nome}</p>
                              <p className="text-xs text-[#68738a]">CPF {cliente.cpfMascarado}</p>
                              <p className="text-xs text-[#68738a]">
                                Identificado por {ROTULO_TIPO[cliente.identificadorUsado.tipo]}
                                {cliente.identificadorUsado.tipo === 'EMAIL' &&
                                  ` · ${cliente.identificadorUsado.valorMascarado}`}
                              </p>
                            </div>
                          </div>

                          <Separator className="my-4" />

                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <Button
                              className="h-9 bg-[#253a83] px-4 text-white hover:bg-[#1f3070]"
                              onClick={() => onProsseguir(cliente)}
                            >
                              Continuar para o atendimento <ArrowRight className="size-4" />
                            </Button>
                            <Button variant="ghost" className="h-9 px-3 text-[#68738a]" onClick={trocarIdentificacao}>
                              Não sou eu
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <p className="mt-3 flex items-center gap-1.5 px-1 text-[11px] text-[#5f6b80]">
            <LockKeyhole className="size-3.5" /> Atendimento protegido. Seu CPF nunca é exibido por completo.
          </p>
        </section>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
          <Card className="border-[#e3e7ee] bg-white shadow-none">
            <CardContent className="p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#5f6b80]">Etapas do atendimento</p>
              <ol className="mt-4 flex flex-col gap-3 text-sm">
                <li className="flex gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#253a83] text-[11px] font-bold text-white">1</span>
                  <div>
                    <p className="font-medium text-[#34405b]">Identificação</p>
                    <p className="text-xs text-[#68738a]">Confirmamos quem você é.</p>
                  </div>
                </li>
                <li className="flex gap-3 text-[#5f6b80]">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-[#dfe4ec] text-[11px] font-bold">2</span>
                  <div>
                    <p className="font-medium">Atendimento</p>
                    <p className="text-xs">Você conversa com a assistente.</p>
                  </div>
                </li>
              </ol>
            </CardContent>
          </Card>

          <Card className="border-[#e3e7ee] bg-white shadow-none">
            <CardContent className="p-5">
              <div className="mb-3 flex size-9 items-center justify-center rounded-lg bg-[#eef1ff] text-[#253a83]">
                <ShieldCheck className="size-4" />
              </div>
              <p className="text-sm font-semibold text-[#34405b]">Por que pedimos seus dados?</p>
              <p className="mt-1 text-xs leading-5 text-[#68738a]">
                A identificação localiza seu cadastro e personaliza o atendimento. O CPF aparece apenas de forma mascarada.
              </p>
              <Separator className="my-4" />
              <ul className="flex flex-col gap-2.5 text-xs text-[#68738a]">
                <li className="flex gap-2">
                  <LockKeyhole className="mt-0.5 size-3.5 shrink-0 text-[#2c876a]" /> Dados mascarados na tela
                </li>
                <li className="flex gap-2">
                  <MessageCircle className="mt-0.5 size-3.5 shrink-0 text-[#2c876a]" /> Mesmo canal do início ao fim
                </li>
                <li className="flex gap-2">
                  <Clock3 className="mt-0.5 size-3.5 shrink-0 text-[#2c876a]" /> Você pode trocar de identificação
                </li>
              </ul>
            </CardContent>
          </Card>

          {dadosDemonstracao && (
            <details className="rounded-xl border border-[#e3e7ee] bg-white p-4 text-xs text-[#68738a]">
              <summary className="cursor-pointer font-medium text-[#34405b]">Dados para demonstração</summary>
              <dl className="mt-3 flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-3">
                  <dt>CPF</dt>
                  <dd className="font-mono text-[#34405b]">{dadosDemonstracao.cpf}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt>E-mail</dt>
                  <dd className="truncate font-mono text-[#34405b]">{dadosDemonstracao.email}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt>Código</dt>
                  <dd className="font-mono text-[#34405b]">{dadosDemonstracao.codigo}</dd>
                </div>
              </dl>
              <p className="mt-2 text-[11px] leading-4 text-[#5f6b80]">
                Qualquer outro valor com formato válido simula cadastro não encontrado.
              </p>
            </details>
          )}
        </aside>
      </div>
    </main>
  )
}

function MensagemAssistente({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-[#e9edff] text-[#314692]">
        <Bot className="size-4" />
      </div>
      <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-[#f3f5f8] px-4 py-3 text-sm leading-6 text-[#3e4a62]">
        {children}
      </div>
    </div>
  )
}

function Carregando() {
  return (
    <div role="status" className="flex flex-col gap-4">
      <span className="sr-only">Carregando acolhimento…</span>
      <div className="flex gap-3">
        <Skeleton className="size-7 shrink-0 rounded-full" />
        <Skeleton className="h-16 w-3/4 rounded-2xl" />
      </div>
      <div className="flex gap-3">
        <Skeleton className="size-7 shrink-0 rounded-full" />
        <Skeleton className="h-20 w-2/3 rounded-2xl" />
      </div>
      <div className="ml-0 rounded-2xl border border-[#dfe4ec] bg-[#fbfcfd] p-4 sm:ml-10 sm:p-5">
        <Skeleton className="h-3 w-44" />
        <div className="mt-4 flex gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-28" />
        </div>
        <Skeleton className="mt-5 h-11 w-full" />
        <div className="mt-5 flex items-center justify-between gap-3">
          <Skeleton className="h-3 w-48" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>
    </div>
  )
}

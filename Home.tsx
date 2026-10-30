import { useCallback, useEffect, useState } from 'react'
import { ArrowUp, Bot, Check, ChevronDown, Clock3, FileText, HelpCircle, LoaderCircle, Paperclip, ShieldCheck, Sparkles, TriangleAlert, UserRound } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { opcoesSistema, resumo, usuario } from '@/services/app'
import { listarConversas } from '@/services/conversas'
import { ErroHttp } from '@/services/http'
import { enviarMensagem, listarMensagens } from '@/services/mensagens'
import { criarSolicitacao } from '@/services/solicitacoes'
import type { ClienteIdentificado, Conversa, Mensagem, SolicitacaoRegistrada, StatusConversa } from '@/lib/types'

type EstadoConversa = 'carregando' | 'pronto' | 'erro'
type EstadoRegistro = 'ocioso' | 'enviando' | 'sucesso' | 'erro'

const ROTULO_STATUS: Record<StatusConversa, string> = {
  ATIVA: 'Ativa',
  AGUARDANDO_ATENDIMENTO_HUMANO: 'Aguard. humano',
  EM_ATENDIMENTO_HUMANO: 'Em atendimento',
  ENCERRADA: 'Encerrada',
}

const CLASSE_STATUS: Record<StatusConversa, string> = {
  ATIVA: 'bg-[#e9f6f0] text-[#256b55]',
  AGUARDANDO_ATENDIMENTO_HUMANO: 'bg-[#fff7e6] text-[#8a5a00]',
  EM_ATENDIMENTO_HUMANO: 'bg-[#eef1ff] text-[#3c4c9b]',
  ENCERRADA: 'bg-[#f0f2f6] text-[#5b6578]',
}

export default function Home({ cliente }: { cliente?: ClienteIdentificado | null }) {
  const [conversas, setConversas] = useState<Conversa[]>([])
  const [conversaId, setConversaId] = useState<number | null>(null)
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [paginaMensagens, setPaginaMensagens] = useState(0)
  const [totalPaginasMensagens, setTotalPaginasMensagens] = useState(0)
  const [carregandoAnteriores, setCarregandoAnteriores] = useState(false)
  const [erroAnteriores, setErroAnteriores] = useState(false)
  const [estado, setEstado] = useState<EstadoConversa>('carregando')
  const [message, setMessage] = useState('')
  const [enviandoMensagem, setEnviandoMensagem] = useState(false)
  const [erroEnvio, setErroEnvio] = useState(false)
  const [conversaEncerrada, setConversaEncerrada] = useState(false)
  const [registro, setRegistro] = useState<EstadoRegistro>('ocioso')
  const [solicitacao, setSolicitacao] = useState<SolicitacaoRegistrada | null>(null)

  const carregar = useCallback(async () => {
    setEstado('carregando')
    try {
      const pagina = await listarConversas()
      setConversas(pagina.conteudo)
      const conversa = pagina.conteudo[0]
      if (!conversa) {
        setConversaId(null)
        setMensagens([])
        setPaginaMensagens(0)
        setTotalPaginasMensagens(0)
      } else {
        setConversaId(conversa.id)
        const mensagensDaConversa = await listarMensagens(conversa.id)
        setMensagens(mensagensDaConversa.conteudo)
        setPaginaMensagens(mensagensDaConversa.pagina)
        setTotalPaginasMensagens(mensagensDaConversa.totalPaginas)
      }
      setErroAnteriores(false)
      setEstado('pronto')
    } catch {
      setEstado('erro')
    }
  }, [])

  useEffect(() => {
    void carregar()
  }, [carregar])

  async function selecionarConversa(id: number) {
    setConversaId(id)
    setEstado('carregando')
    setErroEnvio(false)
    setConversaEncerrada(false)
    setErroAnteriores(false)
    try {
      const mensagensDaConversa = await listarMensagens(id)
      setMensagens(mensagensDaConversa.conteudo)
      setPaginaMensagens(mensagensDaConversa.pagina)
      setTotalPaginasMensagens(mensagensDaConversa.totalPaginas)
      setEstado('pronto')
    } catch {
      setEstado('erro')
    }
  }

  async function carregarAnteriores() {
    if (conversaId === null || carregandoAnteriores || paginaMensagens + 1 >= totalPaginasMensagens) return
    setCarregandoAnteriores(true)
    setErroAnteriores(false)
    try {
      const pagina = await listarMensagens(conversaId, paginaMensagens + 1)
      setMensagens((atual) => {
        const ids = new Set(atual.map((mensagem) => mensagem.id))
        return [...pagina.conteudo.filter((mensagem) => !ids.has(mensagem.id)), ...atual]
      })
      setPaginaMensagens(pagina.pagina)
      setTotalPaginasMensagens(pagina.totalPaginas)
    } catch {
      setErroAnteriores(true)
    } finally {
      setCarregandoAnteriores(false)
    }
  }

  async function handleEnviar() {
    const texto = message.trim()
    if (!texto || enviandoMensagem || conversaId === null) return
    setEnviandoMensagem(true)
    setErroEnvio(false)
    try {
      const nova = await enviarMensagem(conversaId, texto)
      setMensagens((atual) => [...atual, nova])
      setTotalPaginasMensagens((total) => Math.max(total, Math.ceil((mensagens.length + 1) / 50)))
      setMessage('')
    } catch (erro) {
      if (erro instanceof ErroHttp && erro.status === 409) {
        setConversaEncerrada(true)
      } else {
        setErroEnvio(true)
      }
    } finally {
      setEnviandoMensagem(false)
    }
  }

  async function handleRegistrar() {
    setRegistro('enviando')
    try {
      setSolicitacao(await criarSolicitacao())
      setRegistro('sucesso')
    } catch {
      setRegistro('erro')
    }
  }

  const anonimo = cliente === null
  const nome = cliente?.nome ?? (anonimo ? 'Visitante' : usuario.nome)
  const primeiroNome = cliente ? cliente.nome.split(' ')[0] : anonimo ? null : usuario.nome.split(' ')[0]
  const cpfMascarado = cliente?.cpfMascarado ?? (anonimo ? null : usuario.cpfMascarado)
  const iniciais = nome.split(' ').filter(Boolean).map((parte) => parte[0]).slice(0, 2).join('').toUpperCase()
  const transcript =
    estado === 'pronto'
      ? mensagens.map((item) => ({ role: item.remetente === 'CLIENTE' ? 'user' : 'assistant', text: item.conteudo }))
      : []

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-[#172033]">
      <header className="flex h-16 items-center justify-between border-b border-[#e5e8ee] bg-white px-6 lg:px-12">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-[#253a83] text-white"><Sparkles className="size-5" /></div>
          <span className="text-lg font-semibold tracking-tight">Portal de Serviços</span>
        </div>
        <div className="flex items-center gap-5 text-sm text-[#5b6578]">
          <button className="hidden items-center gap-2 md:flex"><HelpCircle className="size-4" /> Central de ajuda</button>
          <Separator orientation="vertical" className="hidden h-6 md:block" />
          <div className="flex items-center gap-2 font-medium text-[#34405b]"><div className="flex size-8 items-center justify-center rounded-full bg-[#e6ebff] text-xs font-bold text-[#253a83]">{iniciais}</div> {nome} <ChevronDown className="size-4" /></div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-4 py-7 md:px-8 lg:flex-row lg:px-12">
        <aside className="w-full shrink-0 lg:w-[230px]">
          <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[#5f6b80]">Atendimento</p>
          <nav className="flex gap-1 overflow-auto lg:flex-col">
            <a className="flex items-center gap-3 rounded-lg bg-[#e9edff] px-3 py-2.5 text-sm font-semibold text-[#253a83]" href="#"><FileText className="size-4" /> Novo chamado</a>
            <a className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#5b6578] hover:bg-white" href="#"><Clock3 className="size-4" /> Minhas solicitações</a>
          </nav>

          <div className="mt-6">
            <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[#5f6b80]">Conversas</p>
            <ul className="flex flex-col gap-1">
              {conversas.length === 0 && <li className="px-3 text-xs text-[#5f6b80]">Nenhuma conversa.</li>}
              {conversas.map((conversa) => (
                <li key={conversa.id}>
                  <button
                    onClick={() => void selecionarConversa(conversa.id)}
                    aria-current={conversa.id === conversaId}
                    className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${conversa.id === conversaId ? 'bg-[#e9edff] font-semibold text-[#253a83]' : 'text-[#5b6578] hover:bg-white'}`}
                  >
                    <span className="truncate">{conversa.cliente.nome}</span>
                    <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${CLASSE_STATUS[conversa.status]}`}>{ROTULO_STATUS[conversa.status]}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-10 hidden rounded-xl border border-[#e2e6ed] bg-white p-4 lg:block">
            <div className="mb-3 flex size-8 items-center justify-center rounded-lg bg-[#eef1ff] text-[#253a83]"><ShieldCheck className="size-4" /></div>
            <p className="text-xs font-semibold text-[#34405b]">Seus dados estão seguros</p>
            <p className="mt-1 text-[11px] leading-4 text-[#5f6b80]">Utilizamos seus dados apenas para realizar o atendimento.</p>
            <p className="mt-2 rounded bg-[#f7f8fa] px-2 py-1 text-[11px] font-medium text-[#5b6578]">{cpfMascarado ? `CPF ${cpfMascarado}` : 'Identificação não informada'}</p>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <div className="mb-5 flex items-end justify-between">
            <div><p className="mb-1 text-xs font-medium text-[#5f6b80]">Atendimento digital / Novo chamado</p><h1 className="text-2xl font-semibold tracking-tight text-[#172033]">Abertura de solicitação</h1></div>
            <Badge variant="secondary" className="hidden gap-1.5 bg-[#eef1ff] px-3 py-1.5 font-medium text-[#3c4c9b] sm:flex"><span className="size-1.5 rounded-full bg-[#5268d4]" /> Em andamento</Badge>
          </div>
          <Card className="overflow-hidden border-[#e3e7ee] bg-white shadow-[0_10px_30px_rgba(28,42,75,0.05)]">
            <CardHeader className="border-b border-[#edf0f4] px-5 py-4 sm:px-7"><div className="flex items-center gap-3"><div className="flex size-9 items-center justify-center rounded-full bg-[#253a83] text-white"><Bot className="size-5" /></div><div><p className="text-sm font-semibold">Lia <span className="ml-1.5 rounded bg-[#edf7f3] px-1.5 py-0.5 text-[10px] font-medium text-[#256b55]">Assistente</span></p><p className="text-xs text-[#5f6b80]">{primeiroNome ? `Olá, ${primeiroNome}! ` : ''}Vou guiar você durante todo o processo</p></div></div></CardHeader>
            <CardContent className="p-0">
              <div className="flex min-h-[420px] flex-col gap-5 px-5 py-6 sm:px-7" aria-live="polite">
                {estado === 'pronto' && paginaMensagens + 1 < totalPaginasMensagens && <div className="flex flex-col items-center gap-2"><Button variant="outline" size="sm" className="border-[#cdd4e2] bg-white text-[#34405b]" onClick={() => void carregarAnteriores()} disabled={carregandoAnteriores}>{carregandoAnteriores ? <><LoaderCircle className="size-4 animate-spin" /> Carregando…</> : 'Carregar mensagens anteriores'}</Button>{erroAnteriores && <p role="alert" className="text-[11px] font-medium text-[#b42318]">Não foi possível carregar as mensagens anteriores.</p>}</div>}
                {estado === 'carregando' && <div className="flex flex-col gap-4"><Skeleton className="h-16 w-3/4 rounded-2xl" /><Skeleton className="ml-auto h-12 w-1/2 rounded-2xl" /><Skeleton className="h-16 w-2/3 rounded-2xl" /></div>}
                {estado === 'erro' && <div className="flex gap-3"><div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-[#fdecec] text-[#b42318]"><TriangleAlert className="size-4" /></div><div className="max-w-[75%] rounded-2xl rounded-tl-sm bg-[#fef3f2] px-4 py-3 text-sm leading-6 text-[#912018]"><p className="font-semibold">Não foi possível carregar a conversa.</p><p>Verifique sua conexão e tente novamente.</p><Button variant="outline" size="sm" className="mt-3 border-[#f2c6c2] bg-white text-[#912018]" onClick={() => void carregar()}>Tentar novamente</Button></div></div>}
                {estado === 'pronto' && mensagens.length === 0 && <p className="text-center text-sm text-[#5f6b80]">{conversaId === null ? 'Nenhuma conversa encontrada.' : 'Nenhuma mensagem ainda. Envie a primeira para começar.'}</p>}
                {transcript.map((item, index) => <div key={index} className={`flex gap-3 ${item.role === 'user' ? 'flex-row-reverse' : ''}`}><div className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full ${item.role === 'user' ? 'bg-[#f0f2f6] text-[#5b6578]' : 'bg-[#e9edff] text-[#314692]'}`}>{item.role === 'user' ? <UserRound className="size-3.5" /> : <Bot className="size-4" />}</div><div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-6 ${item.role === 'user' ? 'rounded-tr-sm bg-[#253a83] text-white' : 'rounded-tl-sm bg-[#f3f5f8] text-[#3e4a62]'}`}>{item.text.split('\n').map((line, i) => <span key={i}>{line}{i < item.text.split('\n').length - 1 && <br />}</span>)}</div></div>)}
                {estado === 'pronto' && <div className="flex gap-3"><div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-[#e9edff] text-[#314692]"><Bot className="size-4" /></div><div className="max-w-[75%] rounded-2xl rounded-tl-sm bg-[#f3f5f8] px-4 py-3 text-sm text-[#3e4a62]"><p className="mb-3">Selecione uma opção:</p><div className="flex flex-wrap gap-2">{opcoesSistema.map((opcao) => <Button key={opcao} variant="outline" size="sm" className="border-[#cdd4e2] bg-white text-[#34405b]" onClick={() => setMessage(opcao)}>{opcao}</Button>)}</div></div></div>}
                {registro === 'enviando' && <div className="flex gap-3"><div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-[#e9edff] text-[#314692]"><Bot className="size-4" /></div><div className="flex items-center gap-2 rounded-2xl rounded-tl-sm bg-[#f3f5f8] px-4 py-3 text-sm text-[#3e4a62]"><LoaderCircle className="size-4 animate-spin" /> Registrando sua solicitação…</div></div>}
                {registro === 'erro' && <div className="flex gap-3"><div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-[#fdecec] text-[#b42318]"><TriangleAlert className="size-4" /></div><div className="max-w-[75%] rounded-2xl rounded-tl-sm bg-[#fef3f2] px-4 py-3 text-sm leading-6 text-[#912018]"><p className="font-semibold">Não foi possível registrar a solicitação.</p><p>Nada foi enviado e os dados preenchidos continuam aqui.</p><Button variant="outline" size="sm" className="mt-3 border-[#f2c6c2] bg-white text-[#912018]" onClick={() => void handleRegistrar()}>Tentar novamente</Button></div></div>}
                {registro === 'sucesso' && solicitacao && <div className="flex gap-3"><div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-[#e9f6f0] text-[#256b55]"><Check className="size-4" /></div><div className="rounded-2xl rounded-tl-sm bg-[#edf8f3] px-4 py-3 text-sm leading-6 text-[#256b55]"><p className="font-semibold">Solicitação registrada com sucesso!</p><p>Protocolo <strong className="font-mono">{solicitacao.protocolo}</strong> · Retorno previsto {solicitacao.estimativaRetorno}.</p><Button variant="outline" size="sm" className="mt-3 border-[#b6dfcd] bg-white text-[#256b55]" onClick={() => { setRegistro('ocioso'); setSolicitacao(null) }}>Abrir nova solicitação</Button></div></div>}
              </div>
              <div className="border-t border-[#edf0f4] bg-[#fbfcfd] p-4 sm:px-7"><div className="relative"><Textarea value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleEnviar() } }} placeholder="Digite sua resposta..." className="min-h-10 resize-none border-[#dfe4ec] bg-white pl-12 pr-24 text-sm shadow-none focus-visible:ring-[#5268d4]" /><div className="absolute bottom-1 left-1 flex gap-1"><Button variant="ghost" size="icon" aria-label="Anexar arquivo" className="size-8 text-[#8490a4]"><Paperclip className="size-4" /></Button></div><Button size="icon" aria-label="Enviar resposta" className="absolute bottom-1 right-1 size-8 rounded-lg bg-[#253a83] text-white hover:bg-[#1f3070]" onClick={() => void handleEnviar()} disabled={enviandoMensagem || conversaId === null || conversaEncerrada} aria-busy={enviandoMensagem}>{enviandoMensagem ? <LoaderCircle className="size-4 animate-spin" /> : <ArrowUp className="size-4" />}</Button></div>{conversaEncerrada && <p role="alert" className="mt-2 text-[11px] font-medium text-[#b42318]">Esta conversa foi encerrada e não aceita novas mensagens.</p>}
              {erroEnvio && <p role="alert" className="mt-2 text-[11px] font-medium text-[#b42318]">Não foi possível enviar. Sua mensagem foi mantida — tente novamente.</p>}
              <p className="mt-2 text-[11px] text-[#5f6b80]">Pressione Enter para enviar · Seus dados são tratados de forma segura</p></div>
            </CardContent>
          </Card>
        </section>

        <aside className="hidden w-[245px] shrink-0 xl:block"><Card className="border-[#e3e7ee] bg-white shadow-none"><CardContent className="p-5"><p className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-[#5f6b80]">Resumo da solicitação</p><div className="flex flex-col gap-4 text-sm"><div><p className="mb-1 text-xs text-[#5f6b80]">Tipo</p><p className="font-medium text-[#34405b]">{resumo.tipo}</p></div><div><p className="mb-1 text-xs text-[#5f6b80]">Área responsável</p><p className="font-medium text-[#34405b]">{resumo.areaResponsavel}</p></div><div><p className="mb-1 text-xs text-[#5f6b80]">Prioridade</p><Badge variant="outline" className="border-[#dbe0e8] font-normal text-[#5b6578]">{resumo.prioridade}</Badge></div></div><Separator className="my-5" /><div className="mb-4 flex gap-2 text-xs leading-5 text-[#5f6b80]"><Clock3 className="mt-0.5 size-4 shrink-0" /> Tempo médio de retorno: {resumo.estimativaRetorno}</div><Button className="w-full bg-[#253a83] text-white hover:bg-[#1f3070]" disabled={registro === 'enviando' || registro === 'sucesso'} onClick={() => void handleRegistrar()}>{registro === 'enviando' ? <><LoaderCircle className="size-4 animate-spin" /> Registrando…</> : registro === 'sucesso' ? 'Solicitação registrada' : 'Confirmar e registrar'}</Button></CardContent></Card></aside>
      </div>
    </main>
  )
}

import type { Acolhimento, Conversa, Mensagem, ResumoSolicitacao, SolicitacaoRegistrada, Usuario } from '@/lib/types'

export const acolhimentoMock: Acolhimento = {
  assistente: { nome: 'Lia', papel: 'Assistente digital' },
  mensagens: [
    'Olá! Eu sou a Lia, assistente digital do Portal de Serviços. Que bom ter você por aqui.',
    'Para começar e garantir um atendimento personalizado, preciso confirmar quem você é. Informe seu CPF, e-mail ou código de acesso.',
  ],
  canal: 'WEB',
  requerIdentificacao: true,
  identificadores: [
    {
      tipo: 'CPF',
      rotulo: 'CPF',
      placeholder: '000.000.000-00',
      ajuda: 'Digite os 11 dígitos. Seu CPF não é exibido por completo.',
    },
    {
      tipo: 'EMAIL',
      rotulo: 'E-mail',
      placeholder: 'nome@empresa.com',
      ajuda: 'Use o e-mail cadastrado no Portal de Serviços.',
    },
    {
      tipo: 'CODIGO',
      rotulo: 'Código de acesso',
      placeholder: 'Ex.: ACESSO-2026',
      ajuda: 'Informe o código enviado pela organização.',
    },
  ],
}

/**
 * Cadastro usado apenas no modo mock. O CPF é válido de propósito para que o
 * caminho feliz possa ser testado sem decorar números aleatórios.
 */
export interface ClienteMock {
  id: number
  nome: string
  cpf: string
  email: string
  codigo: string
}

export const clientesMock: ClienteMock[] = [
  {
    id: 1,
    nome: 'Mariana Souza',
    cpf: '12345678909',
    email: 'mariana.souza@exemplo.com',
    codigo: 'MARIANA2026',
  },
]

export const conversaMock: Conversa = {
  id: 1,
  cliente: { id: 1, nome: 'Mariana Souza' },
  canal: 'WEB',
  status: 'ATIVA',
  iniciadaEm: '2026-10-23T14:02:11',
  ultimaInteracaoEm: '2026-10-23T14:09:40',
}

export const mensagensMock: Mensagem[] = [
  {
    id: 1,
    remetente: 'CHATBOT',
    conteudo:
      'Olá, Mariana! Eu sou a Lia, sua assistente digital. Posso ajudar você a abrir um chamado ou consultar uma solicitação. Como posso ajudar hoje?',
    enviadaEm: '2026-10-23T14:02:11',
  },
  {
    id: 2,
    remetente: 'CLIENTE',
    conteudo: 'Quero abrir um chamado sobre meu acesso ao sistema.',
    enviadaEm: '2026-10-23T14:03:02',
  },
  {
    id: 3,
    remetente: 'CHATBOT',
    conteudo:
      'Entendi. Vou fazer algumas perguntas rápidas para registrar sua solicitação corretamente.\n\nQual sistema está apresentando o problema?',
    enviadaEm: '2026-10-23T14:03:05',
  },
]

export const opcoesSistemaMock = ['Sistema Corporativo', 'Portal RH', 'Outro sistema']

export const resumoMock: ResumoSolicitacao = {
  tipo: 'Acesso a sistema',
  areaResponsavel: 'Tecnologia da Informação',
  prioridade: 'Normal',
  estimativaRetorno: 'até 2 dias úteis',
}

export const solicitacaoMock: SolicitacaoRegistrada = {
  protocolo: '2026-10482',
  estimativaRetorno: 'até 2 dias úteis',
}

/** Usuário logado — ainda não vem de endpoint nenhum. */
export const usuarioMock: Usuario = {
  nome: 'Mariana Souza',
  cpfMascarado: '***.***.***-**',
}

/** Simula latência de rede nos mocks. */
export const atraso = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** Data/hora local sem offset, no formato que o backend envia (LocalDateTime). */
export function agoraLocal(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

import type { Conversa, Mensagem, ResumoSolicitacao, SolicitacaoRegistrada, Usuario } from '@/lib/types'

/**
 * ⚠️ DADOS MOCKADOS — nada aqui vem da API.
 *
 * Único lugar do projeto que inventa dados de negócio. Os tipos são os mesmos
 * usados contra a API real, então trocar mock por backend não toca nas telas.
 * Desligue com `VITE_USAR_MOCK=false`.
 */

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

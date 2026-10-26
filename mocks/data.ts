import type { ChatMessage, Protocolo, ResumoSolicitacao, Usuario } from '@/lib/types'

/**
 * ⚠️ DADOS MOCKADOS — nada aqui vem da API.
 *
 * Este é o único lugar do projeto que inventa dados de negócio. Quando o backend
 * expuser os endpoints reais (contexto-front.md, seção 4.5), basta apagar este
 * arquivo e desligar `USAR_MOCK` em services/messages.ts — os componentes não mudam.
 */

export const usuarioMock: Usuario = {
  nome: 'Mariana Silva',
  cpfMascarado: '***.***.***-**',
}

export const mensagensMock: ChatMessage[] = [
  {
    id: 1,
    sender: 'ASSISTANT',
    content:
      'Olá, Mariana! Eu sou a Lia, sua assistente digital. Posso ajudar você a abrir um chamado ou consultar uma solicitação. Como posso ajudar hoje?',
    timestamp: '2026-10-08T14:32:11.456',
  },
  {
    id: 2,
    sender: 'USER',
    content: 'Quero abrir um chamado sobre meu acesso ao sistema.',
    timestamp: '2026-10-08T14:33:02.789',
  },
  {
    id: 3,
    sender: 'ASSISTANT',
    content:
      'Entendi. Vou fazer algumas perguntas rápidas para registrar sua solicitação corretamente.\n\nQual sistema está apresentando o problema?',
    timestamp: '2026-10-08T14:33:05.120',
  },
]

export const opcoesSistemaMock = ['Sistema Corporativo', 'Portal RH', 'Outro sistema']

export const resumoMock: ResumoSolicitacao = {
  tipo: 'Acesso a sistema',
  areaResponsavel: 'Tecnologia da Informação',
  prioridade: 'Normal',
  estimativaRetorno: 'até 2 dias úteis',
}

export const protocoloMock: Protocolo = {
  codigo: '2026-10482',
  estimativaRetorno: 'até 2 dias úteis',
}

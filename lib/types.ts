/**
 * Tipos do frontend.
 *
 * `Conversa` e `Mensagem` seguem o modelo do backend (Conversa -> Mensagem).
 * Hoje só `GET /api/conversas` existe; os demais vêm do contrato-alvo.
 */

export type Remetente = 'CLIENTE' | 'CHATBOT' | 'ATENDENTE' | 'SISTEMA'

export type StatusConversa =
  | 'ATIVA'
  | 'AGUARDANDO_ATENDIMENTO_HUMANO'
  | 'EM_ATENDIMENTO_HUMANO'
  | 'ENCERRADA'

export interface ClienteResumo {
  id: number
  nome: string
}

export interface Conversa {
  id: number
  cliente: ClienteResumo
  canal: string
  status: StatusConversa
  iniciadaEm: string
  ultimaInteracaoEm: string
}

export interface Mensagem {
  id: number
  remetente: Remetente
  conteudo: string
  enviadaEm: string
}

export interface Pagina<T> {
  conteudo: T[]
  pagina: number
  tamanho: number
  totalElementos: number
  totalPaginas: number
}

export type TipoIdentificador = 'CPF' | 'EMAIL' | 'CODIGO'

export interface OpcaoIdentificador {
  tipo: TipoIdentificador
  rotulo: string
  placeholder: string
  ajuda: string
}

export interface Assistente {
  nome: string
  papel: string
}

export interface Acolhimento {
  assistente: Assistente
  mensagens: string[]
  canal: string
  requerIdentificacao: boolean
  identificadores: OpcaoIdentificador[]
}

export interface Identificacao {
  tipo: TipoIdentificador
  valor: string
}

export interface ClienteIdentificado {
  id: number
  nome: string
  cpfMascarado: string
  identificadorUsado: {
    tipo: TipoIdentificador
    valorMascarado: string
  }
}

export interface SolicitacaoRegistrada {
  protocolo: string
  estimativaRetorno: string
}

export interface Usuario {
  nome: string
  cpfMascarado: string
}

export interface ResumoSolicitacao {
  tipo: string
  areaResponsavel: string
  prioridade: string
  estimativaRetorno: string
}

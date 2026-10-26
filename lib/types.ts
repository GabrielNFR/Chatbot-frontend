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

export interface Conversa {
  id: number
  cliente: string
  /** Só `WEB` é conhecido hoje. */
  canal: string
  status: StatusConversa
  iniciadaEm: string
  ultimaInteracaoEm: string
}

export interface Mensagem {
  id: number
  remetente: Remetente
  conteudo: string
  /** LocalDateTime sem offset, como o backend envia. Não acrescente `Z`. */
  enviadaEm: string
}

/** Envelope de paginação do backend — campos em pt-BR. */
export interface Pagina<T> {
  conteudo: T[]
  pagina: number
  tamanho: number
  totalElementos: number
  totalPaginas: number
}

/** Reservado para a US 06: `POST /api/requests` ainda não existe. */
export interface SolicitacaoRegistrada {
  protocolo: string
  estimativaRetorno: string
}

/** Ainda sem endpoint — usado só pela UI. */
export interface Usuario {
  nome: string
  /** Regra do projeto: o CPF nunca é exibido completo. */
  cpfMascarado: string
}

export interface ResumoSolicitacao {
  tipo: string
  areaResponsavel: string
  prioridade: string
  estimativaRetorno: string
}

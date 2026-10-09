/**
 * Tipos do frontend.
 *
 * `ChatMessage` e `Sender` batem com o `ChatMessageController` do backend.
 * `Usuario`, `ResumoSolicitacao` e `Protocolo` ainda são **suposições**: não há
 * endpoint correspondente. Ajuste quando existir.
 */

/** Valores de `sender`. O backend não valida — é String livre lá. */
export type Sender = 'USER' | 'ASSISTANT' | 'SYSTEM'

/** Espelha a entidade ChatMessage / tabela tb_messages. */
export interface ChatMessage {
  id?: number
  sender: Sender
  content: string
  /** LocalDateTime sem timezone, gerado pelo backend. Ex.: 2026-10-08T14:32:10.123 */
  timestamp?: string
}

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

export interface Protocolo {
  codigo: string
  estimativaRetorno: string
}

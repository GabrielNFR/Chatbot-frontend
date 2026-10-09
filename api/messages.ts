import type { ChatMessage, Protocolo, Sender } from '@/lib/types'
import {
  mensagensMock,
  opcoesSistemaMock,
  protocoloMock,
  resumoMock,
  usuarioMock,
} from '@/mocks/data'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

/** Ponto único de troca: virar para `false` quando a API estiver pronta. */
const USAR_MOCK = true

const atraso = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function pedir<T>(url: string, init: RequestInit, mensagemErro: string): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) throw new Error(mensagemErro)
  return res.json() as Promise<T>
}

/** `GET /api/messages` — existe no backend (`ChatMessageController`). */
export async function listarMensagens(): Promise<ChatMessage[]> {
  if (USAR_MOCK) {
    await atraso(600)
    return mensagensMock
  }
  return pedir<ChatMessage[]>(`${API_URL}/api/messages`, {}, 'Não foi possível carregar a conversa.')
}

/**
 * `POST /api/messages` — existe no backend. Envia só `sender` e `content`; o
 * `timestamp` é gerado lá (`@PrePersist`).
 */
export async function enviarMensagem(content: string, sender: Sender = 'USER'): Promise<ChatMessage> {
  if (USAR_MOCK) {
    await atraso(300)
    return { sender, content, timestamp: new Date().toISOString() }
  }
  return pedir<ChatMessage>(
    `${API_URL}/api/messages`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender, content }),
    },
    'Não foi possível enviar a mensagem.',
  )
}

/**
 * Alvo futuro: `POST /api/requests` (US 06). Confirmado como INEXISTENTE no
 * backend — não há controller de solicitações nem geração de protocolo.
 * Receberá os campos coletados quando o slot filling for implementado e falha
 * de forma explícita se os mocks estiverem desligados, em vez de fingir sucesso.
 */
export async function registrarSolicitacao(): Promise<Protocolo> {
  if (!USAR_MOCK) {
    throw new Error('POST /api/requests ainda não existe no backend.')
  }
  await atraso(900)
  return protocoloMock
}

/** Ainda sem endpoint: hoje são constantes, amanhã viram chamadas assíncronas. */
export const usuario = usuarioMock
export const resumo = resumoMock
export const opcoesSistema = opcoesSistemaMock

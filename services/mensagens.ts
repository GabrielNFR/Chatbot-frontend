import type { Mensagem } from '@/lib/types'
import { agoraLocal, atraso, mensagensMock } from '@/mocks/data'
import { http, USAR_MOCK } from '@/services/http'

/** `GET /api/conversas/{id}/mensagens` — a implementar no backend. */
export async function listarMensagens(conversaId: number): Promise<Mensagem[]> {
  if (USAR_MOCK) {
    await atraso(600)
    return mensagensMock
  }
  return http.get<Mensagem[]>(`/api/conversas/${conversaId}/mensagens`)
}

/**
 * `POST /api/conversas/{id}/mensagens` — a implementar no backend.
 * O corpo leva apenas `conteudo`: quem grava o remetente é o servidor
 * (`CLIENTE` aqui, `CHATBOT` na lógica do assistente).
 */
export async function enviarMensagem(conversaId: number, conteudo: string): Promise<Mensagem> {
  if (USAR_MOCK) {
    await atraso(300)
    return { id: Date.now(), remetente: 'CLIENTE', conteudo, enviadaEm: agoraLocal() }
  }
  return http.post<Mensagem>(`/api/conversas/${conversaId}/mensagens`, { conteudo })
}

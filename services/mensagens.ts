import type { Mensagem, Pagina } from '@/lib/types'
import { agoraLocal, atraso, mensagensMock } from '@/mocks/data'
import { http, USAR_MOCK } from '@/services/http'

export async function listarMensagens(
  conversaId: number,
  pagina = 0,
  tamanho = 50,
): Promise<Pagina<Mensagem>> {
  if (USAR_MOCK) {
    await atraso(600)
    return {
      conteudo: pagina === 0 ? mensagensMock : [],
      pagina,
      tamanho,
      totalElementos: mensagensMock.length,
      totalPaginas: 1,
    }
  }
  return http.get<Pagina<Mensagem>>(
    `/api/conversas/${conversaId}/mensagens?page=${pagina}&size=${tamanho}`,
  )
}

export async function enviarMensagem(conversaId: number, conteudo: string): Promise<Mensagem> {
  if (USAR_MOCK) {
    await atraso(300)
    return { id: Date.now(), remetente: 'CLIENTE', conteudo, enviadaEm: agoraLocal() }
  }
  return http.post<Mensagem>(`/api/conversas/${conversaId}/mensagens`, { conteudo })
}

import type { Conversa, Pagina } from '@/lib/types'
import { atraso, conversaMock } from '@/mocks/data'
import { http, USAR_MOCK } from '@/services/http'

/** `GET /api/conversas` — a única rota que já existe no backend. */
export async function listarConversas(pagina = 0, tamanho = 20): Promise<Pagina<Conversa>> {
  if (USAR_MOCK) {
    await atraso(600)
    return { conteudo: [conversaMock], pagina, tamanho, totalElementos: 1, totalPaginas: 1 }
  }
  // Query params em inglês: o `Pageable` do Spring só entende `page`/`size`.
  // Os campos da resposta continuam em pt-BR (`conteudo`, `totalPaginas`, ...).
  return http.get<Pagina<Conversa>>(`/api/conversas?page=${pagina}&size=${tamanho}`)
}

/** `POST /api/conversas` — a implementar no backend. */
export async function criarConversa(dados: { clienteId: number; canal: string }): Promise<Conversa> {
  if (USAR_MOCK) {
    await atraso(400)
    return conversaMock
  }
  return http.post<Conversa>('/api/conversas', dados)
}

import type { Conversa, Pagina } from '@/lib/types'
import { agoraLocal, atraso, conversaMock, registrarTransferenciaMock } from '@/mocks/data'
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

/** POST /api/conversas/{id}/transferencia */
export async function transferirConversa(
  conversaId: number,
  motivo: string,
): Promise<Conversa> {
  const motivoTratado = motivo.trim()

  if (!motivoTratado || motivoTratado.length > 500) {
    throw new Error('Informe um motivo de até 500 caracteres.')
  }

   if (USAR_MOCK) {
    await atraso(400)

    registrarTransferenciaMock()

    return {
      ...conversaMock,
      id: conversaId,
      status: 'AGUARDANDO_ATENDIMENTO_HUMANO',
      ultimaInteracaoEm: agoraLocal(),
    }
  }

  return http.post<Conversa>(
    `/api/conversas/${conversaId}/transferencia`,
    { motivo: motivoTratado },
  )
}

/** GET /api/conversas/fila */
export async function listarFila(): Promise<Conversa[]> {
  return http.get<Conversa[]>('/api/conversas/fila')
}

/** POST /api/conversas/{id}/assumir */
export async function assumirConversa(
  conversaId: number,
  atendenteId: number,
): Promise<Conversa> {
  return http.post<Conversa>(
    `/api/conversas/${conversaId}/assumir`,
    { atendenteId },
  )
}

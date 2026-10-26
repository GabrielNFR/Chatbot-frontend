import type { SolicitacaoRegistrada } from '@/lib/types'
import { atraso, solicitacaoMock } from '@/mocks/data'
import { USAR_MOCK } from '@/services/http'

/**
 * Reservado para a US 06. `POST /api/requests` ainda não existe no backend —
 * esta função só devolve mock e falha de forma explícita quando os mocks estão
 * desligados, em vez de fingir sucesso.
 */
export async function criarSolicitacao(): Promise<SolicitacaoRegistrada> {
  if (!USAR_MOCK) {
    throw new Error('POST /api/requests ainda não existe no backend.')
  }
  await atraso(900)
  return solicitacaoMock
}

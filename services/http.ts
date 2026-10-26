/**
 * Base de todas as chamadas HTTP.
 *
 * Vazio = mesma origem (`/api`): em dev o proxy do Vite encaminha para o backend
 * (vite.config.ts); em produção o Nginx faz o mesmo. Não preencha com URL
 * absoluta sem necessidade — isso reintroduz CORS.
 */
const BASE_URL = import.meta.env.VITE_API_URL ?? ''

/** `VITE_USAR_MOCK=false` (build time) desliga os mocks. */
export const USAR_MOCK = import.meta.env.VITE_USAR_MOCK !== 'false'

/** Erro HTTP com o status preservado — permite distinguir 409 (conversa encerrada). */
export class ErroHttp extends Error {
  constructor(readonly status: number) {
    super(`Falha na requisição (${status})`)
  }
}

async function requisitar<T>(caminho: string, init?: RequestInit): Promise<T> {
  const resposta = await fetch(`${BASE_URL}${caminho}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })

  if (!resposta.ok) {
    throw new ErroHttp(resposta.status)
  }

  return (await resposta.json()) as T
}

/** Único lugar do projeto com `fetch`. Nenhum componente deve importar isto. */
export const http = {
  get: <T>(caminho: string) => requisitar<T>(caminho),
  post: <T>(caminho: string, corpo: unknown) =>
    requisitar<T>(caminho, { method: 'POST', body: JSON.stringify(corpo) }),
}

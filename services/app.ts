import { formatarCpf } from '@/lib/identificacao'
import { USAR_MOCK } from '@/services/http'
import { clientesMock, opcoesSistemaMock, resumoMock, usuarioMock } from '@/mocks/data'

/**
 * Dados de contexto sem endpoint: usuário logado, resumo da solicitação e as
 * respostas rápidas do chat.
 *
 * Ficam aqui para que as telas nunca importem de `@/mocks`. Quando existir API,
 * viram funções assíncronas sem mudar quem as consome.
 */
export const usuario = usuarioMock
export const resumo = resumoMock
export const opcoesSistema = opcoesSistemaMock

/** Exposto para a composição do app decidir o que está disponível no ambiente. */
export const usarMock = USAR_MOCK

/**
 * Credenciais do cadastro mock, exibidas apenas em ambiente de demonstração.
 * `null` no build de produção, onde `VITE_USAR_MOCK=false`.
 */
const clienteDemo = clientesMock[0]

export const dadosDemonstracao =
  USAR_MOCK && clienteDemo
    ? {
        cpf: formatarCpf(clienteDemo.cpf),
        email: clienteDemo.email,
        codigo: clienteDemo.codigo,
      }
    : null

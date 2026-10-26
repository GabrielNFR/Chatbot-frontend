import { opcoesSistemaMock, resumoMock, usuarioMock } from '@/mocks/data'

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

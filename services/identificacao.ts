import { mascararIdentificador, mensagemErroFormato, normalizarIdentificador, validarIdentificador } from '@/lib/identificacao'
import type { Acolhimento, ClienteIdentificado, Identificacao, TipoIdentificador } from '@/lib/types'
import { acolhimentoMock, atraso, clientesMock } from '@/mocks/data'
import { USAR_MOCK } from '@/services/http'


export type MotivoErroIdentificacao = 'NAO_ENCONTRADO' | 'FORMATO' | 'INDISPONIVEL'

export class ErroIdentificacao extends Error {
  constructor(readonly motivo: MotivoErroIdentificacao, mensagem: string) {
    super(mensagem)
    this.name = 'ErroIdentificacao'
  }
}


export async function obterAcolhimento(): Promise<Acolhimento> {
  if (USAR_MOCK) {
    await atraso(500)
    return acolhimentoMock
  }
  throw new ErroIdentificacao(
    'INDISPONIVEL',
    'O acolhimento ainda não está disponível no servidor. Tente novamente em instantes.',
  )
}

function mensagemNaoEncontrado(tipo: TipoIdentificador): string {
  switch (tipo) {
    case 'CPF':
      return 'Não encontrei um cadastro com esse CPF. Confira os números ou tente outro identificador.'
    case 'EMAIL':
      return 'Não encontrei um cadastro com esse e-mail. Confira o endereço ou tente outro identificador.'
    case 'CODIGO':
      return 'Esse código de acesso não foi reconhecido. Confira o código ou tente outro identificador.'
  }
}

function clientePorIdentificador(tipo: TipoIdentificador, valor: string) {
  return clientesMock.find((cliente) => {
    switch (tipo) {
      case 'CPF':
        return cliente.cpf === valor
      case 'EMAIL':
        return cliente.email.toLowerCase() === valor
      case 'CODIGO':
        return cliente.codigo.toUpperCase() === valor
      default:
        return false
    }
  })
}

export async function identificarUsuaria({ tipo, valor }: Identificacao): Promise<ClienteIdentificado> {
  const normalizado = normalizarIdentificador(tipo, valor)
  const erro = validarIdentificador(tipo, normalizado)

  if (erro) {
    throw new ErroIdentificacao('FORMATO', mensagemErroFormato(erro, tipo))
  }

  if (!USAR_MOCK) {
    throw new ErroIdentificacao(
      'INDISPONIVEL',
      'A validação de identificação ainda não está disponível no servidor. Tente novamente em instantes.',
    )
  }

  await atraso(700)
  const cliente = clientePorIdentificador(tipo, normalizado)

  if (!cliente) {
    throw new ErroIdentificacao('NAO_ENCONTRADO', mensagemNaoEncontrado(tipo))
  }

  return {
    id: cliente.id,
    nome: cliente.nome,
    cpfMascarado: mascararIdentificador('CPF', cliente.cpf),
    identificadorUsado: {
      tipo,
      valorMascarado: mascararIdentificador(tipo, normalizado),
    },
  }
}

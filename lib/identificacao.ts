import type { TipoIdentificador } from '@/lib/types'

export type ErroFormato = 'OBRIGATORIO' | 'CPF_INVALIDO' | 'EMAIL_INVALIDO' | 'CODIGO_INVALIDO'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const CODIGO = /^[A-Za-z0-9-]{6,20}$/

export function apenasDigitos(valor: string): string {
  return valor.replace(/\D/g, '')
}

export function formatarCpf(valor: string): string {
  const digitos = apenasDigitos(valor).slice(0, 11)
  return digitos
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

export function normalizarIdentificador(tipo: TipoIdentificador, valor: string): string {
  switch (tipo) {
    case 'CPF':
      return apenasDigitos(valor)
    case 'EMAIL':
      return valor.trim().toLowerCase()
    case 'CODIGO':
      return valor.trim().toUpperCase()
  }
}

function cpfValido(cpf: string): boolean {
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false

  const digito = (fatorInicial: number, quantidade: number) => {
    let soma = 0
    for (let i = 0; i < quantidade; i += 1) {
      soma += Number(cpf[i]) * (fatorInicial - i)
    }
    const resto = (soma * 10) % 11
    return resto === 10 ? 0 : resto
  }

  return digito(10, 9) === Number(cpf[9]) && digito(11, 10) === Number(cpf[10])
}

export function validarIdentificador(tipo: TipoIdentificador, valor: string): ErroFormato | null {
  const normalizado = normalizarIdentificador(tipo, valor)

  if (!normalizado) return 'OBRIGATORIO'

  switch (tipo) {
    case 'CPF':
      return cpfValido(normalizado) ? null : 'CPF_INVALIDO'
    case 'EMAIL':
      return normalizado.length <= 254 && EMAIL.test(normalizado) ? null : 'EMAIL_INVALIDO'
    case 'CODIGO':
      return CODIGO.test(normalizado) ? null : 'CODIGO_INVALIDO'
  }
}

export function mensagemErroFormato(erro: ErroFormato, tipo: TipoIdentificador): string {
  switch (erro) {
    case 'OBRIGATORIO':
      if (tipo === 'CPF') return 'Informe seu CPF para continuar.'
      if (tipo === 'EMAIL') return 'Informe seu e-mail para continuar.'
      return 'Informe seu código de acesso para continuar.'
    case 'CPF_INVALIDO':
      return 'Esse CPF não parece válido. Confira os 11 dígitos e tente novamente.'
    case 'EMAIL_INVALIDO':
      return 'Digite um e-mail válido, como nome@empresa.com.'
    case 'CODIGO_INVALIDO':
      return 'O código deve ter entre 6 e 20 letras, números ou hífens.'
  }
}

export function mascararIdentificador(tipo: TipoIdentificador, valor: string): string {
  switch (tipo) {
    case 'CPF':
      return '***.***.***-**'
    case 'EMAIL': {
      const [local, dominio] = valor.split('@')
      return local && dominio ? `${local.slice(0, 1)}***@${dominio}` : '***'
    }
    case 'CODIGO':
      return '••••••'
  }
}

export function rotuloCanal(canal: string): string {
  return canal === 'WEB' ? 'Chat no portal' : canal
}

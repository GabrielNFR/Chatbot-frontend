import { useState } from 'react'
import Acolhimento from './Acolhimento'
import Home from './Home'
import Atendente from './Atendente'
import type { ClienteIdentificado } from '@/lib/types'
import { usarMock } from '@/services/app'

export default function App() {
  const [iniciado, setIniciado] = useState(false)
  const [cliente, setCliente] = useState<ClienteIdentificado | null>(null)
  const [area, setArea] = useState<'cliente' | 'atendente'>('cliente')

  if (area === 'atendente') {
    return (
      <>
        <button
          onClick={() => setArea('cliente')}
          className="fixed right-6 top-6 z-50 rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
        >
          Voltar à área do cliente
        </button>

        <Atendente />
      </>
    )
  }

  if (usarMock && !iniciado) {
    return (
      <Acolhimento
        onProsseguir={(identificado) => {
          setCliente(identificado)
          setIniciado(true)
        }}
      />
    )
  }

  return (
    <>
      <button
        onClick={() => setArea('atendente')}
        className="fixed right-6 top-6 z-50 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        Área do atendente
      </button>

      <Home cliente={cliente} />
    </>
  )
}

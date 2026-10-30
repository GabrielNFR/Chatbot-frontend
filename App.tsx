import { useState } from 'react'
import Acolhimento from './Acolhimento'
import Home from './Home'
import type { ClienteIdentificado } from '@/lib/types'
import { usarMock } from '@/services/app'

export default function App() {
  const [iniciado, setIniciado] = useState(false)
  const [cliente, setCliente] = useState<ClienteIdentificado | null>(null)

  if (!usarMock) return <Home />

  if (!iniciado) {
    return (
      <Acolhimento
        onProsseguir={(identificado) => {
          setCliente(identificado)
          setIniciado(true)
        }}
      />
    )
  }

  return <Home cliente={cliente} />
}

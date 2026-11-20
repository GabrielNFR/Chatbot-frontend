
import { useEffect, useState } from 'react'
import type { Conversa, Mensagem } from '@/lib/types'
import { assumirConversa, listarFila } from '@/services/conversas'
import {
  enviarMensagemAtendente,
  listarMensagens,
} from '@/services/mensagens'

export default function Atendente() {
  const ATENDENTE_ID = 1 //id temporario

  const [fila, setFila] = useState<Conversa[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const [conversaSelecionada, setConversaSelecionada] =
    useState<Conversa | null>(null)

  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [textoMensagem, setTextoMensagem] = useState('')

  useEffect(() => {
    async function carregarFila() {
      try {
        const conversas = await listarFila()
        setFila(conversas)
      } catch {
        setErro('Não foi possível carregar a fila de atendimento.')
      } finally {
        setCarregando(false)
      }
    }

    carregarFila()
  }, [])

  async function handleAssumir(conversaId: number) {
    try {
      setErro(null)

      const conversa = await assumirConversa(
        conversaId,
        ATENDENTE_ID,
      )

      setConversaSelecionada(conversa)

      const pagina = await listarMensagens(conversaId)
      setMensagens(pagina.conteudo)

      setFila((atual) =>
        atual.filter((item) => item.id !== conversaId),
      )

      setTextoMensagem('')
    } catch {
      setErro('Não foi possível assumir ou carregar a conversa.')
    }
  }

  async function handleEnviarMensagem() {
    if (!conversaSelecionada || !textoMensagem.trim()) return

    try {
      setErro(null)

      const mensagem = await enviarMensagemAtendente(
        conversaSelecionada.id,
        ATENDENTE_ID,
        textoMensagem.trim(),
      )

      setMensagens((atuais) => [...atuais, mensagem])
      setTextoMensagem('')
    } catch {
      setErro('Não foi possível enviar a mensagem.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-2xl font-bold text-gray-800">
        Painel do Atendente
      </h1>

      <p className="mt-2 text-gray-600">
        Gerencie os atendimentos aguardando na fila.
      </p>

      {erro && (
        <p className="mt-4 text-red-600">{erro}</p>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-lg bg-white p-5 shadow">
          <h2 className="text-lg font-semibold text-gray-800">
            Fila de atendimento
          </h2>

          {carregando && (
            <p className="mt-4">Carregando conversas...</p>
          )}

          {!carregando && fila.length === 0 && (
            <p className="mt-4 text-gray-500">
              Nenhuma conversa aguardando atendimento.
            </p>
          )}

          {!carregando && fila.length > 0 && (
            <ul className="mt-4 space-y-3">
              {fila.map((conversa) => (
                <li
                  key={conversa.id}
                  className="rounded-lg border border-gray-200 p-4"
                >
                  <p className="font-medium text-gray-800">
                    {conversa.cliente.nome}
                  </p>

                  <p className="text-sm text-gray-500">
                    Conversa #{conversa.id}
                  </p>

                  <button
                    onClick={() => handleAssumir(conversa.id)}
                    className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Assumir atendimento
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="flex min-h-[400px] flex-col rounded-lg bg-white p-5 shadow">
          <h2 className="text-lg font-semibold text-gray-800">
            Atendimento
          </h2>

          {!conversaSelecionada ? (
            <p className="mt-4 text-gray-500">
              Selecione uma conversa da fila para iniciar o atendimento.
            </p>
          ) : (
            <>
              <div className="mt-4 border-b pb-3">
                <p className="font-medium text-gray-800">
                  {conversaSelecionada.cliente.nome}
                </p>

                <p className="text-sm text-gray-500">
                  Conversa #{conversaSelecionada.id}
                </p>
              </div>

              <div className="mt-4 flex-1 space-y-3 overflow-y-auto">
                {mensagens.map((mensagem) => (
                  <div
                    key={mensagem.id}
                    className={`max-w-[85%] rounded-lg p-3 ${
                      mensagem.remetente === 'ATENDENTE'
                        ? 'ml-auto bg-blue-100'
                        : 'bg-gray-100'
                    }`}
                  >
                    <p className="mb-1 text-xs font-semibold text-gray-600">
                      {mensagem.remetente}
                    </p>

                    <p className="text-sm text-gray-800">
                      {mensagem.conteudo}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      {new Date(mensagem.enviadaEm).toLocaleString('pt-BR')}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex gap-2 border-t pt-4">
                <input
                  type="text"
                  value={textoMensagem}
                  onChange={(e) => setTextoMensagem(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleEnviarMensagem()
                    }
                  }}
                  placeholder="Digite sua mensagem..."
                  className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                />

                <button
                  onClick={handleEnviarMensagem}
                  disabled={!textoMensagem.trim()}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Enviar
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  )
}

# Chatbot Frontend

Frontend do assistente conversacional de atendimento. Esta é a tela da **US 06 — Abertura e
Registro Assistido de Solicitações**: a usuária conversa com a assistente (Lia), que coleta os
dados da solicitação e devolve um protocolo.

O backend (Spring Boot) vive em repositório separado e hoje expõe apenas o **CRUD básico de
mensagens** (`/api/messages`) — não há nenhuma rota para sessões, solicitações/protocolo ou
transbordo. Detalhes em [Endpoints](#endpoints).

As personas, as user stories e as convenções de UI estão documentadas em
[`contexto-front.md`](./contexto-front.md) — documento de referência. Onde ele divergir do código
do backend, vale o código.

## Stack

| Item | Versão |
|---|---|
| Vite | 8.3 |
| React | 19 |
| TypeScript | 5.7 |
| Tailwind CSS | 4 (via `@tailwindcss/postcss`) |
| shadcn/ui | estilo `base-nova`, sobre Base UI (`@base-ui/react` 1.5) |
| Ícones | `lucide-react` |
| Merge de classes | pacote `cn` |
| Gerenciador de pacotes | pnpm 12.3.4 (via Corepack) |

## Requisitos

- **Node.js 24** (testado com 24.20.0)
- **pnpm** — declarado no `package.json` (`packageManager: pnpm@12.3.4`). Se não estiver
  instalado, o Corepack resolve, sem precisar de `npm i -g`:

```bash
corepack enable pnpm
```

Use `pnpm`, não `npm`: o projeto tem `pnpm-lock.yaml`, e `package-lock.json` está no
`.gitignore` para evitar dois lockfiles concorrentes.

## Como rodar

```bash
pnpm install
pnpm dev
```

Abre em <http://localhost:3000>.

| Script | O que faz |
|---|---|
| `pnpm dev` | Servidor de desenvolvimento — porta **3000** |
| `pnpm build` | Build de produção em `dist/` |
| `pnpm preview` | Serve o build de produção — porta **4173** |
| `pnpm exec tsc --noEmit` | Typecheck |

## Estrutura

```
.
├── index.html          # entry point do Vite
├── main.tsx            # bootstrap do React
├── Home.tsx            # tela da US 06 (chat + resumo da solicitação)
├── globals.css         # Tailwind + tokens de tema do shadcn/ui
├── vite.config.ts      # alias "@" -> raiz do projeto; dev na porta 3000
├── services/messages.ts # camada de dados: único ponto de contato com a API
├── mocks/data.ts       # dados mockados (o único lugar que inventa dados)
├── lib/types.ts        # tipos: contrato de /api/messages + suposições
├── lib/utils.ts        # helper `cn` (clsx + tailwind-merge)
├── components/ui/      # componentes shadcn/ui
└── public/             # ícones e placeholders
```

## Dados e integração com a API

**Hoje a tela não fala com o backend.** Todo acesso a dados passa por `services/messages.ts` e,
enquanto `USAR_MOCK` for `true`, devolve o conteúdo de `mocks/data.ts`:

```ts
// services/messages.ts
const USAR_MOCK = true
```

Trocar para `false` ativa as chamadas HTTP reais. Nenhum componente precisa mudar — o `Home.tsx`
importa apenas de `@/services/messages`, nunca dos mocks diretamente.

### Endpoints

Verificado no código-fonte do backend: existe **um único controller**, `ChatMessageController`,
mapeado em `/api/messages`.

| Método | Rota | Retorno | Descrição |
|---|---|---|---|
| `GET` | `/api/messages` | `200` | Lista todas as mensagens, ordenadas por `timestamp` crescente |
| `POST` | `/api/messages` | `201` | Cria uma mensagem |
| `DELETE` | `/api/messages/{id}` | `204` / `404` | Remove por id; `404` se não existir |

**Contrato do `POST`** — envie apenas `sender` e `content`. O `timestamp` é gerado pelo backend
(`@PrePersist`), então não envie.

```json
{ "sender": "USER", "content": "Ola, preciso de ajuda" }
```

`sender` é `String` livre no backend, **sem enum**. A convenção combinada é `USER` / `ASSISTANT` /
`SYSTEM` — é o que o tipo `Sender` em `lib/types.ts` declara.

Resposta (`201`):

```json
{
  "id": 1,
  "sender": "USER",
  "content": "Ola, preciso de ajuda",
  "timestamp": "2026-10-09T01:54:36.231825"
}
```

O `timestamp` é `LocalDateTime` **sem timezone**: trate como horário do servidor, não assuma UTC.

#### Rotas de infraestrutura

| Rota | Observação |
|---|---|
| `GET /actuator/health` | `{"groups":["liveness","readiness"],"status":"UP"}` |
| `GET /actuator/health/liveness` · `/readiness` | Health check de orquestrador |
| `GET /` | Serve o `static/index.html` |

`/actuator/info` só aparece com o perfil `prod` ativo (que expõe `health,info`). No perfil padrão,
só `health` é exposto.

#### O que o backend ainda não tem

| User Story | Endpoint esperado | Status |
|---|---|---|
| US 01 / 03 — Sessão e memória | `POST /api/sessions`, `GET /api/sessions/{id}/messages` | ❌ |
| US 02 — Base de diretrizes (RAG) | — | ❌ |
| US 05 — Consulta de status | — | ❌ |
| **US 06 — Registro de solicitação** | `POST /api/requests` → protocolo | ❌ |
| US 07 / 08 — Transbordo | `POST /api/sessions/{id}/transfer` | ❌ |
| US 10 — Métricas | `GET /api/metrics/retention` | ❌ |
| Chat com LLM | `POST /api/sessions/{id}/chat` | ❌ |

Ou seja: dá para ligar o histórico e o envio de mensagens de verdade. Todo o resto — incluindo o
protocolo da US 06, que é o objetivo desta tela — continua dependendo de mock.

> ⚠️ **Armadilha ao ligar a API real:** `GET /api/messages` devolve **todas** as mensagens do
> banco, sem filtro — não existe `sessionId` no backend, logo não há isolamento por conversa. Com
> `USAR_MOCK = false`, a tela mostraria o histórico global de todo mundo. Antes de ligar em
> qualquer ambiente compartilhado, é preciso que o backend suporte sessão.

`registrarSolicitacao()` **lança erro de propósito** quando `USAR_MOCK` é `false`, em vez de
fingir sucesso.

### URL da API

As chamadas usam **caminho relativo** (`/api/...`). O padrão de `VITE_API_URL` é vazio = mesma
origem.

| Ambiente | Como `/api` chega no backend |
|---|---|
| `pnpm dev` | Proxy do Vite (`vite.config.ts`) → `http://localhost:8080` |
| `pnpm preview` | Sem proxy: defina `VITE_API_URL=http://localhost:8080` no build para testar local |
| Produção (EC2) | Nginx na mesma origem, com `/api` → Spring Boot |

Se precisar de outra origem, copie `.env.example` para `.env.local` e defina `VITE_API_URL`.
Atenção: essa variável é resolvida em **build time** — com URL absoluta, trocar de ambiente exige
rebuild.

### Mock vs. API real

```
VITE_USAR_MOCK=true    # padrão: mocks ligados
VITE_USAR_MOCK=false   # chama a API real
```

### CORS

Com o proxy do Vite (dev) e com Nginx/ALB na frente (produção), a requisição sai como **mesma
origem** — CORS não é necessário. Ele só entra em jogo se você usar `VITE_API_URL` absoluto para
outro host; nesse caso a origem exata (`esquema://host:porta`) precisa estar liberada no backend.

## O que já está implementado

- Tela da US 06 com a assistente, sugestões de resposta e card de resumo da solicitação
- **Quatro estados**: carregando (`Skeleton`), vazio, erro (com “Tentar novamente”, preservando o
  texto digitado) e sucesso (protocolo + estimativa de retorno)
- Fluxo de registro explícito (`ocioso → enviando → sucesso | erro`) — o registro nunca acontece
  sozinho
- `Enter` envia; `Shift+Enter` quebra linha
- `aria-live` no histórico do chat e `role="alert"` nos erros

## O que ainda não existe

- Slot filling guiado da US 06 (as perguntas obrigatórias, uma por vez) e o passo de revisão com
  validação explícita da usuária
- Stepper de 4 etapas; `Sheet` de resumo no mobile; `RadioGroup` e `Toast`
- Máscara de CPF na interface — o requisito é nunca exibir o CPF completo
- Header `X-Trace-Id` por conversa (observabilidade)
- Integração real com a API (hoje tudo é mock)
- Testes automatizados
- Aplicação dos tokens de tema do `contexto-front.md` (primária `#2563EB`): o `Home.tsx` ainda usa
  cores em hex, como `#253a83`
- O bloco `.dark` em `globals.css` é inerte — o app é light-only por decisão; pode ser removido
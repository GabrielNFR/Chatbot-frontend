# Chatbot Frontend

Frontend do assistente conversacional de atendimento. Esta é a tela da **US 06 — Abertura e
Registro Assistido de Solicitações**: a usuária conversa com a assistente (Lia), que coleta os
dados da solicitação e devolve um protocolo.

O backend (Spring Boot) vive em repositório separado e hoje expõe **uma única rota**:
`GET /api/conversas`. Não existe `/api/messages`, nem `POST`, nem `sessionId` — o modelo é
`Conversa -> Mensagem`. Detalhes em [Endpoints](#endpoints).

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
├── index.html            # entry point do Vite
├── main.tsx              # bootstrap do React
├── Home.tsx              # tela da US 06 (chat + resumo da solicitação)
├── globals.css           # Tailwind + tokens de tema do shadcn/ui
├── vite.config.ts        # alias "@" -> raiz; dev na 3000; proxy /api -> :8080
├── services/             # única camada que conhece a API
│   ├── http.ts           # baseURL, fetch e erro (nenhum fetch fora daqui)
│   ├── conversas.ts      # listarConversas, criarConversa
│   ├── mensagens.ts      # listarMensagens, enviarMensagem
│   ├── solicitacoes.ts   # criarSolicitacao (reservado, ainda mock)
│   └── app.ts            # usuário/resumo/opções (ainda sem endpoint)
├── mocks/data.ts         # dados mockados, com os mesmos tipos da API
├── lib/types.ts          # Conversa, Mensagem, Pagina<T>, ...
├── lib/utils.ts          # helper `cn` (clsx + tailwind-merge)
├── components/ui/        # componentes shadcn/ui
└── public/               # ícones e placeholders
```

## Dados e integração com a API

**Hoje a tela não fala com o backend.** Todo acesso a dados passa por `services/` e, enquanto
`USAR_MOCK` for verdadeiro, devolve o conteúdo de `mocks/data.ts`:

```ts
// services/http.ts
export const USAR_MOCK = import.meta.env.VITE_USAR_MOCK !== 'false'
```

Com `VITE_USAR_MOCK=false` as chamadas HTTP reais são usadas. Nenhum componente muda — as telas
importam apenas de `@/services/*`, nunca dos mocks. Regra prática: **se aparecer `fetch(` em um
`.tsx`, a arquitetura falhou.**

### Endpoints

**Hoje o backend tem uma única rota:** `GET /api/conversas` (paginada).

```json
{
  "conteudo": [
    { "id": 1, "cliente": "Mariana Souza", "canal": "WEB", "status": "ATIVA",
      "iniciadaEm": "2026-10-23T14:02:11", "ultimaInteracaoEm": "2026-10-23T14:09:40" }
  ],
  "pagina": 0, "tamanho": 20, "totalElementos": 1, "totalPaginas": 1
}
```

#### Contrato-alvo (o front já está escrito contra ele)

| Rota | Corpo | Retorno | Status |
|---|---|---|---|
| `GET /api/conversas` | — | `Pagina<Conversa>` | ✅ existe |
| `GET /api/conversas/{id}/mensagens` | — | `Mensagem[]` crescente | ⏳ a implementar |
| `POST /api/conversas/{id}/mensagens` | `{ "conteudo": "..." }` | `201` + `Mensagem` | ⏳ a implementar |
| `POST /api/conversas` | `{ "clienteId": 1, "canal": "WEB" }` | `201` + `Conversa` | ⏳ a implementar |

O `POST` de mensagem **não recebe remetente**: o backend grava como `CLIENTE`, e quem grava
`CHATBOT` é a lógica do assistente. Isso impede a tela de forjar o remetente.

Para a US 06, `POST /api/requests` continua reservado — o tipo `SolicitacaoRegistrada` e o serviço
`criarSolicitacao()` já existem, apontando para o mock.

#### Valores de enum

```
remetente: CLIENTE | CHATBOT | ATENDENTE | SISTEMA
status:    ATIVA | AGUARDANDO_ATENDIMENTO_HUMANO | EM_ATENDIMENTO_HUMANO | ENCERRADA
```

#### Mapeamento de campos

Tudo em pt-BR, traduzido **uma vez** em `services/` — nenhum componente conhece estes nomes:

| Backend | Front |
|---|---|
| `remetente` | `Mensagem.remetente` |
| `conteudo` | `Mensagem.conteudo` |
| `enviadaEm` | `Mensagem.enviadaEm` |
| `conteudo` (paginação) | `Pagina.conteudo` — atenção: é `conteudo`, não `content` |

`enviadaEm` é `LocalDateTime` **sem offset**: `new Date("2026-10-23T14:02:11")` interpreta como
hora local — correto se servidor e cliente estiverem no mesmo fuso. Não acrescente `Z`; alinhe o
servidor com `TZ=America/Sao_Paulo`.

#### Rotas de infraestrutura

| Rota | Observação |
|---|---|
| `GET /actuator/health` | `{"groups":["liveness","readiness"],"status":"UP"}` |
| `GET /actuator/health/liveness` · `/readiness` | Health check de orquestrador |
| `GET /` | Serve o `static/index.html` |

`/actuator/info` só aparece com o perfil `prod` ativo (que expõe `health,info`). No perfil padrão,
só `health` é exposto.

`criarSolicitacao()` **lança erro de propósito** quando `USAR_MOCK` é `false`, em vez de fingir
sucesso — o `POST /api/requests` não existe no backend.

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

`VITE_USAR_MOCK` é **build time**: o valor é congelado no bundle durante `pnpm build`. Definir a
variável no servidor da EC2 depois do build **não tem efeito** — para trocar, rebuilde.

| Onde | Arquivo / forma | Efeito |
|---|---|---|
| Sua máquina | `.env.local` (gitignored) | só o `pnpm dev` local |
| Build de produção | `.env.production` (versionado) | todo `pnpm build` |
| Pontual / CI | variável de ambiente no comando | tem prioridade sobre os arquivos |

O `.env.production` já vem com `VITE_USAR_MOCK=false` e `VITE_API_URL` vazio (mesma origem). Para
gerar um build mockado de propósito, sobrescreva:

```bash
VITE_USAR_MOCK=true pnpm build              # bash
$env:VITE_USAR_MOCK="true"; pnpm build      # PowerShell
```

Precedência do Vite: `.env` → `.env.local` → `.env.[mode]` → `.env.[mode].local`; variáveis de
ambiente do processo vencem todos. Depois de editar um `.env*`, **reinicie o `pnpm dev`** — o Vite
só lê env na inicialização.

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
# Chatbot Frontend

Frontend do assistente conversacional de atendimento. A aplicação tem duas etapas:

1. **US 01 — Acolhimento e Identificação da Usuária** (`Acolhimento.tsx`): saudação da assistente e
   validação de CPF, e-mail ou código de acesso.
2. **US 06 — Abertura e Registro Assistido de Solicitações** (`Home.tsx`): a usuária conversa com a
   assistente (Lia), que coleta os dados da solicitação e devolve um protocolo.

O backend (Spring Boot) vive em repositório separado e hoje expõe **uma única rota**:
`GET /api/conversas`. As rotas de identificação da US 01 ainda não existem — por isso a etapa de
acolhimento roda com mocks e o app cai na tela da US 06 quando `VITE_USAR_MOCK=false`. Detalhes em
[Endpoints](#endpoints).

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
├── App.tsx               # compõe US 01 -> US 06 (sem router)
├── Acolhimento.tsx       # tela da US 01 (saudação + identificação)
├── Home.tsx              # tela da US 06 (chat + resumo da solicitação)
├── globals.css           # Tailwind + tokens de tema do shadcn/ui
├── vite.config.ts        # alias "@" -> raiz; dev na 3000; proxy /api -> :8080
├── services/             # única camada que conhece a API
│   ├── http.ts           # baseURL, fetch e erro (nenhum fetch fora daqui)
│   ├── identificacao.ts  # obterAcolhimento, identificarUsuaria
│   ├── conversas.ts      # listarConversas, criarConversa
│   ├── mensagens.ts      # listarMensagens, enviarMensagem
│   ├── solicitacoes.ts   # criarSolicitacao (reservado, ainda mock)
│   └── app.ts            # usuário/resumo/opções e flag de mock
├── mocks/data.ts         # dados mockados, com os mesmos tipos da API
├── lib/types.ts          # Conversa, Mensagem, Acolhimento, Pagina<T>, ...
├── lib/identificacao.ts  # validação e máscara de CPF, e-mail e código
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

**Hoje o backend tem uma única rota:** `GET /api/conversas` (paginada). O modelo é
`Conversa -> Mensagem`; não existe `/api/messages`, nem `sessionId`.

```json
{
  "conteudo": [
    { "id": 1, "cliente": { "id": 1, "nome": "Mariana Souza" }, "canal": "WEB", "status": "ATIVA",
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
| `GET /api/acolhimento` | — | `Acolhimento` | ⏳ proposto (US 01) |
| `POST /api/identificacao` | `{ "tipo": "CPF", "valor": "..." }` | `200` + `ClienteIdentificado` | ⏳ proposto (US 01) |

O `POST` de mensagem **não recebe remetente**: o backend grava como `CLIENTE`, e quem grava
`CHATBOT` é a lógica do assistente. Isso impede a tela de forjar o remetente.

Para a US 06, `POST /api/requests` continua reservado — o tipo `SolicitacaoRegistrada` e o serviço
`criarSolicitacao()` já existem, apontando para o mock.

#### US 01 — acolhimento e identificação

As duas rotas acima são uma **proposta de contrato**, não uma implementação existente. Enquanto o
backend não as expõe:

- `obterAcolhimento()` e `identificarUsuaria()` devolvem dados de `mocks/data.ts`;
- com `VITE_USAR_MOCK=false`, ambos **lançam erro explícito** (não fingem sucesso);
- `App.tsx` monta a tela da US 01 apenas com mocks ligados; no build de produção ele mantém a tela
  da US 06, para o app não ficar inutilizável.

O `Acolhimento` traz a saudação já renderizada pela persona (nome, papel e tom vêm do serviço, não
do componente), a lista de identificadores aceitos e a flag `requerIdentificacao` — que permite
pular a etapa quando o fluxo não exigir validação cadastral.

Credenciais do mock (também visíveis em “Dados para demonstração”, na própria tela):

| Identificador | Valor |
|---|---|
| CPF | `123.456.789-09` |
| E-mail | `mariana.souza@exemplo.com` |
| Código de acesso | `MARIANA2026` |

Qualquer outro valor com formato válido simula **cadastro não encontrado**. Formatos inválidos são
barrados no cliente, com mensagem amigável e sem limpar o que já foi digitado.

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

### US 01 — Acolhimento e Identificação

- Tela de entrada com saudação vinda da persona (`services/identificacao.ts`), sem texto fixo no
  componente
- Identificação por **CPF, e-mail ou código de acesso**, com seleção acessível (radios nativos)
- Validação de formato no cliente (CPF com dígitos verificadores, e-mail e código) e revalidação no
  serviço — erro amigável, campo preservado e foco de volta no input
- Estados de **carregando** (`Skeleton`), **pronto**, **erro de carregamento** (com tentar
  novamente), **validando** e **sucesso**
- Após validar, a usuária é tratada pelo **primeiro nome** e o CPF aparece apenas mascarado
  (`***.***.***-**`); o valor cru sai do estado da tela
- Ação “Não sou eu” para trocar a identificação e continuar no mesmo canal
- Fluxo sem identificação suportado por `requerIdentificacao=false`
- Auditoria axe (WCAG 2 A/AA) sem violações na tela

### US 06 — Abertura de Solicitação

- Tela da US 06 com a assistente, sugestões de resposta e card de resumo da solicitação
- **Quatro estados**: carregando (`Skeleton`), vazio, erro (com “Tentar novamente”, preservando o
  texto digitado) e sucesso (protocolo + estimativa de retorno)
- Fluxo de registro explícito (`ocioso → enviando → sucesso | erro`) — o registro nunca acontece
  sozinho
- `Enter` envia; `Shift+Enter` quebra linha
- `aria-live` no histórico do chat e `role="alert"` nos erros

## O que ainda não existe

- Rotas reais de acolhimento/identificação da US 01 (`GET /api/acolhimento` e
  `POST /api/identificacao`) — hoje só mock
- Criação/recuperação da conversa após a identificação (o `POST /api/conversas` ainda não existe)
- Slot filling guiado da US 06 (as perguntas obrigatórias, uma por vez) e o passo de revisão com
  validação explícita da usuária
- Stepper de 4 etapas; `Sheet` de resumo no mobile; `RadioGroup` e `Toast`
- Header `X-Trace-Id` por conversa (observabilidade)
- Integração real da US 06 com a API (hoje tudo é mock)
- Testes automatizados
- Aplicação dos tokens de tema do `contexto-front.md` (primária `#2563EB`): `Home.tsx` e
  `Acolhimento.tsx` ainda usam cores em hex, como `#253a83`
- O bloco `.dark` em `globals.css` é inerte — o app é light-only por decisão; pode ser removido
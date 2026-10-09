# Contexto do Projeto — Chatbot de Atendimento

> **Documento de transferência de contexto** do backend (repo `Chatbot`) para o frontend (repo separado).
> Recomendação: salve este arquivo no repositório de frontend como `.github/copilot-instructions.md`
> (ou `docs/CONTEXT.md`) para que o agente de IA de lá tenha o contexto completo do produto e da API.

Última atualização: 2026-10-08

---

## 1. Visão do produto

Assistente conversacional de atendimento que resolve demandas por autoatendimento e transfere para
atendimento humano quando necessário, preservando todo o contexto da conversa.

### Personas

| Persona | Papel | Necessidade central | Dor atual |
|---|---|---|---|
| **Mariana** | Usuária / Cliente | Atendimento dinâmico, sem filas, respostas seguras | Espera excessiva, respostas genéricas, repetir dados |
| **Roberto** | Atendente Humano / N2 | Receber histórico + resumo consolidado da conversa | Sobrecarga com casos repetitivos e conversas longas |
| **Juliana** | Gestora de Atendimento | Visibilidade de retenção da automação vs. transbordos, CSAT | Falta de indicadores e alto custo operacional |
| **Carlos** | Curador de Conteúdo / Admin | Atualizar regras, manuais e persona sem alterar código | Respostas desatualizadas em relação à organização |

### Épicos e User Stories

**Épico 1 — Atendimento Conversacional e Autoatendimento Informativo**
- US 01 — Acolhimento e Identificação da Usuária
- US 02 — Resolução de Dúvidas via Base de Diretrizes Oficial
- US 03 — Continuidade de Conversação e Memória de Sessão
- US 04 — Tratamento de Incerteza e Resposta de Contingência

**Épico 2 — Autoatendimento Transacional e Execução de Serviços**
- US 05 — Consulta Autônoma de Informações e Status
- **US 06 — Abertura e Registro Assistido de Solicitações**
- (US 06 é a tela que está sendo desenvolvida agora — ver seção 8)

**Épico 3 — Transbordo Inteligente e Suporte Humano Assistido**
- US 07 — Transferência de Atendimento por Regras Operacionais
- US 08 — Contextualização e Síntese para o Atendente

**Épico 4 — Gestão Operacional, Curadoria e Governança**
- US 09 — Curadoria de Conteúdo e Parametrização do Papel do Assistente
- US 10 — Rótulo de Desfecho Operacional e Pesquisa de Satisfação

---

## 2. Arquitetura definida

| Componente | Abordagem |
|---|---|
| Orquestração e Persona Dinâmica | **Spring AI (`ChatClient`)** — system prompt externalizado via propriedades (US 09) |
| Motor de Inferência | **Meta AI (Llama 3.1 / 3.3)** |
| Persistência de Memória | **`ChatMemory` (Spring AI) + Spring Data JPA** — histórico por sessão (US 03) |
| Execução Transacional | **`@Tool` (Spring AI) + clientes REST** (US 05, US 06) |
| Base de Conhecimento | **Spring AI `VectorStore`** ou *In-Context Augmentation* (US 02, US 09) |
| Estrutura de Dados | **Spring Data JPA + PostgreSQL** (US 01, US 07, US 10) |

> **Importante:** o Spring AI e o provedor de LLM **ainda não estão implementados**. O que existe hoje
> é a base REST + persistência (ver seção 3). As respostas do assistente hoje são apenas dados mockados.

---

## 3. Status atual do backend (o que JÁ existe)

### Stack

| Item | Versão / Detalhe |
|---|---|
| Linguagem | **Java 21** |
| Framework | **Spring Boot 4.1.1** |
| Build | Maven (com Wrapper `mvnw` / `mvnw.cmd`) |
| Web | `spring-boot-starter-webmvc` (Spring MVC, thread-per-request) |
| Persistência | `spring-boot-starter-data-jpa` + **PostgreSQL** (`postgresql` runtime) |
| Validação | `spring-boot-starter-validation` |
| Código boilerplate | Lombok |
| Dev | Spring Boot DevTools |
| Testes | starters `-data-jpa-test`, `-validation-test`, `-webmvc-test` + H2 (escopo test) |
| Servidor | Tomcat embutido, porta **8080** |
| Container | `Dockerfile` multi-stage (build Maven → runtime Temurin 21 JRE) |

### Banco de dados

- **PostgreSQL 16** via `docker-compose.yml` (serviço `db`, porta `5432`)
- **Adminer** para inspeção visual do banco em `http://localhost:8081` (serviço `adminer`)
- `spring.jpa.hibernate.ddl-auto=update` e `spring.jpa.show-sql=true`
- Configuração por variáveis de ambiente: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
  (padrões: `localhost`, `5432`, `chatbot`, `postgres`, `postgres`)
- HikariCP: pool máximo 10, mínimo idle 5, timeout 20s

### Código existente

```
src/main/java/com/example/chatbot/
├── ChatbotApplication.java
├── controller/ChatMessageController.java     # REST em /api/messages
├── model/ChatMessage.java                    # entidade JPA
└── repository/ChatMessageRepository.java     # Spring Data JPA
src/main/resources/
├── application.properties
├── static/index.html                         # placeholder "Hello World" (será substituído pela SPA)
└── templates/                                # vazio
```

---

## 4. Contrato da API

**Base URL local:** `http://localhost:8080`
**Prefixo:** `/api`
**Content-Type:** `application/json`

> Hoje o backend serializa a **entidade diretamente** (não há DTOs ainda). Os nomes de campo abaixo
> são exatamente o que trafega no JSON.

### 4.1 `GET /api/messages`

Retorna todas as mensagens, ordenadas por `timestamp` crescente.

**Resposta — `200 OK`**
```json
[
  {
    "id": 1,
    "sender": "USER",
    "content": "Olá, preciso abrir uma solicitação",
    "timestamp": "2026-10-08T14:32:10.123"
  },
  {
    "id": 2,
    "sender": "ASSISTANT",
    "content": "Olá, Mariana! Como posso ajudar?",
    "timestamp": "2026-10-08T14:32:11.456"
  }
]
```

### 4.2 `POST /api/messages`

Cria uma mensagem. O `timestamp` é gerado automaticamente pelo backend (`@PrePersist`) — **não envie**.

**Requisição**
```json
{
  "sender": "USER",
  "content": "Quero abrir um chamado sobre a fatura"
}
```

**Resposta — `201 Created`** (mesmo objeto, já com `id` e `timestamp`)
```json
{
  "id": 3,
  "sender": "USER",
  "content": "Quero abrir um chamado sobre a fatura",
  "timestamp": "2026-10-08T14:33:02.789"
}
```

> `sender` é um `String` livre hoje (sem enum no backend). **Convenção combinada:** usar
> `"USER"`, `"ASSISTANT"` e `"SYSTEM"`.

### 4.3 `DELETE /api/messages/{id}`

- `204 No Content` — removido com sucesso
- `404 Not Found` — id inexistente

### 4.4 Formato de erro

O backend ainda **não possui `@ControllerAdvice`** nem DTO padronizado de erro. O Spring retorna o
formato padrão dele:

```json
{
  "timestamp": "2026-10-08T14:35:00.000",
  "status": 500,
  "error": "Internal Server Error",
  "path": "/api/messages"
}
```

> **Atenção:** corpos de requisição inválidos podem resultar em `500` (violação de integridade no
> banco), pois ainda não há validação com `@Valid`. O frontend **não deve assumir** que erros de
> entrada virão como `400` com mensagens amigáveis — trate de forma defensiva.

### 4.5 Endpoints planejados (ainda não implementados)

Estes serão necessários para as US e **não existem ainda**. Não os consuma sem confirmar:

- `POST /api/sessions` — iniciar sessão de atendimento (US 01, US 03)
- `GET /api/sessions/{id}/messages` — histórico da sessão
- `POST /api/sessions/{id}/chat` — enviar mensagem ao assistente e receber resposta (LLM)
- `POST /api/requests` — registrar solicitação e retornar protocolo (US 06)
- `POST /api/sessions/{id}/transfer` — solicitar transbordo para humano (US 07)
- `GET /api/metrics/retention` — métricas de retenção e CSAT (US 10)

---

## 5. Modelo de dados atual

### Entidade `ChatMessage` → tabela `tb_messages`

| Campo | Tipo | Restrições |
|---|---|---|
| `id` | Long | PK, auto-incremento (IDENTITY) |
| `sender` | String | obrigatório |
| `content` | String (`TEXT`) | obrigatório |
| `timestamp` | LocalDateTime | obrigatório, gerado no `@PrePersist` |

**Observações para o frontend:**
- `timestamp` é `LocalDateTime` **sem timezone/offset** no formato ISO-8601 (`2026-10-08T14:32:10.123`) —
  trate como horário local do servidor, não faça parsing assumindo UTC.

### Entidades ainda não implementadas (planejadas)

`Sessao`, `Solicitacao`, `Protocolo`, `DesfechoAtendimento`, `DocumentoConhecimento`.

---

## 6. CORS — configurado ✅

O frontend roda em **origem diferente** do backend, portanto **CORS é obrigatório** — e já está
**implementado e testado** no backend.

| Papel | Origem |
|---|---|
| Backend (API) | `http://localhost:8080` |
| Frontend — dev server Vite | `http://localhost:5173` |
| Frontend — preview Vite | `http://localhost:4173` |

### Acordado entre os dois repos

- **Métodos permitidos:** `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`
- **Headers permitidos:** `Content-Type`, `Accept`, `Authorization`, `X-Trace-Id`
- **Headers expostos:** `X-Trace-Id`
- **Credenciais:** a definir (hoje não há autenticação). Se `allowCredentials(true)` for habilitado,
  **não use `allowedOrigins("*")`** — é necessário usar `allowedOriginPatterns` no backend.
- **Preflight:** `OPTIONS` deve funcionar em `/api/**` antes dos endpoints reais.

### Implementação no backend (concluída)

**Arquivos:**

- `src/main/java/com/example/chatbot/config/CorsConfig.java` — registra o CORS em `/api/**`
- `src/main/java/com/example/chatbot/config/CorsProperties.java` — propriedades tipadas com padrões
- `src/test/java/com/example/chatbot/config/CorsConfigTest.java` — testes de preflight

Usa `allowedOriginPatterns` (aceita curingas como `https://*.dominio.com` e é compatível com
`allowCredentials(true)` — combinação inválida com `allowedOrigins("*")`).

**Propriedades** (definidas em `application.properties`, sobrescrevíveis por variáveis de ambiente):

| Propriedade | Padrão | Variável de ambiente |
|---|---|---|
| `app.cors.allowed-origins` | `http://localhost:5173,http://localhost:4173` | `CORS_ALLOWED_ORIGINS` |
| `app.cors.allowed-methods` | `GET,POST,PUT,PATCH,DELETE,OPTIONS` | `CORS_ALLOWED_METHODS` |
| `app.cors.allowed-headers` | `Content-Type,Accept,Authorization,X-Trace-Id` | `CORS_ALLOWED_HEADERS` |
| `app.cors.exposed-headers` | `X-Trace-Id` | `CORS_EXPOSED_HEADERS` |
| `app.cors.max-age` | `3600` | `CORS_MAX_AGE` |
| `app.cors.allow-credentials` | `false` | `CORS_ALLOW_CREDENTIALS` |

> Em produção, basta definir `CORS_ALLOWED_ORIGINS` com os domínios reais — **sem recompilar**.
> Origens não autorizadas recebem `403 Forbidden` e nenhum header de CORS.

#### Como verificar

```bash
./mvnw test -Dtest=CorsConfigTest
```

Cobre dois cenários: preflight de `http://localhost:5173` → `200` com `Access-Control-Allow-Origin`,
`Access-Control-Allow-Methods` e `Access-Control-Allow-Headers`; e preflight de origem não
autorizada → `403` sem nenhum header de CORS.

### Alternativa para desenvolvimento

É possível evitar CORS em dev usando o **proxy do Vite** em `vite.config.ts`:

```ts
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8080',
      changeOrigin: true
    }
  }
}
```

> Mesmo com o proxy em dev, **a configuração de CORS no backend continua necessária** para os
> ambientes de homologação/produção, onde frontend e API ficam em hosts distintos.

### Variável de ambiente do frontend

```
VITE_API_URL=http://localhost:8080
```

---

## 7. Requisitos não-funcionais que afetam o frontend

| Dimensão | Requisito | Impacto no frontend |
|---|---|---|
| **Tempo de Resposta** | P95 ≤ **3 segundos** para consultas padrão | Prever *streaming* (SSE) e feedback de "digitando" para não parecer travado |
| **Privacidade & Segurança** | PII e senhas **nunca** em logs nem em claro | **Mascarar dados sensíveis na UI** (ex.: CPF `***.***.***-**`). Nunca exibir CPF/senha completos |
| **Observabilidade** | **trace ID unificado por conversa** | O frontend deve **enviar o header `X-Trace-Id`** por conversa e exibi-lo em telas de erro/suporte |
| **Resiliência** | Falhas pontuais de integrações não paralisam o atendimento | Toda chamada precisa de estado de erro amigável + botão "Tentar novamente", **sem perder os dados preenchidos** |

---

## 8. Frontend — stack e convenções definidas

### Stack

- **React 18 + TypeScript**
- **Vite** (SPA — não Next.js)
- **Tailwind CSS + shadcn/ui**
- **lucide-react** para ícones
- Idioma da interface: **português do Brasil (pt-BR)**

### Tema visual (azul, preto e branco)

| Token | Valor |
|---|---|
| Primária | `#2563EB` |
| Hover / active | `#1D4ED8` |
| Azul claro de apoio | `#EFF6FF` |
| Fundo | `#FFFFFF` |
| Texto principal | `#0A0A0A` |
| Texto secundário | `#525252` |
| Bordas / divisórias | `#E5E7EB` |
| Superfícies secundárias | `#F8FAFC` |
| Fonte | Inter |
| Radius | `0.75rem` |

Aparência limpa e corporativa, alto contraste, sem gradientes coloridos.

### Convenções de UI

- Sempre prever **4 estados**: `loading`, `empty`, `error`, `success`.
- Erros: mensagem amigável em português, sem *stack trace*, com ação de recuperação.
- Acessibilidade: foco visível (ring azul), labels acessíveis, `aria-live` em regiões dinâmicas
  (como o histórico do chat), navegação por teclado.
- Datas: exibir no formato `dd/MM/yyyy HH:mm` (pt-BR).

### US 06 — tela em desenvolvimento

**Abertura e Registro Assistido de Solicitações**

Fluxo em 5 estados:
1. `collecting` — o assistente coleta os dados **uma pergunta por vez** (slot filling)
2. `review` — resumo do que foi coletado + **validação explícita** da usuária
3. `submitting` — registrando
4. `success` — exibe **protocolo** + estimativa de retorno
5. `error` — falha tratada, dados preservados

**Critérios de aceite (do documento de produto):**
- O assistente recolhe de forma **guiada** os parâmetros mandatórios da solicitação.
- Antes do registro, **resume** as informações coletadas e solicita **validação explícita** da usuária.
- O chamado só é submetido ao sistema corporativo **após confirmação afirmativa**.
- Concluída a transação, a usuária recebe o **código do protocolo** e a **estimativa de retorno**.

**Campos mandatórios (mock atual):**
- Tipo de solicitação: Segunda via de fatura | Reembolso | Alteração cadastral | Suporte técnico
- Descrição detalhada (mín. 20 caracteres)
- Data de ocorrência
- Canal de retorno preferido: E-mail | Telefone | WhatsApp
- Identificação já validada: nome e **CPF mascarado**

**Layout e componentes (shadcn/ui):**

- Header fixo: logo, título "Abertura de Solicitação", badge "Sessão ativa" e botão ghost "Encerrar sessão"
- Desktop em grid de 2 colunas: chat (2/3) + card "Resumo da solicitação" (1/3, `sticky`)
- Mobile: colunas empilhadas, com o resumo em um `Sheet` acionado pelo botão "Ver resumo"
- `Stepper` de 4 etapas: Identificação → Dados da solicitação → Confirmação → Protocolo
- Componentes necessários: `Card`, `Sheet`, `Select`, `Textarea`, `RadioGroup`, `Badge`,
  `Skeleton`, `Alert`, `Toast`, `Button`
- Mensagens do chat: assistente à esquerda (branco com borda), usuária à direita (azul, texto branco)

**Regras de comportamento:**

- O botão "Confirmar e registrar" só habilita com todos os campos obrigatórios válidos.
- O registro **nunca** é automático — exige confirmação afirmativa explícita.
- Cada campo do resumo tem "Editar", que devolve o chat à pergunta correspondente.
- A usuária pode corrigir digitando no chat (ex.: "na verdade o tipo é Reembolso") — o resumo atualiza.
- Auto-scroll para a última mensagem; `Enter` envia, `Shift+Enter` quebra linha.

**Estado de sucesso:** ícone de check em círculo azul, protocolo em fonte monoespaçada
(ex.: `PROT-2025-004871`) com botão de copiar e toast de confirmação, a mensagem
"Retorno previsto em até 3 dias úteis" e os botões "Abrir nova solicitação" (primário) e
"Finalizar atendimento" (outline).

---

## 9. O que ainda NÃO existe no backend (não assumir)

- ❌ **Spring AI** / integração com LLM (Meta AI / Llama) — respostas do assistente são mockadas
- ❌ **`ChatMemory`** e sessões de conversa — hoje há apenas mensagens soltas, sem `sessionId`
- ❌ **Endpoints de sessão, solicitação/protocolo, transbordo e métricas**
- ❌ **Autenticação / autorização**
- ❌ **DTOs, service layer e `@ControllerAdvice`** (erros não são padronizados)
- ❌ **Validação com `@Valid`** nos endpoints
- ❌ **Trace ID / logs estruturados / métricas**
- ❌ **Testes de integração** (existe apenas o teste de CORS, `CorsConfigTest`)

> ✅ **CORS já está configurado e testado** (seção 6) — o frontend pode consumir `/api/**` a partir
> de `http://localhost:5173` sem nenhuma configuração adicional.

---

## 10. Como rodar o backend localmente

```bash
# 1. Subir o banco (PostgreSQL + Adminer)
docker compose up -d

# 2. Rodar a aplicação
./mvnw spring-boot:run          # Linux/macOS
.\mvnw.cmd spring-boot:run      # Windows
```

- API: `http://localhost:8080`
- Adminer (inspeção do banco): `http://localhost:8081` — Sistema `PostgreSQL`, Servidor `db`,
  Usuário `postgres`, Senha `postgres`, Banco `chatbot`

---

## 11. Próximos passos sugeridos (ordem de dependência)

1. ✅ **Backend:** CORS habilitado para `localhost:5173` e `localhost:4173` — *concluído e testado*
2. **Backend:** padronizar DTOs + `@ControllerAdvice` para erros `400` amigáveis
3. **Frontend:** SPA consumindo `GET/POST /api/messages` (base do chat)
4. **Backend:** adicionar `sessionId` em `ChatMessage` + endpoints de sessão (US 03)
5. **Backend:** integrar Spring AI + Meta AI, substituindo respostas mockadas
6. **Backend:** `POST /api/requests` retornando protocolo (US 06)
7. **Ambos:** trace ID ponta a ponta (`X-Trace-Id`) e métricas P95

---

## Anexo A — Convenções técnicas do backend (Spring Boot 4)

Peculiaridades encontradas neste projeto. Relevantes para quem for mexer no backend ou escrever testes.

### Os starters de teste são modulares

| Starter no `pom.xml` | O que traz |
|---|---|
| `spring-boot-starter-test` | *transitivo* via `-data-jpa-test`: `spring-boot-test`, `spring-boot-test-autoconfigure`, JUnit 6, Spring Test 7 |
| `spring-boot-starter-data-jpa-test` | `spring-boot-starter-jdbc-test`, `spring-boot-data-jpa-test` |
| `spring-boot-starter-webmvc-test` | `spring-boot-webmvc-test`, `spring-boot-resttestclient`, `spring-boot-starter-jackson-test` |
| `spring-boot-starter-validation-test` | — |

### `@AutoConfigureMockMvc` mudou de pacote

| Versão | Pacote |
|---|---|
| Spring Boot ≤ 3.x | `org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc` |
| **Spring Boot 4.x** | `org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc` |

### `src/test/resources/application.properties` substitui o principal

Os dois arquivos **não fazem merge**. Como `target/test-classes` vem antes de `target/classes` no
classpath, a versão de teste é a única carregada — ou seja, propriedades definidas só em
`src/main/resources/application.properties` **não existem durante os testes**.

Por isso `CorsProperties` usa `@ConfigurationProperties` com **defaults em código**, em vez de
`@Value` sem default: sem isso, `ChatbotApplicationTests.contextLoads()` falharia com
`Could not resolve placeholder 'app.cors.allowed-origins'`.

> Ao adicionar novas propriedades obrigatórias, prefira `@ConfigurationProperties` com defaults ou
> replique-as em `src/test/resources/application.properties`.

### Banco de dados nos testes

Os testes rodam em **H2 em memória** (`jdbc:h2:mem:testdb`), com `ddl-auto=create-drop` — logo
**não precisam de Docker/PostgreSQL**. O H2 é dependência de escopo `test`.

### Comandos úteis

```bash
./mvnw compile                                    # compilar
./mvnw test                                       # todos os testes
./mvnw test -Dtest=CorsConfigTest                 # apenas os testes de CORS
./mvnw spring-boot:run                            # rodar a aplicação (requer PostgreSQL)
```

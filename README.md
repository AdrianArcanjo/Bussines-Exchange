# Business Exchange

Plataforma web de microtarefas com **recompensa fixa** para intermediação segura de serviços técnicos. O contratante publica um chamado com valor definido, o valor fica **retido em escrow** e só é liberado ao executor depois que a entrega é validada.

Trabalho de Conclusão de Curso — Análise e Desenvolvimento de Sistemas, Centro Universitário CEUNI-FAMETRO.

**Autores:** Adrian Arcanjo Araujo · Heverck Jorge da Silva Costa
**Orientadora:** Profa. Luana Leal

## Diferencial

| | 99Freelas | Workana | GetNinjas | **Business Exchange** |
|---|---|---|---|---|
| Preço | Leilão de propostas | Propostas competitivas | Leads pagos pelo prestador | **Valor fixo, sem negociação** |
| Garantia de pagamento | Sem escrow formal | Escrow em projetos grandes | Não retém valor | **Escrow com validação da entrega** |
| Foco | Generalista | Projetos longos | Serviços presenciais | **Microtarefas técnicas pontuais** |

## Tecnologias

- **Frontend:** Angular 21, TypeScript, RxJS (testes com Vitest)
- **Backend:** Node.js, Express, TypeScript, Zod, JWT, bcryptjs, Helmet, CORS e rate limit (testes com Jest e Supertest)
- **Banco de dados:** PostgreSQL, acessado com Prisma ORM

## Estrutura do repositório

```
/                   Frontend Angular
/backend            API Node.js (Express + Prisma)
/backend/prisma     Definição do banco
```

## Como executar

### Pré-requisitos

- Node.js 20 ou superior e npm
- PostgreSQL 13 ou superior (com a extensão `citext` disponível)

### 1. Banco de dados

Crie o banco e aplique o schema:

```bash
createdb -U postgres businessexchange
psql -U postgres -d businessexchange -f 01_schema.sql
```

No Windows, se o `psql` não estiver no PATH, use o pgAdmin: abra o Query Tool no banco `businessexchange`, carregue o `01_schema.sql` e execute.

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env        # no Windows: copy .env.example .env
```

Edite o `.env` com a conexão do seu banco, o segredo do JWT e a origem permitida pelo CORS (`http://localhost:4200`). Depois:

```bash
npm run prisma:generate
npm run dev
```

### 3. Frontend

Em outro terminal, na raiz do repositório:

```bash
npm install
npm start
```

Acesse `http://localhost:4200`. Se o frontend não conseguir falar com a API, confira o valor de `apiUrl` em `src/environments/environment.ts` e o `CORS_ORIGIN` do backend.

## Scripts

| Local | Comando | Função |
|---|---|---|
| Frontend | `npm start` | Servidor de desenvolvimento |
| Frontend | `npm run build` | Build de produção |
| Frontend | `npm test` | Testes unitários |
| Backend | `npm run dev` | API com recarga automática |
| Backend | `npm run build` / `npm start` | Compila e executa |
| Backend | `npm test` | Testes (Jest) |
| Backend | `npm run typecheck` | Verificação de tipos |

## Requisitos

**Funcionais**
1. Cadastro e autenticação de contratantes e executores
2. Publicação de chamados com descrição, categoria e recompensa fixa
3. Aceite de chamados por executores disponíveis
4. Retenção e liberação de pagamento (escrow) após validação
5. Histórico de chamados e recomendação de profissionais

**Não funcionais:** segurança (JWT e SSL/TLS), escalabilidade, usabilidade, confiabilidade (integridade transacional no PostgreSQL) e manutenibilidade (código tipado e modular).

## Regras de negócio no banco

O schema garante a consistência do escrow mesmo fora da aplicação:

- A transação segue a máquina de estados `pendente → retido → liberado | estornado`.
- Um chamado só pode ser aceito com o valor retido e só é concluído depois da liberação do pagamento.
- Avaliações só são permitidas em chamados concluídos e entre as partes envolvidas.
- Cada mudança de status do chamado é registrada em `chamado_historico`.

## Status do projeto

Em desenvolvimento, com gestão por Kanban (GitHub Projects).

| Funcionalidade | Situação |
|---|---|
| Cadastro e login (JWT) | Concluído |
| Modelagem do banco | Concluído |
| Publicação de chamados | Em desenvolvimento |
| Fluxo de pagamento (escrow) | Em desenvolvimento |
| Avaliações, histórico e recomendação | Planejado |

## Qualidade e testes

A avaliação segue a ISO/IEC 25010. Os testes são organizados em três níveis: unitários (Jest e Vitest), de integração (Supertest com PostgreSQL de teste) e de sistema (Cypress). O critério de aceite é cobertura mínima de 70% nos módulos de Chamado e Transação.

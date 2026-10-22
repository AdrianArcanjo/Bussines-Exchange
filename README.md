# Business Exchange — Etapas 1 a 3 (autenticação, chamados/escrow, avaliações e perfil)

Backend único e modular: Node.js + Express + TypeScript + Prisma (PostgreSQL).
Frontend: Angular 17+ (componentes standalone). Banco: `01_schema.sql` (triggers e constraints continuam sendo a última barreira das regras).

## Backend — como rodar

```bash
cd backend
npm install
cp .env.example .env                 # ajuste DATABASE_URL e gere um JWT_SECRET forte
psql -U postgres -d businessexchange -f ../01_schema.sql    # se ainda não aplicou
psql -U postgres -d businessexchange -f prisma/seed.sql     # categorias iniciais
npx prisma generate                  # NÃO rode migrate/db push: o banco é gerido pelo SQL
npm run dev                          # http://localhost:3000
npm test                             # TU-01..05 e TS-03
```

`prisma/schema.prisma` é um espelho escrito à mão do `01_schema.sql` (só colunas, sem relações). Se você mudar uma
tabela no SQL, atualize o schema.prisma e rode `npx prisma generate` de novo.

## Endpoints

Autenticação (etapa 1)

| Método | Rota | Descrição |
|---|---|---|
| POST | `/auth/cadastro` · `/auth/login` · `/auth/refresh` · `/auth/logout` | Ver etapa 1 |
| GET  | `/auth/me` | Perfil do usuário logado |
| GET  | `/categorias` | Lista pública de categorias |

Chamados (etapa 2) — todos exigem `Authorization: Bearer <accessToken>`

| Método | Rota | Perfil | O que faz |
|---|---|---|---|
| GET  | `/chamados?q=&categoriaId=&valorMin=&valorMax=&pagina=` | todos | Mural de chamados abertos |
| GET  | `/chamados/meus?status=` | todos | Do contratante (publicados) ou do executor (aceitos) |
| GET  | `/chamados/:id` | todos | Detalhe + `acoes` (quais botões mostrar). Transação, entregas e histórico só para as partes |
| POST | `/chamados` | contratante | Cria o chamado e retém o valor em escrow na mesma transação SQL (TI-01, TI-02) |
| PUT  | `/chamados/:id/aceitar` | executor | `aberto` → `em_andamento` (TI-03) |
| POST | `/chamados/:id/entrega` | executor | `em_andamento` → `em_validacao` |
| POST | `/chamados/:id/validar` | contratante | Libera o pagamento e conclui (TI-04) |
| POST | `/chamados/:id/rejeitar` | contratante | Recusa a entrega com motivo: volta para `em_andamento`, valor segue retido |
| POST | `/chamados/:id/cancelar` | contratante | Só antes do aceite: estorna o valor e cancela (TS-02) |

Avaliações e perfil (etapa 3) — exigem token

| Método | Rota | O que faz |
|---|---|---|
| POST | `/chamados/:id/avaliacoes` | Avaliação mútua `{ nota: 1-5, comentario? }`. Só em chamado concluído, uma por parte; o avaliado é sempre a outra parte. O trigger do banco recalcula `nota_media` e `total_avaliacoes` |
| GET  | `/usuarios/:id` | Perfil público: nota média, avaliações, chamados concluídos, bio/categorias (sem e-mail nem telefone) |
| GET  | `/usuarios/:id/avaliacoes?pagina=` | Avaliações recebidas (paginadas; sem dados do chamado) |

O detalhe do chamado (`GET /chamados/:id`) agora traz `avaliacoes` e `acoes.podeAvaliar`; `GET /chamados/meus` traz
`jaAvaliei`, que o front usa para destacar chamados concluídos ainda sem avaliação.

## Como as regras ficam protegidas

- Cada operação roda numa transação SQL e **trava a linha do chamado** (`SELECT … FOR UPDATE`): dois executores não
  aceitam o mesmo chamado, e aceitar e cancelar não se atropelam.
- As regras estão em `modules/chamados/dominio.ts` (funções puras, com testes). O banco repete as mesmas regras nos
  triggers; se algo escapar, o erro do trigger volta como 409 com a mensagem do banco.
- `app.usuario_id` é definido a cada transação, então `chamado_historico` registra quem fez cada mudança.
- O gateway de pagamento é uma interface (`modules/pagamentos/gateway.ts`) com implementação **simulada**. Para um
  gateway real, implemente `GatewayPagamento` e troque em `pagamento.facade.ts`. Atenção: a chamada ao gateway ocorre
  dentro da transação SQL; com um gateway real, use uma chave de idempotência por transação.

## Frontend

1. Copie `frontend/src/app/{core,shared,features}` e `frontend/src/environments` para o projeto Angular.
2. `app.config.ts` com `provideHttpClient(withInterceptors([authInterceptor]))` (já está no exemplo).
3. Use o `app.routes.ts` deste projeto. As telas logadas ficam dentro do `ShellComponent` (menu superior) protegido por
   `authGuard`; `chamados/novo` exige o perfil contratante. `/chamados` agora é o mural; se você já tinha uma tela
   principal, mantenha-a e aponte a rota para ela.
4. Ajuste `environment.apiUrl`.

Telas: login, cadastro, mural (filtros e paginação), novo chamado, meus chamados (com selo "Avaliar"), detalhe
(aceitar, entregar, validar, recusar, cancelar, escrow, histórico e avaliação) e perfil público (`/usuarios/:id`).

## Decisões de segurança

- Senhas com bcrypt, refresh token com rotação e detecção de reuso, JWT com algoritmo/issuer fixados, rate limit.
- Links de entrega só aceitam `http(s)://` (backend e frontend) e abrem com `rel="noopener noreferrer"`.
- Tokens no `localStorage` são simples para o TCC, mas expostos a XSS; em produção prefira cookie `HttpOnly`.

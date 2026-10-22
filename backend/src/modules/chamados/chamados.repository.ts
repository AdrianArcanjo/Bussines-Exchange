import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { ListagemDto, MeusDto } from './chamados.dto';

const escaparLike = (t: string) => t.replace(/[\\%_]/g, (c) => `\\${c}`);

/** Colunas comuns dos cartões de lista. Numéricos saem como float8 para virarem number no JSON. */
const COLUNAS_RESUMO = Prisma.sql`
  c.id, c.codigo, c.titulo, LEFT(c.descricao, 280) AS "descricao",
  c.status::text AS "status", c.valor_fixo::float8 AS "valorFixo",
  c.prazo_entrega AS "prazoEntrega", c.criado_em AS "criadoEm",
  cat.id::int AS "categoriaId", cat.nome AS "categoria",
  uc.nome AS "contratante", uc.nota_media::float8 AS "contratanteNota",
  ue.nome AS "executor", t.status::text AS "statusTransacao"`;

const JUNCOES_RESUMO = Prisma.sql`
  FROM chamados c
  JOIN categorias cat ON cat.id = c.categoria_id
  JOIN usuarios uc ON uc.id = c.contratante_id
  LEFT JOIN usuarios ue ON ue.id = c.executor_id
  LEFT JOIN transacoes t ON t.chamado_id = c.id`;

async function paginar(where: Prisma.Sql, pagina: number, limite: number, colunasExtras: Prisma.Sql = Prisma.empty) {
  const [itens, total] = await Promise.all([
    prisma.$queryRaw<Record<string, unknown>[]>(Prisma.sql`
      SELECT ${COLUNAS_RESUMO} ${colunasExtras} ${JUNCOES_RESUMO}
      WHERE ${where}
      ORDER BY c.criado_em DESC, c.numero DESC
      LIMIT ${limite} OFFSET ${(pagina - 1) * limite}`),
    prisma.$queryRaw<{ total: number }[]>(Prisma.sql`SELECT count(*)::int AS total FROM chamados c WHERE ${where}`),
  ]);
  return { itens, total: total[0]?.total ?? 0, pagina, limite };
}

export const chamadosRepository = {
  /** Mural: chamados abertos com filtros */
  listarAbertos(f: ListagemDto) {
    const filtros: Prisma.Sql[] = [Prisma.sql`c.status = 'aberto'`];
    if (f.categoriaId) filtros.push(Prisma.sql`c.categoria_id = ${f.categoriaId}`);
    if (f.q) {
      const like = `%${escaparLike(f.q)}%`;
      filtros.push(Prisma.sql`(c.titulo ILIKE ${like} OR c.descricao ILIKE ${like})`);
    }
    if (f.valorMin !== undefined) filtros.push(Prisma.sql`c.valor_fixo >= ${f.valorMin}`);
    if (f.valorMax !== undefined) filtros.push(Prisma.sql`c.valor_fixo <= ${f.valorMax}`);
    return paginar(Prisma.join(filtros, ' AND '), f.pagina, f.limite);
  },

  /** "Meus chamados": como contratante (donos) ou como executor (aceitos) */
  listarMeus(usuarioId: string, tipo: 'contratante' | 'executor', f: MeusDto) {
    const filtros: Prisma.Sql[] = [
      tipo === 'contratante' ? Prisma.sql`c.contratante_id = ${usuarioId}::uuid` : Prisma.sql`c.executor_id = ${usuarioId}::uuid`,
    ];
    if (f.status) filtros.push(Prisma.sql`c.status = ${f.status}::status_chamado`);
    // "jaAvaliei" permite destacar chamados concluídos que ainda esperam a minha avaliação
    const jaAvaliei = Prisma.sql`, EXISTS (SELECT 1 FROM avaliacoes av WHERE av.chamado_id = c.id AND av.avaliador_id = ${usuarioId}::uuid) AS "jaAvaliei"`;
    return paginar(Prisma.join(filtros, ' AND '), f.pagina, f.limite, jaAvaliei);
  },

  async detalhe(id: string) {
    const [chamado] = await prisma.$queryRaw<Record<string, unknown>[]>(Prisma.sql`
      SELECT c.id, c.codigo, c.titulo, c.descricao, c.status::text AS "status",
             c.valor_fixo::float8 AS "valorFixo", c.prazo_entrega AS "prazoEntrega",
             c.criado_em AS "criadoEm", c.aceito_em AS "aceitoEm", c.entregue_em AS "entregueEm",
             c.concluido_em AS "concluidoEm", c.cancelado_em AS "canceladoEm",
             cat.id::int AS "categoriaId", cat.nome AS "categoria",
             c.contratante_id AS "contratanteId", uc.nome AS "contratanteNome", uc.nota_media::float8 AS "contratanteNota",
             c.executor_id AS "executorId", ue.nome AS "executorNome", ue.nota_media::float8 AS "executorNota"
        FROM chamados c
        JOIN categorias cat ON cat.id = c.categoria_id
        JOIN usuarios uc ON uc.id = c.contratante_id
        LEFT JOIN usuarios ue ON ue.id = c.executor_id
       WHERE c.id = ${id}::uuid`);
    return chamado ?? null;
  },

  async transacao(chamadoId: string) {
    const [t] = await prisma.$queryRaw<Record<string, unknown>[]>(Prisma.sql`
      SELECT status::text AS "status", valor::float8 AS "valor",
             retido_em AS "retidoEm", liberado_em AS "liberadoEm", estornado_em AS "estornadoEm"
        FROM transacoes WHERE chamado_id = ${chamadoId}::uuid`);
    return t ?? null;
  },

  entregas: (chamadoId: string) =>
    prisma.$queryRaw<Record<string, unknown>[]>(Prisma.sql`
      SELECT id, descricao, link_url AS "linkUrl", status::text AS "status",
             motivo_rejeicao AS "motivoRejeicao", enviada_em AS "enviadaEm", avaliada_em AS "avaliadaEm"
        FROM entregas WHERE chamado_id = ${chamadoId}::uuid ORDER BY enviada_em`),

  historico: (chamadoId: string) =>
    prisma.$queryRaw<Record<string, unknown>[]>(Prisma.sql`
      SELECT h.status_anterior::text AS "de", h.status_novo::text AS "para", h.criado_em AS "em", u.nome AS "porNome"
        FROM chamado_historico h LEFT JOIN usuarios u ON u.id = h.usuario_id
       WHERE h.chamado_id = ${chamadoId}::uuid ORDER BY h.criado_em, h.id`),
};

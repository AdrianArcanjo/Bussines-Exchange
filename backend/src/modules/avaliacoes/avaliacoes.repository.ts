import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';

export const avaliacoesRepository = {
  doChamado: (chamadoId: string) =>
    prisma.$queryRaw<Record<string, unknown>[]>(Prisma.sql`
      SELECT a.id, a.avaliador_id AS "avaliadorId", ua.nome AS "avaliadorNome",
             a.avaliado_id AS "avaliadoId", a.nota::int AS "nota", a.comentario, a.criado_em AS "criadoEm"
        FROM avaliacoes a JOIN usuarios ua ON ua.id = a.avaliador_id
       WHERE a.chamado_id = ${chamadoId}::uuid
       ORDER BY a.criado_em`),

  /** Avaliações recebidas por um usuário (perfil público). Não expõe dados do chamado. */
  async recebidas(usuarioId: string, pagina: number, limite: number) {
    const [itens, total] = await Promise.all([
      prisma.$queryRaw<Record<string, unknown>[]>(Prisma.sql`
        SELECT a.id, a.nota::int AS "nota", a.comentario, a.criado_em AS "criadoEm", ua.nome AS "avaliadorNome"
          FROM avaliacoes a JOIN usuarios ua ON ua.id = a.avaliador_id
         WHERE a.avaliado_id = ${usuarioId}::uuid
         ORDER BY a.criado_em DESC, a.id
         LIMIT ${limite} OFFSET ${(pagina - 1) * limite}`),
      prisma.$queryRaw<{ total: number }[]>(Prisma.sql`
        SELECT count(*)::int AS total FROM avaliacoes WHERE avaliado_id = ${usuarioId}::uuid`),
    ]);
    return { itens, total: total[0]?.total ?? 0, pagina, limite };
  },
};

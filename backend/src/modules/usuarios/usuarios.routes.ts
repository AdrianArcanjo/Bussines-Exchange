import { Prisma } from '@prisma/client';
import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { AppError } from '../../lib/errors';
import { prisma } from '../../lib/prisma';
import { authenticate } from '../../middlewares/authenticate';
import { paginaSchema } from '../avaliacoes/avaliacoes.dto';
import { avaliacoesRepository } from '../avaliacoes/avaliacoes.repository';
import { idSchema } from '../chamados/chamados.dto';

export const usuariosRouter = Router();
usuariosRouter.use(authenticate);

/** Perfil público e reputação: só dados que a plataforma já mostra nos chamados (sem e-mail/telefone). */
usuariosRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = idSchema.parse(req.params.id);
    const [perfil] = await prisma.$queryRaw<Record<string, unknown>[]>(Prisma.sql`
      SELECT u.id, u.tipo::text AS "tipo", u.nome, u.cidade, u.uf,
             u.nota_media::float8 AS "notaMedia", u.total_avaliacoes::int AS "totalAvaliacoes",
             u.criado_em AS "membroDesde",
             (SELECT count(*)::int FROM chamados c
               WHERE c.status = 'concluido' AND (c.contratante_id = u.id OR c.executor_id = u.id)) AS "chamadosConcluidos",
             e.bio AS "bio", ct.empresa_nome AS "empresa"
        FROM usuarios u
        LEFT JOIN executores e ON e.usuario_id = u.id
        LEFT JOIN contratantes ct ON ct.usuario_id = u.id
       WHERE u.id = ${id}::uuid AND u.ativo`);
    if (!perfil) throw new AppError(404, 'Usuário não encontrado', 'USUARIO_NAO_ENCONTRADO');

    const categorias = await prisma.$queryRaw<{ nome: string }[]>(Prisma.sql`
      SELECT cat.nome FROM executor_categorias ec JOIN categorias cat ON cat.id = ec.categoria_id
       WHERE ec.executor_id = ${id}::uuid ORDER BY cat.nome`);

    res.json({ ...perfil, categorias: categorias.map((c) => c.nome) });
  }),
);

usuariosRouter.get(
  '/:id/avaliacoes',
  asyncHandler(async (req, res) => {
    const id = idSchema.parse(req.params.id);
    const { pagina, limite } = paginaSchema.parse(req.query);
    res.json(await avaliacoesRepository.recebidas(id, pagina, limite));
  }),
);

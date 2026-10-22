import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { prisma } from '../../lib/prisma';

export const categoriasRouter = Router();

// Público: o cadastro de executor também precisa listar as categorias
categoriasRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    res.json(
      await prisma.categorias.findMany({
        where: { ativa: true },
        select: { id: true, nome: true, slug: true },
        orderBy: { nome: 'asc' },
      }),
    );
  }),
);

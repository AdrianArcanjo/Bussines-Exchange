import { Prisma } from '@prisma/client';
import { AppError } from '../../lib/errors';
import { prisma } from '../../lib/prisma';
import { AvaliarDto } from './avaliacoes.dto';
import { resolverAvaliado } from './dominio';

export const avaliacoesService = {
  /**
   * Avaliação mútua (RF-05): só depois da conclusão, uma por parte. O trigger do banco recalcula
   * nota_media e total_avaliacoes do avaliado.
   */
  async avaliar(avaliadorId: string, chamadoId: string, dto: AvaliarDto): Promise<void> {
    const chamado = await prisma.chamados.findUnique({ where: { id: chamadoId } });
    if (!chamado) throw new AppError(404, 'Chamado não encontrado', 'CHAMADO_NAO_ENCONTRADO');

    const avaliadoId = resolverAvaliado(chamado, avaliadorId);

    try {
      await prisma.avaliacoes.create({
        data: {
          chamado_id: chamadoId,
          avaliador_id: avaliadorId,
          avaliado_id: avaliadoId,
          nota: dto.nota,
          comentario: dto.comentario || undefined,
        },
      });
    } catch (e) {
      // UNIQUE (chamado_id, avaliador_id): duplo clique ou duas abas
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new AppError(409, 'Você já avaliou este chamado', 'AVALIACAO_DUPLICADA');
      }
      throw e;
    }
  },
};

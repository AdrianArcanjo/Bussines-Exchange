import { asyncHandler } from '../../lib/asyncHandler';
import { idSchema } from '../chamados/chamados.dto';
import { chamadosService } from '../chamados/chamados.service';
import { avaliacoesService } from './avaliacoes.service';

export const avaliacoesController = {
  avaliar: asyncHandler(async (req, res) => {
    const id = idSchema.parse(req.params.id);
    await avaliacoesService.avaliar(req.user!.id, id, req.body);
    res.status(201).json(await chamadosService.detalhe(req.user!, id));
  }),
};

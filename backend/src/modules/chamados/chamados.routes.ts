import { Router } from 'express';
import { authenticate, requireRole } from '../../middlewares/authenticate';
import { validate } from '../../middlewares/validate';
import { avaliacoesController } from '../avaliacoes/avaliacoes.controller';
import { avaliarSchema } from '../avaliacoes/avaliacoes.dto';
import { chamadosController as c } from './chamados.controller';
import { entregaSchema, publicarSchema, rejeitarSchema } from './chamados.dto';

export const chamadosRouter = Router();

chamadosRouter.use(authenticate); // TS-03: nada aqui é acessível sem token

chamadosRouter.get('/', c.listar);
chamadosRouter.get('/meus', c.meus); // antes de '/:id'
chamadosRouter.post('/', requireRole('contratante'), validate(publicarSchema), c.publicar);
chamadosRouter.get('/:id', c.detalhe);
chamadosRouter.put('/:id/aceitar', requireRole('executor'), c.aceitar);
chamadosRouter.post('/:id/entrega', requireRole('executor'), validate(entregaSchema), c.entregar);
chamadosRouter.post('/:id/validar', requireRole('contratante'), c.validar);
chamadosRouter.post('/:id/rejeitar', requireRole('contratante'), validate(rejeitarSchema), c.rejeitar);
chamadosRouter.post('/:id/cancelar', requireRole('contratante'), c.cancelar);
chamadosRouter.post('/:id/avaliacoes', validate(avaliarSchema), avaliacoesController.avaliar);

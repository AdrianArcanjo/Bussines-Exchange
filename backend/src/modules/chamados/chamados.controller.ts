import { asyncHandler } from '../../lib/asyncHandler';
import { listagemSchema, idSchema, meusSchema } from './chamados.dto';
import { chamadosService } from './chamados.service';

export const chamadosController = {
  listar: asyncHandler(async (req, res) => {
    res.json(await chamadosService.listarAbertos(listagemSchema.parse(req.query)));
  }),
  meus: asyncHandler(async (req, res) => {
    res.json(await chamadosService.listarMeus(req.user!, meusSchema.parse(req.query)));
  }),
  detalhe: asyncHandler(async (req, res) => {
    res.json(await chamadosService.detalhe(req.user!, idSchema.parse(req.params.id)));
  }),
  publicar: asyncHandler(async (req, res) => {
    const id = await chamadosService.publicar(req.user!.id, req.body);
    res.status(201).json(await chamadosService.detalhe(req.user!, id));
  }),
  aceitar: asyncHandler(async (req, res) => {
    await chamadosService.aceitar(req.user!, idSchema.parse(req.params.id));
    res.json(await chamadosService.detalhe(req.user!, req.params.id));
  }),
  entregar: asyncHandler(async (req, res) => {
    await chamadosService.entregar(req.user!, idSchema.parse(req.params.id), req.body);
    res.status(201).json(await chamadosService.detalhe(req.user!, req.params.id));
  }),
  validar: asyncHandler(async (req, res) => {
    await chamadosService.validar(req.user!, idSchema.parse(req.params.id));
    res.json(await chamadosService.detalhe(req.user!, req.params.id));
  }),
  rejeitar: asyncHandler(async (req, res) => {
    await chamadosService.rejeitar(req.user!, idSchema.parse(req.params.id), req.body.motivo);
    res.json(await chamadosService.detalhe(req.user!, req.params.id));
  }),
  cancelar: asyncHandler(async (req, res) => {
    await chamadosService.cancelar(req.user!, idSchema.parse(req.params.id));
    res.json(await chamadosService.detalhe(req.user!, req.params.id));
  }),
};

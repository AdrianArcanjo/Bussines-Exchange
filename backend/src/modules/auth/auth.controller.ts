import { NextFunction, Request, RequestHandler, Response } from 'express';
import { authService } from './auth.service';

const handle =
  (fn: (req: Request, res: Response) => Promise<void>): RequestHandler =>
  (req: Request, res: Response, next: NextFunction) =>
    fn(req, res).catch(next);

export const authController = {
  cadastro: handle(async (req, res) => {
    res.status(201).json(await authService.cadastrar(req.body));
  }),
  login: handle(async (req, res) => {
    res.json(await authService.login(req.body));
  }),
  refresh: handle(async (req, res) => {
    res.json(await authService.renovar(req.body.refreshToken));
  }),
  logout: handle(async (req, res) => {
    await authService.sair(req.body.refreshToken);
    res.status(204).send();
  }),
  me: handle(async (req, res) => {
    res.json(await authService.perfil(req.user!.id));
  }),
};

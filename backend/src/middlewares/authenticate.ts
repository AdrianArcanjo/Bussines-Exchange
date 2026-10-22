import { NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { env, JWT_ISSUER } from '../config/env';
import { AppError } from '../lib/errors';

export type TipoUsuario = 'contratante' | 'executor';

/**
 * Middleware JWT (Chain of Responsibility): autenticação -> autorização -> serviço.
 * Cobre TU-05 (token expirado => 401) e TS-03 (sem token => bloqueado).
 */
export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new AppError(401, 'Token não informado', 'TOKEN_AUSENTE'));
  }

  try {
    const payload = jwt.verify(header.slice(7), env.JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: JWT_ISSUER,
    }) as JwtPayload & { tipo: TipoUsuario };

    if (!payload.sub) throw new jwt.JsonWebTokenError('sub ausente');
    req.user = { id: payload.sub, tipo: payload.tipo };
    next();
  } catch (e) {
    if (e instanceof jwt.TokenExpiredError) {
      return next(new AppError(401, 'Token expirado', 'TOKEN_EXPIRED'));
    }
    next(new AppError(401, 'Token inválido', 'TOKEN_INVALID'));
  }
}

/** Autorização por perfil: router.post('/', authenticate, requireRole('contratante'), ...) */
export const requireRole =
  (...tipos: TipoUsuario[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !tipos.includes(req.user.tipo)) {
      return next(new AppError(403, 'Acesso negado para este perfil', 'ACESSO_NEGADO'));
    }
    next();
  };

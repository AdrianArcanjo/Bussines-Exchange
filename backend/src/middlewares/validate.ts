import { NextFunction, Request, Response } from 'express';
import { ZodTypeAny } from 'zod';

/** Valida e normaliza req.body com um schema Zod (DTO de entrada). */
export const validate =
  (schema: ZodTypeAny) => (req: Request, _res: Response, next: NextFunction) => {
    req.body = schema.parse(req.body);
    next();
  };

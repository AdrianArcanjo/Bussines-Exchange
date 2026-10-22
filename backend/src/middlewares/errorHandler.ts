import { Prisma } from '@prisma/client';
import { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../lib/errors';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      code: 'VALIDACAO',
      message: 'Dados inválidos',
      erros: err.issues.map((i) => ({ campo: i.path.join('.'), mensagem: i.message })),
    });
  }
  if (err instanceof AppError) {
    return res.status(err.status).json({ code: err.code, message: err.message });
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({ code: 'DUPLICADO', message: 'E-mail ou CPF/CNPJ já cadastrado' });
    }
    if (err.code === 'P2003') {
      return res.status(400).json({ code: 'REFERENCIA_INVALIDA', message: 'Referência inválida (ex.: categoria inexistente)' });
    }
  }
  // RAISE EXCEPTION dos triggers do banco (última barreira das regras de negócio)
  if (err instanceof Prisma.PrismaClientUnknownRequestError) {
    const m = /ERROR:\s*(.+)/.exec(err.message);
    if (m) return res.status(409).json({ code: 'REGRA_DE_NEGOCIO', message: m[1].split('\n')[0].trim() });
  }
  console.error(err);
  res.status(500).json({ code: 'ERRO_INTERNO', message: 'Erro interno do servidor' });
};

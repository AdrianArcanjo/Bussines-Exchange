import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate } from '../../middlewares/authenticate';
import { validate } from '../../middlewares/validate';
import { authController } from './auth.controller';
import { cadastroSchema, loginSchema, refreshSchema } from './auth.dto';

// Freio contra força bruta em login/cadastro
const limitador = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: 'MUITAS_TENTATIVAS', message: 'Muitas tentativas. Aguarde alguns minutos.' },
});

export const authRouter = Router();

authRouter.post('/cadastro', limitador, validate(cadastroSchema), authController.cadastro);
authRouter.post('/login', limitador, validate(loginSchema), authController.login);
authRouter.post('/refresh', validate(refreshSchema), authController.refresh);
authRouter.post('/logout', validate(refreshSchema), authController.logout);
authRouter.get('/me', authenticate, authController.me);

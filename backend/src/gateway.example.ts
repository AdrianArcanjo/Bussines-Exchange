/**
 * EXEMPLO de API Gateway (npm i http-proxy-middleware). Use o MESMO JWT_SECRET dos serviços.
 * - /auth/*     -> auth-service (público)
 * - /chamados/* -> chamados-service (exige JWT; repassa a identidade por cabeçalhos)
 * Não use express.json() no gateway: o corpo da requisição precisa passar intacto pelo proxy.
 */
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { authenticate } from './middlewares/authenticate';

const gateway = express();

gateway.use(createProxyMiddleware({ target: 'http://localhost:3001', pathFilter: '/auth' }));

gateway.use(
  '/chamados',
  authenticate,
  (req, _res, next) => {
    // sobrescreve qualquer valor enviado pelo cliente
    req.headers['x-user-id'] = req.user!.id;
    req.headers['x-user-tipo'] = req.user!.tipo;
    next();
  },
);
gateway.use(createProxyMiddleware({ target: 'http://localhost:3002', pathFilter: '/chamados' }));

gateway.listen(3000);

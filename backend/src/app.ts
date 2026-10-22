import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env';
import { errorHandler } from './middlewares/errorHandler';
import { authRouter } from './modules/auth/auth.routes';
import { categoriasRouter } from './modules/categorias/categorias.routes';
import { chamadosRouter } from './modules/chamados/chamados.routes';
import { usuariosRouter } from './modules/usuarios/usuarios.routes';

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN.split(',') }));
app.use(express.json({ limit: '10kb' }));

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/auth', authRouter);

app.use('/categorias', categoriasRouter);
app.use('/chamados', chamadosRouter);
app.use('/usuarios', usuariosRouter);

app.use(errorHandler);

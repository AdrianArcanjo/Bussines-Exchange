declare global {
  namespace Express {
    interface Request {
      user?: { id: string; tipo: 'contratante' | 'executor' };
    }
  }
}
export {};

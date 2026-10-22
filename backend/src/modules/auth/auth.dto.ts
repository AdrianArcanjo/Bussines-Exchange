import { z } from 'zod';

const senha = z
  .string()
  .min(8, 'A senha deve ter ao menos 8 caracteres')
  .max(72, 'A senha deve ter no máximo 72 caracteres') // limite do bcrypt
  .regex(/[A-Za-z]/, 'A senha deve ter ao menos uma letra')
  .regex(/\d/, 'A senha deve ter ao menos um número');

const base = z.object({
  nome: z.string().trim().min(2, 'Informe o nome').max(120),
  email: z.string().trim().toLowerCase().email('E-mail inválido').max(254),
  senha,
  telefone: z.string().trim().max(20).optional(),
  cidade: z.string().trim().max(80).optional(),
  uf: z.string().trim().length(2, 'UF deve ter 2 letras').toUpperCase().optional(),
});

export const cadastroSchema = z.discriminatedUnion('tipo', [
  base.extend({
    tipo: z.literal('contratante'),
    empresaNome: z.string().trim().max(150).optional(),
    cpfCnpj: z.string().trim().max(18).optional(),
  }),
  base.extend({
    tipo: z.literal('executor'),
    bio: z.string().trim().max(2000).optional(),
    categoriaIds: z.array(z.number().int().positive()).max(20).optional(),
  }),
]);

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('E-mail inválido'),
  senha: z.string().min(1, 'Informe a senha'),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(20),
});

export type CadastroDto = z.infer<typeof cadastroSchema>;
export type LoginDto = z.infer<typeof loginSchema>;

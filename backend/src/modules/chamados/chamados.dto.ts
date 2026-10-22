import { z } from 'zod';

const centavosOk = (v: number) => Math.abs(v * 100 - Math.round(v * 100)) < 1e-6;
const httpUrl = (v: string) => /^https?:\/\//i.test(v);

// TU-02: valorFixo é obrigatório; sem ele o chamado não é criado
export const publicarSchema = z.object({
  titulo: z.string().trim().min(5, 'O título deve ter ao menos 5 caracteres').max(150),
  descricao: z.string().trim().min(20, 'Descreva o problema com ao menos 20 caracteres').max(5000),
  categoriaId: z.number({ required_error: 'Escolha uma categoria' }).int().positive(),
  valorFixo: z
    .number({ required_error: 'Informe o valor da recompensa', invalid_type_error: 'Valor inválido' })
    .positive('O valor deve ser maior que zero')
    .max(1_000_000, 'Valor acima do limite permitido')
    .refine(centavosOk, 'Use no máximo 2 casas decimais'),
  prazoEntrega: z
    .string()
    .datetime({ offset: true })
    .refine((v) => new Date(v) > new Date(), 'O prazo deve estar no futuro')
    .optional(),
});

export const entregaSchema = z.object({
  descricao: z.string().trim().min(10, 'Descreva o que foi entregue (mínimo 10 caracteres)').max(3000),
  linkUrl: z.string().trim().max(500).refine(httpUrl, 'O link deve começar com http:// ou https://').optional(),
});

export const rejeitarSchema = z.object({
  motivo: z.string().trim().min(10, 'Explique o motivo (mínimo 10 caracteres)').max(1000),
});

export const idSchema = z.string().uuid('Identificador inválido');

export const listagemSchema = z.object({
  categoriaId: z.coerce.number().int().positive().optional(),
  q: z.string().trim().max(80).optional(),
  valorMin: z.coerce.number().min(0).optional(),
  valorMax: z.coerce.number().min(0).optional(),
  pagina: z.coerce.number().int().min(1).default(1),
  limite: z.coerce.number().int().min(1).max(50).default(12),
});

export const meusSchema = z.object({
  status: z.enum(['aberto', 'em_andamento', 'em_validacao', 'concluido', 'cancelado']).optional(),
  pagina: z.coerce.number().int().min(1).default(1),
  limite: z.coerce.number().int().min(1).max(50).default(12),
});

export type PublicarDto = z.infer<typeof publicarSchema>;
export type EntregaDto = z.infer<typeof entregaSchema>;
export type ListagemDto = z.infer<typeof listagemSchema>;
export type MeusDto = z.infer<typeof meusSchema>;

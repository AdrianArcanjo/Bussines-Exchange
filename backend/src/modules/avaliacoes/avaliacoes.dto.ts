import { z } from 'zod';

export const avaliarSchema = z.object({
  nota: z
    .number({ required_error: 'Informe a nota', invalid_type_error: 'Nota inválida' })
    .int('A nota deve ser um número inteiro')
    .min(1, 'A nota mínima é 1')
    .max(5, 'A nota máxima é 5'),
  comentario: z.string().trim().max(1000, 'O comentário deve ter no máximo 1000 caracteres').optional(),
});

export const paginaSchema = z.object({
  pagina: z.coerce.number().int().min(1).default(1),
  limite: z.coerce.number().int().min(1).max(50).default(10),
});

export type AvaliarDto = z.infer<typeof avaliarSchema>;

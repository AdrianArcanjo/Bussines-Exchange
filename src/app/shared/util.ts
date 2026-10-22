import { HttpErrorResponse } from '@angular/common/http';
import { Pipe, PipeTransform } from '@angular/core';
import { StatusChamado } from '../core/models/chamado.models';

export const ROTULO_STATUS: Record<StatusChamado, string> = {
  aberto: 'Aguardando execução',
  em_andamento: 'Em andamento',
  em_validacao: 'Em validação',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
};

export function mensagemErro(e: unknown, padrao = 'Algo deu errado. Tente novamente.'): string {
  if (e instanceof HttpErrorResponse) {
    if (e.status === 0) return 'Não foi possível conectar à API. Verifique se o backend está rodando, a URL em environment.apiUrl e o CORS_ORIGIN.';
    if (e.status === 404 && !e.error?.message) return 'Rota não encontrada na API. Confira se environment.apiUrl aponta para este backend.';
    const detalhes = e.error?.erros as { mensagem: string }[] | undefined;
    if (detalhes?.length) return detalhes.map((d) => d.mensagem).join(' ');
    if (typeof e.error?.message === 'string') return e.error.message;
  }
  return padrao;
}

@Pipe({ name: 'brl', standalone: true })
export class BrlPipe implements PipeTransform {
  private readonly fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  transform(valor: number | null | undefined): string {
    return valor === null || valor === undefined ? '' : this.fmt.format(valor);
  }
}

@Pipe({ name: 'dataBr', standalone: true })
export class DataBrPipe implements PipeTransform {
  transform(valor: string | Date | null | undefined, formato: 'curta' | 'hora' = 'curta'): string {
    if (!valor) return '';
    const opcoes: Intl.DateTimeFormatOptions =
      formato === 'hora' ? { dateStyle: 'short', timeStyle: 'short' } : { dateStyle: 'short' };
    return new Intl.DateTimeFormat('pt-BR', opcoes).format(new Date(valor));
  }
}

@Pipe({ name: 'statusLabel', standalone: true })
export class StatusLabelPipe implements PipeTransform {
  transform(status: StatusChamado | null | undefined): string {
    return status ? ROTULO_STATUS[status] : '';
  }
}

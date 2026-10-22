import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'tempoRelativo' })
export class TempoRelativoPipe implements PipeTransform {
  transform(iso: string): string {
    const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (min < 1) return 'agora';
    if (min < 60) return `há ${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24) return `há ${h} h`;
    const d = Math.floor(h / 24);
    return d === 1 ? 'há 1 dia' : `há ${d} dias`;
  }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, delay, of } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { Chamado } from '../../../shared/models/chamado.model';
import { CHAMADOS_MOCK } from './chamados.mock';

/** Única porta de saída para a API de chamados. Componentes nunca usam HttpClient direto. */
@Injectable({ providedIn: 'root' })
export class ChamadosService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/chamados`;

  /** GET /chamados?status=aberto */
  listarAbertos(): Observable<Chamado[]> {
    if (environment.useMock) {
      return of(CHAMADOS_MOCK.filter((c) => c.status === 'aberto')).pipe(delay(400));
    }
    return this.http.get<Chamado[]>(this.base, { params: { status: 'aberto' } });
  }

  /** PUT /chamados/{id}/aceitar (RF-03; mesmo endpoint do teste TI-03). */
  aceitar(id: string): Observable<Chamado> {
    if (environment.useMock) {
      const chamado = CHAMADOS_MOCK.find((c) => c.id === id)!;
      return of({ ...chamado, status: 'em_andamento' as const }).pipe(delay(350));
    }
    return this.http.put<Chamado>(`${this.base}/${id}/aceitar`, {});
  }
}

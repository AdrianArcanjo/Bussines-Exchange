import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AvaliacaoRecebida, Categoria, ChamadoDetalhe, ChamadoResumo, FiltroMural, NovoChamado, Pagina, PerfilPublico, StatusChamado,
} from '../models/chamado.models';

/** Remove valores vazios para não enviar "?q=&categoriaId=" (o backend rejeitaria números vazios). */
function paraParams(obj: object): HttpParams {
  let params = new HttpParams();
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== null && v !== '') params = params.set(k, String(v));
  }
  return params;
}

@Injectable({ providedIn: 'root' })
export class ChamadosService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  categorias(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${this.api}/categorias`);
  }

  listar(filtro: FiltroMural): Observable<Pagina<ChamadoResumo>> {
    return this.http.get<Pagina<ChamadoResumo>>(`${this.api}/chamados`, { params: paraParams(filtro) });
  }

  meus(status: StatusChamado | '', pagina: number): Observable<Pagina<ChamadoResumo>> {
    return this.http.get<Pagina<ChamadoResumo>>(`${this.api}/chamados/meus`, { params: paraParams({ status, pagina }) });
  }

  detalhe(id: string): Observable<ChamadoDetalhe> {
    return this.http.get<ChamadoDetalhe>(`${this.api}/chamados/${id}`);
  }

  publicar(dados: NovoChamado): Observable<ChamadoDetalhe> {
    return this.http.post<ChamadoDetalhe>(`${this.api}/chamados`, dados);
  }

  aceitar(id: string): Observable<ChamadoDetalhe> {
    return this.http.put<ChamadoDetalhe>(`${this.api}/chamados/${id}/aceitar`, {});
  }

  entregar(id: string, dados: { descricao: string; linkUrl?: string }): Observable<ChamadoDetalhe> {
    return this.http.post<ChamadoDetalhe>(`${this.api}/chamados/${id}/entrega`, dados);
  }

  validar(id: string): Observable<ChamadoDetalhe> {
    return this.http.post<ChamadoDetalhe>(`${this.api}/chamados/${id}/validar`, {});
  }

  rejeitar(id: string, motivo: string): Observable<ChamadoDetalhe> {
    return this.http.post<ChamadoDetalhe>(`${this.api}/chamados/${id}/rejeitar`, { motivo });
  }

  cancelar(id: string): Observable<ChamadoDetalhe> {
    return this.http.post<ChamadoDetalhe>(`${this.api}/chamados/${id}/cancelar`, {});
  }

  avaliar(id: string, nota: number, comentario?: string): Observable<ChamadoDetalhe> {
    return this.http.post<ChamadoDetalhe>(`${this.api}/chamados/${id}/avaliacoes`, { nota, comentario });
  }

  perfil(usuarioId: string): Observable<PerfilPublico> {
    return this.http.get<PerfilPublico>(`${this.api}/usuarios/${usuarioId}`);
  }

  avaliacoesRecebidas(usuarioId: string, pagina: number): Observable<Pagina<AvaliacaoRecebida>> {
    return this.http.get<Pagina<AvaliacaoRecebida>>(`${this.api}/usuarios/${usuarioId}/avaliacoes`, {
      params: paraParams({ pagina }),
    });
  }
}
